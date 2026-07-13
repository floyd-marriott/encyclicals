# Encyclicals Project — Plan

## Status

- **Download & translation**: done
- **Metadata extraction**: done — 401 sidecars in `encyclicals/markdown/` co-located with source docs
- **Summaries**: done — 401 files, all validated clean
- **Quality cleanup**: done — 9 restored source files, 6 regenerated summaries, 28 preamble fixes, 3 heading-level fixes, 1 mid-file artifact
- **Restructure**: done — `html/` deleted, `meta/` merged into `markdown/`. One doc = 3 co-located files: `{doc}.md`, `{doc}.json`, `{doc}-summary.md`
- **Extraction script**: updated to output directly to `markdown/`, skip summary files

## Phase 1: Sanity CMS Import (next)

### 1a. Create Studio

```
npx sanity@latest init --yes --project-name "encyclicals" --dataset-default --template clean --typescript --output-path studio
```

Prompts for Sanity login (browser). Creates `studio/` with TypeScript config.

### 1b. Schema types

Two document types in `studio/schemaTypes/`:

**`pope.ts`**
```
slug (string), regnalName (string), number (number),
fullName (string), pontificateStart/End (number), documentCount (number)
```

**`document.ts`**
```
slug (string, unique), incipit (string), englishTitle (string?, enum),
pope (reference → pope), type (string, enum), year (number),
date (string), dateApproximate (boolean), addressee (text?),
addresseeScope (string, enum), language (string, enum),
translated (boolean), translationSource (string?),
tags (array of string), wordCount (number), fileSize (number),
body (portable text), summary (portable text),
rawClosingDate (text?)
```

### 1c. Import script (`import-to-sanity.mjs`)

- Popes imported first, then documents with references
- Reads from local `encyclicals/markdown/{pope}/{doc}.json` + `.md` + `-summary.md`
- Markdown → Portable Text: split by `\n\n`, detect `##` as h2, rest as normal
- `--dry` flag for testing
- Batch upserts via `@sanity/client`

### 1d. Deploy schema + run import

```
cd studio && npx sanity@latest schema deploy
node import-to-sanity.mjs
```

### 1e. Verify

```
sanity documents query '*[_type == "document"]' | wc -l  → 401
sanity documents query '*[_type == "pope"]' | wc -l      → 43
```

---

## Phase 2: Frontend (later)

Options: Next.js + Sanity, Astro + Sanity, or simpler. Decision deferred.

**Feature rough order:**
1. Browse by pope / century / tag
2. Document page (body + metadata + summary)
3. Full-text search
4. Timeline view
5. Random document button

---

## Open Questions

1. **Metadata cleanup** — 210 null types, 26 null titles, 183 null addressees. Import as-is or fix first?
2. **Portable Text fidelity** — full markdown→blocks with bold/italic/lists, or plain paragraphs for V1?
3. **Frontend stack** — Next.js vs Astro vs other?
4. **Search** — Sanity GROQ or external (Algolia/Meilisearch)?
5. **Public or private** — affects deployment choice
