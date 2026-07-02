import * as cheerio from 'cheerio';
import TurndownService from 'turndown';
import { writeFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const DIR = dirname(fileURLToPath(import.meta.url));
const BASE = 'https://www.papalencyclicals.net';
const OUT = join(DIR, 'encyclicals');
const DELAY = 1200;

const turndown = new TurndownService({ headingStyle: 'atx', codeBlockStyle: 'fenced' });
const stats = { html: 0, md: 0, skip: 0, fail: 0 };

function slug(s) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'doc';
}

function delay(ms) {
  return new Promise(r => setTimeout(r, ms));
}

async function fetchHTML(url, retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      const res = await fetch(url, {
        headers: { 'User-Agent': 'Mozilla/5.0 (compatible; EncyclicalDownloader/1.0)' },
        signal: AbortSignal.timeout(30000),
        redirect: 'follow',
      });
      if (res.ok) return { html: await res.text(), finalUrl: res.url };
      if (res.status === 404) return null;
      if (res.status === 429) {
        const wait = parseInt(res.headers.get('retry-after')) * 1000 || 10000;
        await delay(wait);
        continue;
      }
    } catch { }
    await delay(3000);
  }
  return null;
}

async function getPopeList() {
  const result = await fetchHTML(BASE);
  if (!result) throw new Error('Failed to fetch homepage');
  const $ = cheerio.load(result.html);
  const popes = [];

  $('select[name="ListBoxURL"] option').each((_, opt) => {
    const value = $(opt).attr('value');
    const label = $(opt).text().trim();
    if (!value || !label || label === 'Select Pope' || label.startsWith('List all')) return;
    popes.push({ url: value, label });
  });

  return popes;
}

async function getEncyclicalLinks(popeUrl) {
  const result = await fetchHTML(popeUrl);
  if (!result) return [];

  const $ = cheerio.load(result.html);
  const links = [];
  const seen = new Set();

  // Strategy 1: Category archive page with columns.list
  if ($('ul.columns.list').length > 0) {
    $('ul.columns.list > li > a[rel="bookmark"]').each((_, a) => {
      const href = $(a).attr('href');
      if (href && !seen.has(href)) {
        seen.add(href);
        links.push({ url: href, title: $(a).text().trim() });
      }
    });
  }

  // Strategy 2: Custom page with h3:Encyclicals + ul.list
  if (links.length === 0) {
    $('h3').each((_, h3) => {
      if ($(h3).text().trim() === 'Encyclicals') {
        const list = $(h3).next('ul.list');
        if (list.length) {
          list.find('> li').each((_, li) => {
            const a = $(li).children('a').first();
            const href = a.attr('href');
            const text = a.text().trim();
            if (href && text && !seen.has(href)) {
              seen.add(href);
              links.push({ url: href, title: text });
            }
          });
        }
      }
    });
  }

  return links;
}

function extractContent($) {
  // papalencyclicals.net content
  const entry = $('.entry-content').first();
  if (entry.length) {
    entry.find('script, style, iframe, noscript, .sharedaddy, .jp-relatedposts').remove();
    return {
      html: entry.html() || '',
      title: $('.post-title').first().text().trim()
        || $('h1').first().text().trim()
        || $('title').text().replace(/\s*[-–|]\s*Papal Encyclicals.*$/, '').trim(),
      subtitle: $('.post-entry-header h3').first().text().trim(),
      meta: $('.entry-meta').first().text().trim(),
    };
  }

  // Vatican.va content
  const doc = $('div.documento').first();
  if (doc.length) {
    doc.find('script, style, iframe, noscript, .share, .va-tools, .clearfix').remove();
    // Try the inner content div first, otherwise use the whole documento
    const inner = doc.find('div.text.parbase.container.vaticanrichtext').first();
    const contentHtml = inner.length ? inner.html() || '' : doc.html() || '';

    // Extract title - clean up date suffixes like "(14 September 1998)"
    let title = $('h1').first().text().trim()
      || $('title').text().replace(/\s*[-–|]\s*Vatican.*$/i, '').trim()
      || 'Encyclical';
    title = title.replace(/\s*\(.*?\d{4}.*?\)\s*$/, '').trim();

    let subtitle = '';
    // Try to find a proper subtitle (not generic Vatican boilerplate)
    const h2 = $('h2').first();
    if (h2.length) {
      const t = h2.text().trim();
      if (t && t.length < 200 && !/holy see|vatican|pope|supreme pontiff|encyclical/i.test(t)) {
        subtitle = t;
      }
    }

    return { html: contentHtml, title, subtitle, meta: '' };
  }

  return null;
}

async function downloadEncyclical(url, popeSlug) {
  const result = await fetchHTML(url);
  if (!result) {
    stats.fail++;
    return;
  }

  const $ = cheerio.load(result.html);
  const extracted = extractContent($);

  if (!extracted || !extracted.html) {
    stats.fail++;
    return;
  }

  const fileSlug = slug(extracted.title);
  const popeDir = slug(popeSlug.replace(/^category\//, ''));
  const htmlDir = join(OUT, 'html', popeDir);
  const mdDir = join(OUT, 'markdown', popeDir);

  await mkdir(htmlDir, { recursive: true });
  await mkdir(mdDir, { recursive: true });

  const htmlPath = join(htmlDir, `${fileSlug}.html`);
  const mdPath = join(mdDir, `${fileSlug}.md`);

  if (existsSync(htmlPath)) {
    stats.skip++;
    return;
  }

  // Parse author/year from meta if available
  let author = '', year = '';
  if (extracted.meta) {
    const m = extracted.meta.match(/(.+?)\s*[-–]\s*(\d{4})/);
    if (m) { author = m[1].trim(); year = m[2]; }
  }

  const fullHtml = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${extracted.title}</title>
</head>
<body>
<article>
<header>
  <h1>${extracted.title}</h1>
  ${extracted.subtitle ? `<h2>${extracted.subtitle}</h2>` : ''}
  ${author ? `<p class="author">${author}${year ? ` — ${year}` : ''}</p>` : ''}
</header>
${extracted.html}
</article>
</body>
</html>`;

  const markdown = turndown.turndown(fullHtml);

  await writeFile(htmlPath, fullHtml);
  stats.html++;
  await writeFile(mdPath, markdown);
  stats.md++;
}

async function main() {
  console.log('Fetching pope list...');
  const popes = await getPopeList();
  console.log(`Found ${popes.length} popes.`);

  for (const [i, pope] of popes.entries()) {
    const popeSlug = pope.url.replace(/https?:\/\/[^/]+\//, '').replace(/\/?$/, '');
    console.log(`\n[${i + 1}/${popes.length}] ${pope.label} (${pope.url})`);

    const links = await getEncyclicalLinks(pope.url);
    console.log(`  Found ${links.length} encyclical(s)`);

    for (const [j, link] of links.entries()) {
      console.log(`  [${j + 1}/${links.length}] ${link.title}`);
      await downloadEncyclical(link.url, popeSlug);
      await delay(DELAY);
    }
  }

  console.log('\n=== Done ===');
  console.log(`HTML files: ${stats.html}`);
  console.log(`Markdown files: ${stats.md}`);
  console.log(`Skipped (already exist): ${stats.skip}`);
  console.log(`Failed: ${stats.fail}`);
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
