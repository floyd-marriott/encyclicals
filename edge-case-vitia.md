# Edge Case Vitia

*Vitia* (Latin, pl. of *vitium* — faults, defects, errors). A register of anomalies, errors, and quirks in the encyclicals corpus. These are known issues in the source data, the extraction process, or the documents themselves that require human judgment to resolve.

## A. Source Data Errors (papalencyclicals.net / vatican.va)

### A1. Wrong years in author lines

These documents have an incorrect year in their "Pope NAME — YEAR" header line. The year is historically impossible given the pope's pontificate.

| File | Author line | Actual year |
|------|------------|-------------|
| `alex04/dignum-arbitramur-et-congruum` | Pope Alexander IV — 1955 | c. 1255–1261 |
| `sixtus04/superna-caelestis` | Pope Sixtus IV — 2017 | 1482 (canonization of St. Bonaventure) |

Likely cause: HTML parsing error on the source site pulled the wrong date from the page.

### A2. Wrong pope in author line

| File | Author line | Correct pope | Correct year |
|------|------------|-------------|-------------|
| `ben15/quod-iam-diu` | Pope Benedict XVI — 1918 | Benedict XV | 1918 |

Benedict XVI was not pope until 2005. The source erroneously wrote "XVI" instead of "XV".

## B. Metadata Extraction Gaps

### B1. Documents without a detectable type (262 files)

Most medieval and many pre-20th-century documents do not self-identify their type (encyclical, bull, brief, constitution) in machine-detectable text. The filename prefix convention varies:

- `enciclica-*` → encyclical (detected)
- `bolla-*` → bull (detected)
- `breve-*` → brief (detected)
- No prefix → one of the above, but no way to infer automatically

**Notable**: Documents with "ENCYCLICAL LETTER" in the body are detected. Documents lacking this phrase are not.

### B2. Documents without an English title (69 files)

Mostly Benedict XIV Italian-translated files (32) and various medieval documents. These genuinely have no English subject heading — just the Latin incipit.

#### All 32 ben14 translated files (no English subject line)
- `ben14/bolla-benedictus-deus`
- `ben14/bolla-officii-nostri`
- `ben14/bolla-providas-romanorum`
- `ben14/breve-cum-multorum-charitate`
- `ben14/breve-enciclica-pro-eximia-tua`
- `ben14/breve-in-suprema-catholicae`
- `ben14/breve-in-suprema-universalis`
- `ben14/breve-non-ambigimus`
- `ben14/breve-quam-ex-sublimi`
- `ben14/breve-quemadmodum-nihil`
- `ben14/enciclica-accepimus-praestantium`
- `ben14/enciclica-celebrationem-magni`
- `ben14/enciclica-certiores-effecti`
- `ben14/enciclica-cum-illud-semper`
- `ben14/enciclica-cum-semper-oblatas`
- `ben14/enciclica-elapso-proxime-anno`
- `ben14/enciclica-etsi-minime`
- `ben14/enciclica-gravissimo-animi`
- `ben14/enciclica-gravissimum-supremi`
- `ben14/enciclica-inter-caetera`
- `ben14/enciclica-inter-omnigenas`
- `ben14/enciclica-inter-praeteritos`
- `ben14/enciclica-libentissime-quidem`
- `ben14/enciclica-magno-cum-animi`
- `ben14/enciclica-prodiit-jamdudum`
- `ben14/enciclica-quam-grave`
- `ben14/enciclica-quamvis-paternae`
- `ben14/enciclica-quemadmodum-preces`
- `ben14/enciclica-quod-provinciale`
- `ben14/enciclica-satis-vobis-compertum`
- `ben14/breve-enciclica-pro-eximia-tua`
- `pius06/ubi-lutetiam`

#### JP2 encyclicals without H2 subject lines (title null)
- `jp02/redemptor-hominis`
- `jp02/dives-in-misericordia`
- `jp02/dominum-et-vivificantem`
- `jp02/redemptoris-mater`
- `jp02/slavorum-apostoli`

These use a multi-line "ON ..." header block, not an H2. The "ON ..." extraction works for some (centesimus-annus, redemptoris-missio, etc.) but fails when the subject text is formatted as inline body text rather than a discrete header line.

#### Medieval docs with no subject heading
- `alex04/dignum-arbitramur-et-congruum`
- `alex04/inter-ea-quae-placita`
- `alex04/petitionibus-vestris-benignum-impertientes`
- `alex06/inter-caetera`
- `alex07/super-cathedram-principis-apostolorum`
- `ben12/benedictus-deus`
- `ben14/a-quo-primum`
- `ben14/allatae-sunt`
- `ben14/annus-qui-hunc`
- `ben14/apostolica-constitutio`
- `ben14/cum-religiosi`
- `ben14/ex-quo`
- `ben14/magnae-nobis`
- `ben14/nimiam-licentiam`
- `ben14/peregrinantes`
- `ben14/quanta-cura`
- `ben14/ubi-primum`
- `hon03/solet-annuere`
- `innoc04/quae-honorem-conditoris-omnium`
- `pius10/notre-charge-apostolique`
- `pius10/une-fois-encore`
- `pius10/pope-st-pius-x`

### B3. Documents without an addressee (253 files)

The line-based addressee detection requires "To Our/Venerable Brethren/Brothers" at the start of a line. It fails when:

1. **Addressee is embedded mid-sentence** (most ben14 translated files) — the body is a single long line with the addressee in the middle.
2. **Addressee uses the genitive "of" or other introductory phrasing** (medieval docs) — e.g., "Honorius Bishop..." instead of "To...".
3. **Document has no formal addressee** (short decrees, allocutions, papal biographies like `pope-st-pius-x`).

#### Example: ben14 translated files
The addressee is present in the body text (e.g., "To the Venerable Brothers, Patriarchs, Primates...") but it appears mid-line, not at line start. A full-text regex catches some of these but not all.

#### Example: medieval documents
`bon08/unam-sanctam` — opens with "Urged by faith, we are obliged..." and never uses the "To Our Venerable Brethren" formula. The addressee is implied.

### B4. Documents without a closing date (86 files)

These documents lack a "Given at Rome/St. Peter's..." closing formula:

#### Modern (no formal Vatican closing)
- `franc/fratelli-tutti` — ends with a Vatican copyright footer, no "Given at..."
- `jp02/laborem-exercens` — ends with blessing, no closing formula

#### Medieval (all from bon08 and earlier)
- `bon08/unam-sanctam` — date in body ("promulgated November 18, 1302") but no closing formula
- `innoc04/quae-honorem-conditoris-omnium`
- `hon03/solet-annuere`
- `greg09/mira-circa-nos`

#### Various (short documents, biographies)
- `pius10/pope-st-pius-x` — a biography of the pope, not a document
- `alex04/*` — all three Alexander IV docs lack closing dates
- Various short bulls and briefs throughout the corpus

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

32 files from Benedict XIV (31) and Pius VI (1) were originally in Italian and translated via DeepL. These are flagged with `translated: true` and `translationSource: "deepl"`.

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
