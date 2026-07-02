import 'dotenv/config';
import * as cheerio from 'cheerio';
import TurndownService from 'turndown';
import { writeFileSync, mkdirSync, readFileSync, readdirSync } from 'fs';
import { dirname, join } from 'path';

const turndown = new TurndownService({ headingStyle: 'atx', codeBlockStyle: 'fenced' });

const DEEPL_API_KEY = process.env.DEEPL_API_KEY;
if (!DEEPL_API_KEY) {
  console.error('Error: DEEPL_API_KEY not found in .env file');
  console.error('Create a .env file with: DEEPL_API_KEY=your_key_here');
  process.exit(1);
}

const DEEPL_URL = 'https://api-free.deepl.com/v2/translate';

async function translateHTML(htmlContent, retries = 3) {
  const text = htmlContent
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#8217;/g, "'")
    .replace(/&#8220;/g, '"')
    .replace(/&#8221;/g, '"')
    .replace(/&#8211;/g, '-')
    .replace(/&#8212;/g, '--')
    .trim();

  if (!text || text.length < 5) return htmlContent;

  for (let i = 0; i < retries; i++) {
    try {
      const r = await fetch(DEEPL_URL, {
        method: 'POST',
        headers: {
          'Authorization': `DeepL-Auth-Key ${DEEPL_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: [text],
          source_lang: 'IT',
          target_lang: 'EN',
          formality: 'prefer_less',
          preserve_formatting: true,
        }),
      });

      if (!r.ok) {
        const err = await r.text();
        if (r.status === 429) {
          const wait = Math.pow(2, i) * 5000;
          console.log(`    Rate limited, waiting ${wait}ms...`);
          await new Promise(r => setTimeout(r, wait));
          continue;
        }
        throw new Error(`${r.status} ${err}`);
      }

      const data = await r.json();
      return data.translations[0].text;
    } catch (e) {
      if (i === retries - 1) throw e;
      await new Promise(r => setTimeout(r, 3000));
    }
  }
  return htmlContent;
}

function extractContentFromItalianFile(filePath) {
  const html = readFileSync(filePath, 'utf-8');
  const $ = cheerio.load(html, null, false);
  
  const article = $('article').first();
  const header = article.find('header');
  const title = header.find('h1').first().text().trim();
  const subtitle = header.find('h2').first().not('.author').text().trim();
  const author = header.find('.author').text().trim();
  
  // Get the body content (everything after header)
  header.remove();
  const bodyHtml = article.html() || '';
  
  return { title, subtitle, author, bodyHtml, $ };
}

const files = [
  ...readdirSync('encyclicals/html/ben14')
    .filter(f => /^(enciclica|bolla|breve)-/.test(f))
    .map(f => ({ dir: 'ben14', file: f })),
  { dir: 'pius06', file: 'ubi-lutetiam.html' },
];

console.log(`Found ${files.length} Italian files to translate`);
console.log(`DeepL plan: ${DEEPL_URL.includes('free') ? 'Free (500K chars/month)' : 'Pro'}`);
console.log('');

let total = 0;
let ok = 0;
let failed = 0;

for (const { dir, file } of files) {
  const htmlPath = join('encyclicals/html', dir, file);
  const slug = file.replace('.html', '');
  
  console.log(`[${ok + failed + 1}/${files.length}] ${dir}/${slug}`);
  
  try {
    const { title, subtitle, author, bodyHtml, $ } = extractContentFromItalianFile(htmlPath);
    
    const charCount = bodyHtml.replace(/<[^>]+>/g, ' ').replace(/&[^;]+;/g, ' ').replace(/\s+/g, ' ').trim().length;
    total += charCount;
    
    console.log(`  Title: ${title}`);
    console.log(`  Content: ${charCount} chars`);
    
    // Check if content is large - split into chunks for DeepL
    const maxChunk = 50000;
    let paragraphs;
    
    // Parse bodyHtml into block-level elements
    $('article').first().find('> p, > div, > h1, > h2, > h3, > h4').each((i, el) => {
      const html = $(el).html() || '';
      $(el).data('original-html', html);
    });
    
    // We need to work with the raw HTML, parse it into paragraphs
    const blockRegex = /<\/?(?:p|div|h[1-4]|center|blockquote)[^>]*>/gi;
    let parts = [];
    let lastIndex = 0;
    let lastTag = '';
    let match;
    
    while ((match = blockRegex.exec(bodyHtml)) !== null) {
      if (match[0].startsWith('</')) {
        // Closing tag - capture content between last opening and this closing
        const openIndex = bodyHtml.lastIndexOf('<', match.index);
        if (openIndex !== -1 && bodyHtml[openIndex + 1] !== '/') {
          const openTag = bodyHtml.substring(openIndex, bodyHtml.indexOf('>', openIndex) + 1);
          const innerContent = bodyHtml.substring(openIndex + openTag.length, match.index);
          if (innerContent.trim()) {
            parts.push({ open: openTag, content: innerContent, close: match[0] });
          }
        }
      }
    }
    
    // If no structured paragraphs found, treat as single block
    if (parts.length === 0 && bodyHtml.trim()) {
      parts.push({ open: '<p>', content: bodyHtml, close: '</p>' });
    }
    
    // Group paragraphs into chunks under 50K chars for API efficiency
    const chunks = [];
    let currentChunk = [];
    let currentSize = 0;
    
    for (const part of parts) {
      const size = part.content.length;
      if (currentSize + size > maxChunk && currentChunk.length > 0) {
        chunks.push(currentChunk);
        currentChunk = [];
        currentSize = 0;
      }
      currentChunk.push(part);
      currentSize += size;
    }
    if (currentChunk.length > 0) chunks.push(currentChunk);
    
    console.log(`  Sending ${chunks.length} chunk(s) to DeepL...`);
    
    const translatedParts = [];
    
    for (let ci = 0; ci < chunks.length; ci++) {
      const chunk = chunks[ci];
      const combinedText = chunk.map(p => p.content).join('\n\n<p>CHUNK_SEP</p>\n\n');
      
      const translated = await translateHTML(combinedText);
      
      const translatedLines = translated
        .split(/\n{2,}(?:<p>CHUNK_SEP<\/p>\n{2,})?\n{2,}/);
      
      for (let pi = 0; pi < chunk.length; pi++) {
        translatedParts.push({
          open: chunk[pi].open,
          content: translatedLines[pi] || chunk[pi].content,
          close: chunk[pi].close,
        });
      }
      
      if (ci < chunks.length - 1) {
        await new Promise(r => setTimeout(r, 500));
      }
    }
    
    // Rebuild HTML
    const translatedBody = translatedParts.map(p => p.open + p.content + p.close).join('\n');
    
    // Clean up any double spaces and stray markers
    const cleanBody = translatedBody
      .replace(/<p>CHUNK_SEP<\/p>/g, '')
      .replace(/<p>\s*<\/p>/g, '')
      .trim();
    
    // Build output HTML
    const wrapper = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${title}</title>
</head>
<body>
<article>
<header>
  <h1>${title}</h1>
  ${subtitle ? `<h2>${subtitle}</h2>` : ''}
  <p class="author">${author}</p>
</header>
${cleanBody}
</article>
</body>
</html>`;
    
    // Convert to Markdown
    let md = '';
    if (title) md += `# ${title}\n\n`;
    if (subtitle) md += `**${subtitle}**\n\n`;
    if (author) md += `*${author}*\n\n---\n\n`;
    md += turndown.turndown(cleanBody);
    
    // Save
    const outHtmlPath = join('encyclicals/html', dir, file);
    const outMdPath = join('encyclicals/markdown', dir, slug + '.md');
    
    mkdirSync(dirname(outHtmlPath), { recursive: true });
    mkdirSync(dirname(outMdPath), { recursive: true });
    
    writeFileSync(outHtmlPath, wrapper);
    writeFileSync(outMdPath, md);
    
    console.log(`  OK — saved: ${file} (${cleanBody.length} chars)`);
    ok++;
    
    // Delay between files to avoid rate limiting
    await new Promise(r => setTimeout(r, 1500));
    
  } catch (e) {
    console.log(`  FAILED: ${e.message}`);
    failed++;
  }
}

console.log(`\n=== Done ===`);
console.log(`Translated: ${ok}/${files.length}`);
console.log(`Failed: ${failed}`);
console.log(`Total chars sent to DeepL: ~${Math.round(total/1000)}K`);
console.log(`\nCheck remaining Italian files:`);

// Final check
for (const { dir, file } of files) {
  const htmlPath = join('encyclicals/html', dir, file);
  if (!htmlPath) continue;
  const html = readFileSync(htmlPath, 'utf-8');
  const text = html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().substring(0, 200);
  // Quick Italian check
  const itWords = ['il ','la ','le ','gli ','del ','della ','che ','con ','per ','su ','nel ','sono ','questo '];
  let isItalian = 0;
  const lower = text.toLowerCase();
  for (const w of itWords) if (lower.includes(w)) isItalian++;
  console.log(`  ${dir}/${file}: ${isItalian > 3 ? 'STILL ITALIAN' : 'ENGLISH'}`);
}
