import * as cheerio from 'cheerio';
import TurndownService from 'turndown';
import { writeFileSync, mkdirSync, readFileSync, existsSync, rmSync, readdirSync } from 'fs';
import { dirname, join } from 'path';

const turndown = new TurndownService({ headingStyle: 'atx', codeBlockStyle: 'fenced' });

async function fetchWithRetry(url, retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      const r = await fetch(url, {
        headers: { 'User-Agent': 'Mozilla/5.0 (compatible; EncyclicalDownloader/1.0)' },
        signal: AbortSignal.timeout(30000),
        redirect: 'follow',
      });
      if (r.ok) return await r.text();
    } catch (e) {
      if (i === retries - 1) throw e;
      await new Promise(r => setTimeout(r, 2000));
    }
  }
  throw new Error('Failed after retries');
}

function extractVaticanContent($) {
  const doc = $('div.documento').first();
  if (!doc.length) return null;
  
  doc.find('script, style, iframe, noscript, .share, .va-tools, .clearfix').remove();
  const inner = doc.find('div.text.parbase.container.vaticanrichtext').first();
  const html = (inner.length ? inner.html() : doc.html()) || '';
  
  let title = $('h1').first().text().trim()
    || $('title').text().replace(/\s*[-–|]\s*Vatican.*$/i, '').trim()
    || 'Encyclical';
  title = title.replace(/\s*\(.*?\d{4}.*?\)\s*$/, '').trim();

  let subtitle = '';
  const h2 = $('h2').first();
  if (h2.length) {
    const t = h2.text().trim();
    if (t && t.length < 200 && !/holy see|vatican|pope|supreme pontiff|encyclical/i.test(t)) {
      subtitle = t;
    }
  }
  
  return { html, title, subtitle, meta: '' };
}

function extractPapalEncyclicalsContent($) {
  const article = $('article').first();
  const title = article.find('h1').first().text().trim();
  const subtitle = article.find('h2').first().not('.author').text().trim();
  const author = article.find('.author').text().trim();
  
  article.find('header').remove();
  const bodyHtml = article.html() || '';
  return { html: bodyHtml, title, subtitle, meta: author };
}

function slugify(text) {
  return text.toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .replace(/^-|-$/g, '');
}

function isItalian(text) {
  const itWords = new Set(['il','la','le','gli','del','della','delle','dei','un','una','che','con','per','su','nel','nella','sono','questo','questa','degli','dall\'','sul','sulla','sulle','agli','alle','allo','dagli','dalle','dallo','nell\'','all\'','dell\'','anche','dove','come','essere','avere','fatto','parte','ogni','altra','altro','cosa','stato','grande','primo','poco','molto','ancora','sempre','dopo','prima','senza','contro','sopra','sotto','fuori','quale','quali','quanto','quella','quelle','quelli','quello','questa','queste','questi','coloro']);
  const words = text.toLowerCase().replace(/[^a-zàèéìíîòóùú']+/g, ' ').split(/\s+/).filter(w => w.length > 2);
  if (words.length < 10) return false;
  let count = 0;
  for (const w of words) if (itWords.has(w)) count++;
  return count / words.length > 0.08;
}

function makeSlugFromVaticanUrl(url) {
  let pathname = new URL(url).pathname.toLowerCase().replace(/\.html$/, '');
  // Remove the /content/pope-name/xx/ prefix
  pathname = pathname.replace(/\/content\/[^\/]+\/[a-z]{2}\/(encyclicals\/)?documents\//, '');
  // Remove date patterns
  pathname = pathname.replace(/-\d{1,2}-[a-z]+-\d{4}.*$/, '');
  // Clean up
  pathname = pathname.replace(/--+/g, '-').replace(/^-|-$/g, '');
  // Remove trailing -i
  pathname = pathname.replace(/-i$/, '');
  // Remove the double-dash prefix patterns
  pathname = pathname.replace(/^enciclica-i-/, 'enciclica-');
  pathname = pathname.replace(/^bolla-i-/, 'bolla-');
  pathname = pathname.replace(/^breve-i-/, 'breve-');
  pathname = pathname.replace(/^breve-enciclica-i-/, 'breve-enciclica-');
  return pathname;
}

async function translateBen14() {
  console.log('Fetching Benedict XIV page from papalencyclicals.net...');
  const html = await fetchWithRetry('https://www.papalencyclicals.net/category/ben14');
  const $page = cheerio.load(html);
  
  const links = [];
  $page('ul.columns.list a[rel="bookmark"], h3:contains(Encyclical) + ul.list a').each((i, el) => {
    const url = $page(el).attr('href') || '';
    const text = $page(el).text().trim();
    links.push({ title: text, url });
  });
  
  console.log(`Found ${links.length} Benedict XIV documents`);
  
  // Filter to Vatican Italian URLs
  const italianLinks = links.filter(l => l.url.includes('/it/') || (l.url.includes('vatican.va') && !l.url.includes('/en/')));
  // Also check URLs that are from papalencyclicals but have Italian content
  // First, check all ben14 HTML files to identify Italian ones
  const ben14Dir = 'encyclicals/html/ben14';
  const existingFiles = existsSync(ben14Dir) 
    ? readdirSync(ben14Dir).filter(f => f.endsWith('.html'))
    : [];
  
  // Find which existing files are Italian
  const italianFiles = [];
  for (const file of existingFiles) {
    const content = readFileSync(join(ben14Dir, file), 'utf-8');
    const text = content.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().substring(0, 1000);
    if (isItalian(text)) {
      italianFiles.push(file.replace('.html', ''));
    }
  }
  
  console.log(`\nItalian files on disk: ${italianFiles.length}`);
  
  // Map existing Italian files to Vatican URLs
  // For each Italian Vatican URL, try to find which file it corresponds to
  let replaced = 0;
  let failed = 0;
  
  for (const link of italianLinks) {
    const italUrl = link.url;
    const engUrl = italUrl.replace('/it/', '/en/');
    
    // Determine the slug from the Italian URL
    let slug = makeSlugFromVaticanUrl(italUrl);
    
    // Find matching file on disk
    let matchingFile;
    for (const f of italianFiles) {
      // Check if the file slug is contained in the URL or vice versa
      const fClean = f.replace(/^(enciclica-|bolla-|breve-|breve-enciclica-)/, '');
      const sClean = slug.replace(/^(enciclica-|bolla-|breve-|breve-enciclica-)/, '');
      if (f === slug || fClean === sClean || f.replace(/-/g, '') === slug.replace(/-/g, '')) {
        matchingFile = f;
        break;
      }
    }
    
    if (!matchingFile) {
      console.log(`  NO MATCH: "${link.title}" -> ${slug} (file not found among Italian files)`);
      continue;
    }
    
    console.log(`\n[${replaced + 1}/${italianLinks.length}] ${link.title}`);
    console.log(`  IT: ${italUrl}`);
    console.log(`  EN: ${engUrl}`);
    console.log(`  File: ${matchingFile}.html`);
    
    try {
      const engHtml = await fetchWithRetry(engUrl);
      const $ = cheerio.load(engHtml, null, false);
      const extracted = extractVaticanContent($);
      
      if (!extracted || !extracted.html || !extracted.html.trim()) {
        console.log('  FAILED: empty content from English Vatican page');
        failed++;
        continue;
      }
      
      // Use a cleaner slug derived from the English document title
      const cleanTitle = extracted.title;
      let newSlug = slugify(cleanTitle);
      
      // Preserve prefix (enciclica-, breve-, bolla-) for disambiguation
      const prefix = matchingFile.match(/^(enciclica-|bolla-|breve-|breve-enciclica-)/);
      if (prefix) {
        newSlug = prefix[1] + newSlug;
      }
      
      // Build HTML with wrapper
      const wrapper = `<!DOCTYPE html>
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
  <p class="author">Pope Benedict XIV — 1740-1758</p>
</header>
${extracted.html}
</article>
</body>
</html>`;
      
      // Convert to Markdown
      let md = `# ${extracted.title}\n\n`;
      if (extracted.subtitle) md += `**${extracted.subtitle}**\n\n`;
      md += `*Pope Benedict XIV — 1740-1758*\n\n---\n\n`;
      md += turndown.turndown(extracted.html);
      
      // Save files
      const htmlPath = join('encyclicals/html/ben14', newSlug + '.html');
      const mdPath = join('encyclicals/markdown/ben14', newSlug + '.md');
      
      mkdirSync(dirname(htmlPath), { recursive: true });
      mkdirSync(dirname(mdPath), { recursive: true });
      
      writeFileSync(htmlPath, wrapper);
      writeFileSync(mdPath, md);
      
      // Delete old Italian files
      const oldHtmlPath = join('encyclicals/html/ben14', matchingFile + '.html');
      const oldMdPath = join('encyclicals/markdown/ben14', matchingFile + '.md');
      
      // Only delete if the new file is different from the old one
      if (newSlug !== matchingFile) {
        try {
          rmSync(oldHtmlPath);
          if (existsSync(oldMdPath)) rmSync(oldMdPath);
          console.log(`  REPLACED: ${matchingFile} → ${newSlug} (${extracted.html.length} chars)`);
        } catch(e) {
          console.log(`  WARNING: could not delete old files: ${e.message}`);
        }
      } else {
        console.log(`  UPDATED: ${newSlug} (${extracted.html.length} chars)`);
      }
      
      replaced++;
      
    } catch (e) {
      console.log(`  FAILED: ${e.message}`);
      failed++;
    }
    
    // Delay between requests
    await new Promise(r => setTimeout(r, 1500));
  }
  
  console.log(`\n=== Done ===`);
  console.log(`Translated: ${replaced}`);
  console.log(`Failed: ${failed}`);
  
  // Final check: any Italian files remaining?
  console.log(`\n=== Final Italian check ===`);
  for (const file of readdirSync(ben14Dir).filter(f => f.endsWith('.html'))) {
    const content = readFileSync(join(ben14Dir, file), 'utf-8');
    const text = content.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().substring(0, 1000);
    if (isItalian(text)) {
      console.log(`  STILL ITALIAN: ${file}`);
    }
  }
}

translateBen14().catch(console.error);
