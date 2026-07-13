# Metadata Cleanup Plan

Current state: 210 null types / 26 null titles / 183 null addressees / 68 null closing dates (out of 401).

Strategy: add new extraction rules to `extract-metadata.mjs`, re-run, regenerate JSON sidecars, then re-import into Sanity.

---

## 1. Type Detection (210 → target ~30)

### 1a. Modern encyclicals without type (~148 documents)
Leo XIII (72), Pius IX (27), Pius XII (30), plus Pius X, John XXIII, Gregory XVI, Leo XII, Benedict XV, John Paul II.

**Fix:** If a document has a universal addressee (`To the Patriarchs, Primates...`, `To Our Venerable Brethren...`) AND a Latin incipit AND a post-1800 year AND `extractDocumentType` returns null, default to `encyclical-letter`.

**Yield:** ~140 documents typed. Exceptions: apostolic constitutions and bulls that happen to match the pattern.

### 1b. Medieval/pre-modern non-encyclicals (~22 documents)
Bull type (`inter-caetera`, `in-eminenti`, `bolla-*` etc.), apostolic constitutions (`benedictus-deus`, `munificentissimus-deus`), short decrees.

**Fix:** 
- Body text markers: self-describing patterns like "Papal Bull dealing with", "This Constitution", "Bull of Pope", "Constitution issued by Pope"
- Filename prefix: add `constituzione-`, `decretum-`, `bulla-` to existing prefix rules
- The `## On ... / Pope NAME - YEAR` modern heuristic already catches some; look for false negatives

**Yield:** ~18 documents.

### 1c. Special documents (~10 remaining)
Pius XII addresses, radio messages, `pius10/pope-st-pius-x` (biographical).

**Fix:** Address/radio message detection already exists in H2-based rules; may need body-text scan for "Allocution", "Address of", "Christmas Message".

**Yield:** ~8 documents.

### 1d. Acceptable nulls (~10)
Documents that truly have no detectable type (very short medieval decrees, some bulls without self-identification). These can be set to a generic type or left null.

---

## 2. English Title (26 → target ~5)

### 2a. JP2 titles (5 docs)
`dives-in-misericordia`, `redemptoris-mater`, `slavorum-apostoli`, `sollicitudo-rei-socialis`, `veritatis-splendor`.

**Fix:** These follow a pattern: the incipit is the Latin title; the English subtitle appears on the Vatican title page after "ON ..." or is absent. For JP2 documents from `index.json` where englishTitle is null, extract the first `## On ...` / `## At the beginning of ...` line after the addressee block (already partially implemented in `extractEnglishTitle` JP2 pass — check why it missed these).

Alternatively, use known lookup table.

### 2b. Medieval titles (5 docs)
`alex04/*` (3), `eugene04/sicut-dudum`, `greg10/papal-protection-of-the-jews`.

**Fix:** Use the `## ...` H2 heading (already extracted in most cases; check why null). `papal-protection-of-the-jews` has `englishTitle` = incipit, which is already English-named; could just fallback to slug-to-title.

### 2c. Pius XII addresses (10 docs)
`applied-psychology`, `counsel-to-teaching-sisters`, `guiding-principles-of-the-lay-apostolate`, etc.

**Fix:** These have English titles as `## ` headings in the markdown (e.g. `## Applied Psychology`). The extraction should find these. Check if the issue is that the `## ` line is being filtered out by one of the exclusion rules.

### 2d. Other (6 docs)
`pius09/the-syllabus-of-errors`, `pius10/haerent-animo`, `pius10/lamentabili-sane`, `pius10/pope-st-pius-x`, `pius10/the-oath-against-modernism`, `pius12/laetamur-admodum`, `pius12/si-diligis-*`, `pius12/the-function-of-art`, `pius12/...`, `leon14/magnifica-humanitas`.

**Fix:** Sample each to determine if a `## ` heading exists or if this is genuinely absent. Some may need manual curation (known lookup).

### 2e. Acceptable nulls (~5)
Documents where no English title exists (e.g. purely medieval Latin decrees with no English subject heading). Use incipit as fallback display title.

---

## 3. Addressee (183 → target ~40)

### 3a. "Bishop Benedict" bulls pattern (~30 documents, mostly ben14)
Opening with "Bishop Benedict, Servant of the Servants of God. To all the faithful Christians / For perpetual remembrance."

**Fix:** Add extraction rule for `Bishop \w+, servant of the servants of God\.?\s*To (the|all)\s+.+?\.` — capture the "To ..." clause.

### 3b. Medieval papal formula (~12 documents)
Opening with "Gregory/Innocent/etc., bishop, servant of the servants of God, to our beloved sons..." — the pattern has the addressee inline after the pope's name.

**Fix:** Regex: `\w+,\s*bishop,\s*servant of the servants of God,?\s*to\s+(?:our|the)\s+.+?\.` — capture the entire salutation block.

### 3c. Title-page block addressee (~8 modern docs, e.g. ben16/caritas-in-veritate)
Addressee in a title block before the body: `TO THE BISHOPS PRIESTS AND DEACONS...`

**Fix:** In `extractAddressee`, scan for all-caps addressee block after "ENCYCLICAL LETTER" / "OF THE SUPREME PONTIFF" lines.

### 3d. "To all the faithful" variants (~20 docs)
Varying wording: "To all the faithful Christians", "To all the faithful of Christ", "To all the faithful who will read this Letter", "to all the faithful, Salutation and Apostolic Benediction".

**Fix:** Add pattern `To\s+all\s+the\s+faithful[\s,]+(?:Christians|of\s+Christ|who\s+will|Salutation)` to addressee extraction.

### 3e. No formal addressee (~70 documents)
Medieval documents, short decrees, addresses starting with numbered paragraphs, some bulls.

**Fix:** 
- For medieval documents, check if the body has an implied addressee via context (e.g. "to our beloved sons" within the first paragraph)
- For short decrees without any recipient, accept null
- For Pius XII addresses, some have addressee in `## Address of Pope Pius XII to ...` headings

### 3f. Acceptable nulls (~40)
Documents with genuinely no addressee (medieval bulls/decretals, short decrees, allocutions). Mark as `addresseeScope: "unknown"`.

---

## 4. Closing Date (68 → target ~30)

Lower priority — 333/401 already have closing dates. Many remaining are:
- Medieval documents without formal "Given at..." formula (alex04/*, innoc04, hon03, greg09)
- Addresses / radio messages that don't use closing formula
- `franc/fratelli-tutti` (copyright year only)
- `pius10/pope-st-pius-x` (biographical)

---

## 5. Implementation Approach

### 5a. Edit `extract-metadata.mjs` with new rules
Add new helper functions / patterns for each category above. Re-run with `node extract-metadata.mjs` and check the extraction summary.

### 5b. Verify edge cases
- Run `diff` on JSON sidecars before/after to confirm no regressions
- Spot-check 20 documents across different categories
- Update `edge-case-vitia.md` with new counts

### 5c. Re-import to Sanity
After metadata sidecars are regenerated, re-run:
```sh
SANITY_PROJECT_ID=xxx SANITY_TOKEN=yyy node import-to-sanity.mjs
```
(Idempotent — `createOrReplace` with same `_id` = update in place.)

---

## 6. Effort Estimate

| Step | Time |
|------|------|
| Type rules (encyclical default + body-text scans) | 20 min |
| Title rules (JP2 heuristic fix + H2 check for addresses) | 15 min |
| Addressee rules (3 new patterns) | 20 min |
| Run extraction, diff sidecars, spot-check | 10 min |
| Re-import to Sanity | 5 min |
| **Total** | **~1 hour** |
