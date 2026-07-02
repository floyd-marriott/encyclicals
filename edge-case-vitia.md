# Edge Case Vitia

*Vitia* (Latin, pl. of *vitium* — faults, defects, errors). A register of anomalies, errors, and quirks in the encyclicals corpus. These are known issues in the source data, the extraction process, or the documents themselves that require human judgment to resolve.

## Extraction Summary (post-cleanup)

| Field | Count | Notes |
|-------|-------|-------|
| Year | 401/401 | All documents have a year |
| Type | 191/401 | 210 without detectable type |
| English title | 375/401 | 26 without title |
| Addressee | 218/401 | 183 without addressee |
| Closing date | 333/401 | 68 without formal closing |

*Regenerate with `node extract-metadata.mjs`; see `encyclicals/meta/extraction-summary.json`.*

## A. Source Data Errors (papalencyclicals.net / vatican.va)

**Status: mitigated in extraction.** The script discards author-line years outside the pope's pontificate and reconciles pope names against `POPE_INFO`. Corrected values come from closing dates, body text, or filename fallbacks.

### A1. Wrong years in author lines (source still wrong; metadata corrected)

| File | Author line | Corrected metadata year |
|------|------------|------------------------|
| `alex04/dignum-arbitramur-et-congruum` | Pope Alexander IV — 1955 | 1255 (from body text) |
| `sixtus04/superna-caelestis` | Pope Sixtus IV — 2017 | 1482 (from closing date) |

Likely cause: HTML parsing error on the source site pulled the wrong date from the page.

**Also detected:** `nichol05/romanus-pontifex` (author year 2017) and `pius12/sertum-laetitiae` (author year 1931) have impossible author-line years; metadata uses fallback sources.

### A2. Wrong pope in author line (source still wrong; metadata corrected)

| File | Author line | Corrected `pope.name` |
|------|------------|------------------------|
| `ben15/quod-iam-diu` | Pope Benedict XVI — 1918 | Benedict XV |

Benedict XVI was not pope until 2005. The source erroneously wrote "XVI" instead of "XV".

## B. Metadata Extraction Gaps

### B1. Documents without a detectable type (210 files)

Down from 262. Improvements: filename prefixes (`lettera-`, `costituzione-`), first-200-char body scan (`BULL OF`, `BRIEF OF`, `ENCYCLICAL`, etc.), modern structured heuristic (ben15 `## On …` + pope year line), JP2/Benedict XVI/Francis header detection.

Most remaining gaps are medieval and pre-20th-century documents that do not self-identify their type. The filename prefix convention on papalencyclicals.net helps where present:

- `enciclica-*` → encyclical (detected)
- `bolla-*` → bull (detected)
- `breve-*` → brief (detected)
- No prefix → often undetectable; left as `null`

**Resolved examples:** `bon08/unam-sanctam` (bull via "Bull of Pope" in body), ben15 encyclicals (structured header heuristic), JP2 encyclicals (IOANNES PAULUS header).

### B2. Documents without an English title (26 files)

Down from 69.

**Resolved:** All 32 ben14/pius06 DeepL translated files now use the Latin incipit as `englishTitle` when no English subject line exists. JP2 encyclicals with multi-line `ON …` / `on …` header blocks are now extracted (e.g. `jp02/laborem-exercens`, `jp02/dominum-et-vivificantem`, `jp02/centesimus-annus`).

#### Remaining null-title files (26)

Medieval documents and special formats with no English subject heading:

- `alex04/*` (3 files) — Latin-only medieval decrees
- `eugene04/sicut-dudum`, `greg10/papal-protection-of-the-jews`
- `jp02/dives-in-misericordia`, `jp02/redemptoris-mater`, `jp02/slavorum-apostoli`, `jp02/sollicitudo-rei-socialis`, `jp02/veritatis-splendor` — no discrete subject line in source
- `leo13/longinqua-january-6-1895` — date embedded in filename only
- `pius09/the-syllabus-of-errors`, `pius10/haerent-animo`, `pius10/lamentabili-sane`, `pius10/pope-st-pius-x`, `pius10/the-oath-against-modernism`
- `pius12/applied-psychology`, `pius12/counsel-to-teaching-sisters`, `pius12/guiding-principles-of-the-lay-apostolate`, `pius12/laetamur-admodum`, `pius12/papal-directives-for-the-woman-of-today`, `pius12/si-diligis-canonisation-of-st-pius-x`, `pius12/the-function-of-art`, `pius12/the-moral-limits-of-medical-research-and-treatment`, `pius12/the-proofs-for-the-existence-of-god-in-the-light-of-modern-natural-science`, `pius12/the-states-of-perfection`

Non-translated ben14 files with H2 English titles (`ben14/a-quo-primum`, etc.) retain their extracted titles.

### B3. Documents without an addressee (183 files)

Down from 253. Improvements: full-text regex with smart sentence boundaries (skipping `St.`, `Msgr.`, etc.), embedded mid-line addressees in ben14 single-line bodies, JP2 multi-line `To His Venerable Brothers` format, `To the Primate` / `To the Patriarchs` variants, italic-prefixed `_To the …` lines.

Remaining failures:

1. **Bulls/briefs without "To …" formula** — e.g. ben14 `bolla-*` files opening with "Bishop Benedict, Servant of the Servants of God."
2. **Medieval documents** using non-standard address — e.g. `bon08/unam-sanctam` opens with "Urged by faith…" (addressee implied, not stated).
3. **Documents with no formal addressee** — short decrees, allocutions, papal biographies (`pius10/pope-st-pius-x`).

### B4. Documents without a closing date (68 files)

Down from 86. Improvements: `Castel Gandolfo` and other locations, embedded single-line closings in ben14 bodies, italic-wrapped `_Given in Rome…_` closings, `promulgated [month] [day], [year]` pattern for medieval bulls.

**Resolved:** `pius11/ingravescentibus-malis` (Castel Gandolfo), `ben14/enciclica-magno-cum-animi`, `jp02/laborem-exercens`, `bon08/unam-sanctam` (promulgated date).

#### Still without closing date

- `franc/fratelli-tutti` — Vatican copyright footer, no "Given at…"
- Medieval: `alex04/*`, `innoc04/quae-honorem-conditoris-omnium`, `hon03/solet-annuere`, `greg09/mira-circa-nos`
- Addresses/speeches: various `pius12/address-*` and Christmas radio messages
- `pius10/pope-st-pius-x` — biographical entry

## C. Language Ambiguities

### C1. French/Italian filenames with English content

These files have non-English filenames but their body text is entirely in English:

| File | Filename language | Subject |
|------|------------------|---------|
| `leo13/au-milieu-des-sollicitudes` | French | The Church in France |
| `leo13/depuis-le-jour` | French | On the Education of the Clergy |
| `leo13/spesse-volte` | Italian | On Catholic Action in Italy |
| `leo13/vi-e-ben-noto` | Italian | On the Pontifical States |
| `pius10/notre-charge-apostolique` | French | On the Sillon movement |
| `pius10/une-fois-encore` | French | On the separation of Church and State |
| `pius10/pieni-l-animo` | Italian | On the Clergy in Italy |
| `pius10/il-fermo-proposito` | Italian | On Catholic Action |
| `pius11/non-abbiamo-bisogno` | Italian | On Catholic Action in Italy |
| `pius11/mit-brennender-sorge` | German | On the Church in Nazi Germany |
| `john23/le-voci-che-da-tutti` | Italian | On Peace and Christian Reconciliation |

The `language` field is correctly set to `"en"` for all of these since the body content is English.

### C2. Translated files

32 files from Benedict XIV (31) and Pius VI (1) were originally in Italian and translated via DeepL. These are flagged with `translated: true` and `translationSource: "deepl"`. Their `englishTitle` falls back to the incipit when no English subject line exists.

## D. Tag Extraction Limitations

Tags are assigned purely by keyword matching in the english title, incipit, and first 3000 characters of body text. This has several known limitations:

1. **Over-tagging**: A document mentioning "science" in passing gets the `science` tag even if science is not its main subject.
2. **Under-tagging**: Documents on doctrinal topics without explicit keywords in the title/early body may miss relevant tags.
3. **False positives by incipit**: The incipit "Rerum Novarum" triggers the `social-doctrine` tag on documents that merely cite it.

Manual tag curation is recommended before using tags for production filtering.

## E. Corpus Quirks

### E1. Non-encyclical documents in the collection

The corpus includes several documents that are not encyclicals:
- `pius12/address-to-midwives-*` — speech/address
- `pius12/democracy-and-a-lasting-peace` — Christmas radio message
- `pius12/the-internal-order-of-states-and-people` — Christmas radio message
- `pius12/on-psychotherapy-and-religion` — address
- `pius12/applied-psychology` — address
- `pius12/guiding-principles-of-the-lay-apostolate` — discourse
- `pius12/the-function-of-art` — address
- `pius12/the-moral-limits-of-medical-research-and-treatment` — address
- `pius12/the-proofs-for-the-existence-of-god-*` — address
- `pius12/the-states-of-perfection` — address
- `pius12/counsel-to-teaching-sisters` — address
- `pius12/papal-directives-for-the-woman-of-today` — address
- `pius12/on-rural-life` — address
- `pius10/pope-st-pius-x` — biographical summary, not a document
- `pius10/for-the-fiftieth-anniversary-*` — extracts of an allocution
- `pius12/munificentissimus-deus` — Apostolic Constitution (dogmatic definition)
- `pius12/sacramentum-ordinis` — Apostolic Constitution
- `pius12/exsul-familia-nazarethana` — Apostolic Constitution
- Various medieval bulls and briefs

These are retained because they are part of the papal teaching corpus, but users should be aware they are not encyclicals.

### E2. Unusually long filenames

- `pius10/for-the-fiftieth-anniversary-of-the-proclamation-of-the-dogma-of-the-immaculate-conception` — English descriptive title instead of Latin incipit
- `pius12/the-proofs-for-the-existence-of-god-in-the-light-of-modern-natural-science` — 87 characters

### E3. Very short documents

24 documents are under 5 KB. These are genuinely short (medieval bulls, brief decrees), not download failures. The shortest document in the corpus is:

| File | Size | Words | Content |
|------|------|-------|---------|
| `pius05/pro-flock-of-christ` | 226 B | — | Brief decree |
| Various alex04/ files | ~2 KB each | ~300 words | Medieval decrees |

### E4. Special document formats

- **Papal biographical notes**: `pius10/pope-st-pius-x` is a short biographical entry, not a document. It contains the pope's dates and a brief summary.
- **Radio messages**: Several Pius XII "Christmas Messages" are included, historically significant but not encyclicals.
- **English description filenames**: One file (`for-the-fiftieth-anniversary-...`) uses an English descriptive slug instead of the standard Latin incipit convention.

---

*Last updated: July 2, 2026. Total documents audited: 401.*
