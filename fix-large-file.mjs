import 'dotenv/config';
import * as cheerio from 'cheerio';
import TurndownService from 'turndown';
import { readFileSync, writeFileSync } from 'fs';

const DEEPL_API_KEY = process.env.DEEPL_API_KEY;
const turndown = new TurndownService({ headingStyle: 'atx', codeBlockStyle: 'fenced' });

async function fix() {
  const html = readFileSync('encyclicals/html/ben14/enciclica-inter-praeteritos.html', 'utf-8');
  
  const $ = cheerio.load(html, null, false);
  const article = $('article').first();
  const header = article.find('header');
  
  const title = header.find('h1').first().text().trim();
  const author = header.find('.author').text().trim();
  header.remove();
  
  const bodyHtml = article.html() || '';
  
  // Split by paragraphs
  const paraRegex = /(<p[^>]*>[\s\S]*?<\/p>)/g;
  const parts = bodyHtml.match(paraRegex) || [];
  
  console.log(`Found ${parts.length} paragraphs`);
  
  // Batch into groups of 20 for DeepL
  const batchSize = 20;
  const translatedParts = [];
  
  for (let i = 0; i < parts.length; i += batchSize) {
    const batch = parts.slice(i, i + batchSize);
    const texts = batch.map(p => p.replace(/<[^>]+>/g, ''));
    
    const r = await fetch('https://api-free.deepl.com/v2/translate', {
      method: 'POST',
      headers: {
        'Authorization': `DeepL-Auth-Key ${DEEPL_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text: texts,
        source_lang: 'IT',
        target_lang: 'EN',
        formality: 'prefer_less',
      }),
    });
    
    if (!r.ok) {
      const err = await r.text();
      throw new Error(`Batch ${i}: ${r.status} ${err}`);
    }
    
    const data = await r.json();
    for (let pi = 0; pi < data.translations.length; pi++) {
      const styleMatch = batch[pi].match(/<p([^>]*)>/);
      const style = styleMatch ? styleMatch[1] : '';
      translatedParts.push(`<p${style}>${data.translations[pi].text}</p>`);
    }
    
    console.log(`  Batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(parts.length / batchSize)} OK`);
    await new Promise(r => setTimeout(r, 800));
  }
  
  const translatedBody = translatedParts.join('\n');
  
  // Rebuild HTML
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
  <p class="author">${author}</p>
</header>
${translatedBody}
</article>
</body>
</html>`;
  
  writeFileSync('encyclicals/html/ben14/enciclica-inter-praeteritos.html', wrapper);
  
  const md = `# ${title}\n\n*${author}*\n\n---\n\n${turndown.turndown(translatedBody)}`;
  writeFileSync('encyclicals/markdown/ben14/enciclica-inter-praeteritos.md', md);
  
  console.log(`\nDone! Saved ${translatedBody.length} chars of translated HTML`);
}

fix().catch(console.error);
