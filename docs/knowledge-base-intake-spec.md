# Knowledge Base Document Intake Pipeline

A generic specification for accepting user-submitted content into a Sanity CMS–backed knowledge base. The pipeline analyzes submissions, validates data integrity, recommends field values, detects schema gaps, and writes to Sanity only after review.

This document is **project-agnostic**. Adapt type names, extractors, and validation rules to your domain.

---

## Goals

- Accept documents via API (markdown, HTML, or structured JSON + body text)
- **Detect and propose metadata** automatically (title, type, taxonomy, dates, relationships)
- Run **integrity checks** before anything touches production data
- Surface **actionable recommendations** (field fixes, new tags, schema changes)
- Write to Sanity as **drafts** by default; publish only after explicit approval
- Stay compatible with **Sanity MCP tools** for agent-assisted development and review

## Non-goals (initial version)

- Real-time collaborative editing in the intake API
- Automatic publish without human or explicit API approval
- Full CMS replacement (Sanity Studio remains the editorial UI)
- Generic AI summarization (optional later; hooks provided)

---

## High-level architecture

```
                    ┌─────────────────┐
  Client / Agent ──►│  Intake API     │
                    └────────┬────────┘
                             │
              ┌──────────────┼──────────────┐
              ▼              ▼              ▼
        ┌──────────┐  ┌──────────┐  ┌──────────────┐
        │ Normalize│  │ Extract  │  │ Validate     │
        │ Input    │  │ Metadata │  │ & Recommend  │
        └──────────┘  └──────────┘  └──────┬───────┘
                                            │
                         ┌──────────────────┼──────────────────┐
                         ▼                  ▼                  ▼
                   Analyze report    Create drafts      Publish
                   (no writes)       (Sanity)           (approved)
```

### Core modules

| Module | Responsibility |
|--------|----------------|
| **Normalizer** | Encoding, line endings, format detection (MD/HTML/plain) |
| **Extractor registry** | Pluggable heuristics per content type / source format |
| **Mapper** | Domain model → Sanity document shape |
| **Validator** | Schema rules + business rules + duplicate detection |
| **Recommender** | Confidence-scored suggestions and schema-gap notes |
| **Sanity adapter** | Query, create draft, patch, publish via `@sanity/client` |
| **Report builder** | Single JSON artifact for API responses and CLI output |

Keep CLIs (`analyze`, `submit`, `import-batch`) as thin wrappers over these modules.

---

## API surface

### Endpoints

| Method | Path | Writes to Sanity? | Purpose |
|--------|------|-------------------|---------|
| `POST` | `/v1/intake/analyze` | No | Full report; safe for exploration |
| `POST` | `/v1/intake/submit` | Yes (drafts) | Create/update draft documents |
| `POST` | `/v1/intake/publish` | Yes | Publish previously submitted drafts |
| `GET` | `/v1/intake/schema` | No | Cached view of deployed schema + allowed enums |
| `GET` | `/v1/health` | No | Liveness |

### Request body (analyze / submit)

```typescript
type IntakeRequest = {
  /** Primary content. Required unless `structured` provides body. */
  body: string

  /** MIME or format hint: markdown | html | plain */
  format?: 'markdown' | 'html' | 'plain'

  /** Optional companion summary (stored as related document or embedded field) */
  summary?: string

  /** Caller-provided metadata. Extractors fill gaps; hints win on explicit conflict. */
  metadata?: {
    slug?: string
    title?: string
    subtitle?: string
    kind?: string           // domain-specific type, e.g. article | guide | reference
    language?: string       // ISO 639-1
    publishedAt?: string    // ISO date
    tags?: string[]
    categories?: string[]
    authors?: string[]      // slugs or external IDs, resolved to references
    related?: string[]      // slugs of related entries
    [key: string]: unknown  // extensible; validated against schema
  }

  /** Provenance for audit and deduplication */
  source?: {
    url?: string
    externalId?: string     // stable ID in source system (for idempotent import)
    submittedBy?: string
    license?: string
    retrievedAt?: string
  }

  /** submit only: override extracted values after human review */
  approved?: Partial<IntakeRequest['metadata']>

  /** submit only: skip warnings (not errors) */
  acceptWarnings?: boolean
}
```

### Response: Intake report

```typescript
type IntakeReport = {
  status: 'ready' | 'needs-review' | 'rejected'

  proposed: {
    document: Record<string, unknown>   // Sanity-ready draft payload
    related?: Record<string, unknown>[] // e.g. summary doc, new tags
  }

  extraction: Array<{
    field: string
    value: unknown
    confidence: number      // 0–1
    source: 'heuristic' | 'hint' | 'default' | 'lookup'
    evidence?: string       // human-readable why
  }>

  issues: Array<{
    severity: 'error' | 'warning' | 'info'
    code: string            // stable machine code, e.g. DUPLICATE_SLUG
    field?: string
    message: string
  }>

  recommendations: Array<{
    type: 'field' | 'tag' | 'schema' | 'relationship' | 'cleanup'
    field?: string
    proposed: unknown
    confidence?: number
    reason: string
    alternatives?: unknown[]
  }>

  schemaNotes: Array<{
    severity: 'error' | 'warning' | 'info'
    message: string
    suggestedChange?: string  // e.g. "Add `guide` to entryKind enum"
  }>

  duplicates?: Array<{
    _id: string
    slug?: string
    title?: string
    matchReason: string
  }>
}
```

**Status rules**

- `rejected` — one or more `severity: error` issues; no submit unless caller fixes input
- `needs-review` — warnings only; submit allowed with `acceptWarnings: true`
- `ready` — no errors or warnings (or all warnings explicitly accepted)

---

## Pipeline stages

### 1. Normalize

- Reject empty or below minimum length (configurable word/char threshold)
- Normalize Unicode, line endings, trailing whitespace
- If HTML: optionally convert to markdown or Portable Text (see [Content formats](#content-formats))
- Strip known boilerplate (site chrome, nav, footer) via configurable patterns

### 2. Extract metadata

Use a **registry of extractors** rather than one monolithic function. Each extractor returns partial metadata + confidence.

```typescript
type Extractor = (ctx: ExtractContext) => Partial<ExtractResult>

type ExtractContext = {
  body: string
  format: string
  hints: IntakeRequest['metadata']
  config: ProjectConfig
}
```

**Suggested built-in extractors (enable/disable per project):**

| Extractor | Examples |
|-----------|----------|
| `heading` | First H1 → title; H2 → subtitle |
| `frontmatter` | YAML/TOML block in markdown |
| `byline` | Author, date line under title |
| `typeMarker` | `[Guide]`, `Type: Reference` in header |
| `taxonomy` | Keyword lists, `#tags` in markdown |
| `language` | `franc`, lang attribute, character n-grams |
| `relationships` | "See also", wikilink-style `[[slug]]` |
| `slug` | Derive from title if not provided |
| `wordCount` | For search/display metadata |

**Merge policy:** hints > high-confidence extraction > low-confidence extraction > defaults. Never silently overwrite a caller hint.

**Overrides file:** maintain `config/overrides.json` or similar for known edge cases (equivalent to manual curations in a mature corpus).

### 3. Map to Sanity shape

Transform extracted domain model into document(s) matching your schema.

```typescript
function mapToSanityDraft(extracted: ExtractedEntry, config: ProjectConfig): SanityDraft {
  return {
    _type: config.schema.entryType,   // e.g. 'kbEntry', 'article'
    slug: extracted.slug,
    title: extracted.title,
    // ... fields per schema
    body: extracted.body,
  }
}
```

**Relationships:** resolve slugs to `_ref` via GROQ lookup at submit time, not at analyze time (analyze may report "author slug `jane-d` not found").

### 4. Validate

Two layers:

#### A. Schema validation

- Fetch deployed schema (`get_schema` MCP in dev; cache in production)
- Required fields present
- Enum values allowed (`kind`, `status`, etc.)
- Reference targets exist (or flag for creation)
- Field types match (string/number/date/text/array)

#### B. Business validation (project-specific)

Configure rules in `config/validation-rules.json`:

| Code | Severity | Example rule |
|------|----------|--------------|
| `DUPLICATE_SLUG` | error | Same slug + same collection |
| `DUPLICATE_EXTERNAL_ID` | error | Same `source.externalId` |
| `TITLE_MISSING` | error | No title after extraction |
| `KIND_UNKNOWN` | error | kind not in schema enum |
| `DATE_OUT_OF_RANGE` | warning | publishedAt in future |
| `BODY_TOO_SHORT` | warning | Under N words |
| `UNRESOLVED_REFERENCE` | warning | author slug not in CMS |
| `LOW_CONFIDENCE_KIND` | warning | type detection < 0.7 |
| `INLINE_SUMMARY_IN_BODY` | info | suggest splitting summary |
| `NEW_TAG_PROPOSED` | info | tag slug not in taxonomy |

Validators return `issues[]`; never throw for expected failures.

### 5. Recommend

Beyond pass/fail, emit **recommendations** editors can accept in one click:

- **Field:** "Set `kind` to `guide` (confidence 0.89) — H1 matches `## Guide:` pattern"
- **Tag:** "Add tag `onboarding` or merge with existing `getting-started`"
- **Schema:** "Value `faq` used 12 times in imports but not in schema; add to `entryKind`"
- **Relationship:** "Link to existing entry `authentication` (similar title)"
- **Cleanup:** "Remove `[Draft]` prefix from title"

Optional: semantic similarity via Sanity embeddings (`semantic_search` MCP) for duplicate/near-duplicate detection.

### 6. Write (submit only)

**Draft-first workflow** (Sanity best practice):

1. Query for existing doc by `slug` or `source.externalId`
2. If exists → patch draft (`drafts.{id}` or unpublish-and-patch pattern)
3. If new → `create` without fixed `_id` (let Sanity generate); store `slug` + `externalId` for future upserts
4. Create related drafts (summary, tags) in same transaction batch where possible
5. Return `{ draftIds: string[], report: IntakeReport }`

**Do not auto-publish** unless `POST /publish` is called with explicit IDs.

---

## Sanity integration

### Client setup

```typescript
import { createClient } from '@sanity/client'

const client = createClient({
  projectId: process.env.SANITY_PROJECT_ID,
  dataset: process.env.SANITY_DATASET,
  token: process.env.SANITY_WRITE_TOKEN,  // draft write scope
  apiVersion: '2026-02-01',               // dated version
  useCdn: false,
})
```

Use separate tokens: **read** for analyze (duplicates, schema), **write** for submit.

### Idempotent upsert pattern

Prefer lookup fields over deterministic `_id`s:

```groq
*[_type == "kbEntry" && slug == $slug][0]{ _id, title }
*[_type == "kbEntry" && source.externalId == $externalId][0]{ _id }
```

Sanity guidance: store legacy/source IDs in content fields; avoid encoding relationships in `_id` strings.

### MCP tools (development & agents)

Use during design, review, and one-off imports—not as the production hot path.

| Tool | Use |
|------|-----|
| `list_sanity_rules` / `get_sanity_rules` | Schema, GROQ, migration best practices |
| `get_schema` | Validate against deployed schema |
| `query_documents` | Duplicates, taxonomy inventory, reference resolution |
| `create_documents` | Create drafts from approved report |
| `patch_documents` | Apply reviewer edits |
| `publish_documents` | Go live after approval |
| `read_docs` / `search_docs` | Sanity platform documentation |

Load rules relevant to the task: `schema`, `groq`, `migration`, plus your frontend rule if applicable.

---

## Suggested Sanity schema (starter)

Adapt names to your domain. Keep **data over presentation** (model what things are, not how they look).

### `kbEntry` (main document)

| Field | Type | Notes |
|-------|------|-------|
| `title` | string | required |
| `slug` | slug | required; unique |
| `subtitle` | string | optional English/display subtitle |
| `kind` | string | controlled list: article, guide, reference, glossary, … |
| `status` | string | draft, review, published (or use Sanity draft system only) |
| `body` | text or portableText | see [Content formats](#content-formats) |
| `summary` | text | short abstract; or reference to `kbEntrySummary` |
| `language` | string | ISO code |
| `publishedAt` | datetime | |
| `tags` | array of ref → `tag` | |
| `categories` | array of ref → `category` | |
| `authors` | array of ref → `author` | |
| `relatedEntries` | array of ref → `kbEntry` | |
| `source` | object | `{ url, externalId, license, submittedBy }` |
| `wordCount` | number | computed at intake |
| `lastIntakeAt` | datetime | audit |

### `tag` / `category` / `author`

Reference types for reusable taxonomy. Tags: `slug`, `label`, optional `description`.

### `kbEntrySummary` (optional separate type)

If summaries are generated or edited independently:

- `entry` → ref `kbEntry`
- `body`, `excerpt`

### `intakeLog` (audit)

| Field | Type |
|-------|------|
| `submittedAt` | datetime |
| `submittedBy` | string |
| `source` | object |
| `report` | text (JSON) |
| `draftId` | string |
| `status` | string |

---

## Content formats

Choose one primary storage format in Sanity:

| Format | Pros | Cons |
|--------|------|------|
| **Markdown in `text`** | Simple intake, easy diff, matches most submissions | No rich editing in Studio without plugin |
| **Portable Text** | Native Studio editing, structured blocks | Requires conversion pipeline (`@portabletext/markdown`) |

**Recommendation:** accept markdown at the API; store markdown initially; add Portable Text conversion as a later phase. Intake pipeline should not block on PT conversion.

For HTML sources: `@portabletext/block-tools` + JSDOM, or markdown intermediate.

---

## Security & operations

- **Authentication:** API keys or JWT; never expose write tokens to browsers
- **Rate limiting:** per key, especially on `/submit`
- **Dry run:** `?dryRun=true` on submit returns report without writes
- **CORS:** intake API is server-to-server only by default
- **Secrets:** `SANITY_PROJECT_ID`, `SANITY_DATASET`, `SANITY_READ_TOKEN`, `SANITY_WRITE_TOKEN`
- **Logging:** structured logs + optional `intakeLog` documents for audit trail
- **Webhooks:** on publish → revalidate frontend / trigger index rebuild

---

## Project layout (suggested)

```
/
├── ingest/
│   ├── server.mjs              # HTTP entry (Hono, Express, etc.)
│   ├── routes/
│   │   ├── analyze.mjs
│   │   ├── submit.mjs
│   │   └── publish.mjs
│   └── cli.mjs                 # analyze/submit from filesystem
├── lib/
│   ├── intake/
│   │   ├── pipeline.mjs
│   │   ├── report.mjs
│   │   └── recommender.mjs
│   ├── extract/
│   │   ├── registry.mjs
│   │   ├── heading.mjs
│   │   ├── frontmatter.mjs
│   │   └── ...
│   ├── validate/
│   │   ├── schema.mjs
│   │   └── rules.mjs
│   └── sanity/
│       ├── client.mjs
│       ├── map-entry.mjs
│       └── upsert.mjs
├── config/
│   ├── project.json            # schema type names, thresholds
│   ├── validation-rules.json
│   └── overrides.json            # manual title/kind overrides by externalId
├── studio/                       # Sanity Studio (standalone)
│   └── schemaTypes/
└── docs/
    └── knowledge-base-intake-spec.md   # this file
```

---

## Configuration example (`config/project.json`)

```json
{
  "schema": {
    "entryType": "kbEntry",
    "summaryType": "kbEntrySummary",
    "tagType": "tag"
  },
  "thresholds": {
    "minWordCount": 50,
    "lowConfidenceKind": 0.7
  },
  "extractors": [
    "frontmatter",
    "heading",
    "typeMarker",
    "taxonomy",
    "language",
    "slug",
    "wordCount"
  ],
  "submit": {
    "autoCreateTags": false,
    "autoPublish": false
  }
}
```

---

## Phased implementation

### Phase 1 — Analyze only
- [ ] Extractor registry + 2–3 extractors (heading, frontmatter, slug)
- [ ] Validator with hardcoded rules
- [ ] CLI: `node ingest/cli.mjs analyze ./path/to/doc.md`
- [ ] JSON report output
- **Exit criteria:** submit a markdown file, get accurate proposed title/slug/kind with zero Sanity writes

### Phase 2 — Draft submit
- [ ] Sanity client + upsert by slug / externalId
- [ ] `POST /v1/intake/analyze` and `/submit`
- [ ] Duplicate detection via GROQ
- [ ] Create drafts for entry + optional summary
- **Exit criteria:** document appears in Sanity Studio as draft, editable, not published

### Phase 3 — Recommendations & schema advisor
- [ ] Confidence scores on all extracted fields
- [ ] Schema enum gap detection
- [ ] Tag merge suggestions
- [ ] `intakeLog` audit documents
- **Exit criteria:** report explains *why* each field was proposed; schema notes appear when kind is unknown

### Phase 4 — Production
- [ ] API auth, rate limits, dry-run mode
- [ ] Batch import CLI
- [ ] Publish endpoint with approval gate
- [ ] Webhook on publish for frontend revalidation
- [ ] Optional: embeddings-based near-duplicate detection

---

## Testing strategy

| Layer | Approach |
|-------|----------|
| Extractors | Fixture markdown files → snapshot proposed fields |
| Validators | Table-driven tests per rule code |
| Mapper | Golden files: input MD → expected Sanity JSON |
| Integration | Test dataset + `SANITY_DATASET=staging`; always draft, never publish in CI |
| Regression | Corpus of "tricky" docs (edge cases) checked into `fixtures/` |

---

## Extension points

Document these interfaces so new content types plug in without rewriting the pipeline:

1. **Extractors** — register new heuristics
2. **Validation rules** — add codes in config + handler functions
3. **Mapper** — per-`kind` mapping functions
4. **Recommenders** — optional plugins (semantic similarity, LLM title cleanup)
5. **Normalizers** — per-source boilerplate strippers

---

## Open decisions (fill in per project)

| Decision | Options | Notes |
|----------|---------|-------|
| Body storage | markdown text vs Portable Text | affects Studio UX |
| Tag creation | auto vs manual approval | taxonomy control |
| Publish gate | API-only vs Studio-only | compliance |
| Duplicate policy | block vs warn vs merge | import workflows |
| Summary storage | inline field vs separate document | matches editorial workflow |
| `_id` strategy | Sanity-generated vs deterministic | prefer generated + slug lookup |

---

## References

- [Sanity schema rules](https://www.sanity.io/docs) — load via MCP `get_sanity_rules({ rules: ["schema"] })`
- [Sanity migration rules](https://www.sanity.io/docs) — `migration`, `migration-html-import`
- [GROQ query patterns](https://www.sanity.io/docs/groq) — `get_sanity_rules({ rules: ["groq"] })`
- `@sanity/client` — production writes
- `@portabletext/markdown` — markdown ↔ Portable Text when needed

---

## Quick start checklist for a new repo

1. Initialize Sanity Studio with `kbEntry`, `tag`, and optional `kbEntrySummary` types
2. Copy this spec into `docs/`
3. Implement Phase 1 CLI against local markdown fixtures
4. Connect analyze endpoint to staging Sanity (read-only token)
5. Review reports manually; tune extractors and overrides
6. Enable submit (draft only) when error rate is acceptable
7. Add Studio workflow for editors to publish

**Principle:** analyze freely, submit deliberately, publish explicitly.
