# Papal Encyclicals Collection

A complete download of papal encyclicals (~1200s–present) sourced from [papalencyclicals.net](https://www.papalencyclicals.net) and [vatican.va](https://www.vatican.va), saved as both raw HTML and Markdown for use with Sanity CMS.

## Downloads

- **401 HTML files** — `encyclicals/html/{pope-slug}/{doc}.html`
- **401 Markdown files** — `encyclicals/markdown/{pope-slug}/{doc}.md`
- **29 MB total** across 45 popes

## What Was Done

1. **`download-encyclicals.mjs`** — script that crawls papalencyclicals.net for all 45 popes, extracts encyclical links, downloads content from papalencyclicals.net or vatican.va, and saves as HTML + Markdown.

2. **Vatican content extraction fix** — selector was matching an empty stub div (`div.text.parbase.vaticanrichtext`) instead of the real content div (`div.text.parbase.container.vaticanrichtext`). Fixed and re-downloaded all 31 Vatican-sourced encyclicals (JP2, Benedict XVI, Francis, Paul VI, Leo XIV).

3. **Italian → English translation** — 32 documents (31 from Benedict XIV, 1 from Pius VI) were only available in Italian. Translated via DeepL API on July 2, 2026. Each translated file includes a note: *"This document was translated from the original Italian into English. Translation provided by DeepL (July 2026)."*

## Language Distribution

| Category | Files |
|----------|-------|
| English (sourced directly) | 369 |
| Italian (sourced directly) | 0 |
| Italian → English (DeepL) | 32 |

## Files per Pope (top 10)

| Pope | Files |
|------|-------|
| Leo XIII (1878–1903) | 88 |
| Pius XII (1939–1958) | 60 |
| Benedict XIV (1740–1758) | 44 |
| Pius IX (1846–1878) | 38 |
| Pius XI (1922–1939) | 31 |
| Pius X (1903–1914) | 25 |
| John Paul II (1978–2005) | 14 |
| John XXIII (1958–1963) | 12 |
| Benedict XV (1914–1922) | 12 |
| Gregory XVI (1831–1846) | 10 |

## Remaining Issues

- **24 files under 5 KB** — genuinely short documents (medieval bulls, brief decrees), not failures. Content is complete.
- **`sollicita-ac-provida`** — external link (users.telenet.be), not downloaded.
- **Vatican II Documents** under Paul VI — not an encyclical, not included.

## Scripts

| Script | Purpose |
|--------|---------|
| `download-encyclicals.mjs` | Full downloader for all popes |
| `translate-italian-deepl.mjs` | DeepL translation of 32 Italian files |
| `fix-large-file.mjs` | Handled one oversized file (138K) by splitting into 8 batches |
| `translated-via-deepl.md` | List of all files translated via DeepL |

## Dependencies

- `cheerio` — HTML parsing
- `turndown` — HTML to Markdown conversion
- `dotenv` — API key management (`.env` file)
