# Frontend Plan — Astro + Sanity

## Stack

- **Astro** (static site generation, server-rendered)
- **@sanity/client** + GROQ for data fetching
- **@portabletext/react** for rendering body/summary blocks
- **Tailwind CSS** for styling
- Deploy to **Vercel** or **Netlify** (Astro adapter)

Project lives at root (`astro.config.mjs`, `src/`), with `studio/` alongside.

---

## Routes

| Route | Page | Description |
|-------|------|-------------|
| `/` | Home | Hero + pope grid + century strip + tag cloud + search bar |
| `/popes` | All Popes | Full pope grid with document counts |
| `/popes/[slug]` | Pope Detail | Pope info + document list, filterable by century/tag |
| `/documents/[pope]/[slug]` | Document | Full body + metadata sidebar + summary |
| `/tags` | All Tags | Tag cloud with document counts |
| `/tags/[tag]` | Tag Filter | Documents matching a tag |
| `/century/[n]` | Century | Documents from a given century (13th–21st) |
| `/timeline` | Timeline | All 401 documents arranged chronologically |
| `/search` | Search | Full-text search results (uses GROQ `*[incipit match $q]`) |
| `/random` | Random | 302 redirect to a random document |

---

## Data Fetching (GROQ)

### Homepage
```groq
// Popes with doc count
*[_type == "pope"] | order(fullName asc) {fullName, slug, documentCount}

// Recent documents (last 5)
*[_type == "encyclical"] | order(year desc) [0..4] {incipit, slug, "pope": pope->fullName, year}

// Tag counts
*[_type == "encyclical"] {tags} → aggregate tag frequency
```

### Pope Detail
```groq
*[_type == "pope" && slug == $slug][0]
*[_type == "encyclical" && pope->slug == $slug] | order(year asc) {
  incipit, slug, type, year, tags, englishTitle
}
```

### Document Detail
```groq
*[_type == "encyclical" && slug == $slug && pope->slug == $pope][0] {
  ..., body, summary, "pope": pope->{fullName, slug}
}
```

### Tag Filter
```groq
*[_type == "encyclical" && $tag in tags] | order(year asc) {
  incipit, slug, year, "pope": pope->{fullName, slug}
}
```

### Century
```groq
*[_type == "encyclical" && year >= $start && year <= $end] | order(year asc)
```

### Search
```groq
*[_type == "encyclical" && incipit match $q] | order(year asc)
```

### Random
```groq
// Get total count, pick random offset
*[_type == "encyclical"] [ceil(random() * count(*[_type == "encyclical"])) - 1] {slug, "pope": pope->slug}
```

### Timeline
```groq
*[_type == "encyclical"] | order(year asc) {
  incipit, slug, year, "pope": pope->{fullName, slug}
}
```

---

## Pages & Components

### `src/pages/index.astro`
- Hero section with search input (submits to `/search?q=...`)
- Pope grid (flex-wrap cards with fullName + documentCount)
- Century strip (13→21 buttons linking to `/century/[n]`)
- Tag cloud (top 20 tags by frequency, sized by count)
- "Surprise me" button → `/random`

### `src/pages/popes/[slug].astro`
- Pope header (name, pontificate years, doc count)
- Document list: table or cards with incipit, year, type, tags
- Optional century/tag filter bar above the list

### `src/pages/documents/[pope]/[slug].astro`
- Mobile: body full-width, metadata below
- Desktop sidebar: metadata (pope, year, date, type, language, addressee, tags, word count)
- Main: Portable Text body rendered with `@portabletext/react`
- Summary section below body (collapsible or always visible)
- Back link to pope page

### `src/pages/tags/index.astro`
- All tags as a cloud, sized by document count
- Each tag links to `/tags/[tag]`

### `src/pages/tags/[tag].astro`
- Tag header with count
- Document list (same format as pope page)

### `src/pages/century/[n].astro`
- Century header
- Document list grouped by pope or year

### `src/pages/timeline.astro`
- Vertical timeline: year markers, documents as cards along the line
- Or simple chronological list grouped by decade

### `src/pages/search.astro`
- Search input (pre-filled from query param)
- Results list
- GROQ `match` query on `incipit` + `englishTitle` + `tags`

### `src/pages/random.astro`
- Astro static page? No — needs server runtime
- Use `Astro.locals` or `export const prerender = false` to fetch random at request time
- Returns 302 redirect to `/documents/[pope]/[slug]`

---

## Component Architecture

```
src/
├── components/
│   ├── PopeCard.astro          — Single pope in grid
│   ├── DocCard.astro            — Single document in a list
│   ├── TagCloud.astro           — Tag cloud (used on home + /tags)
│   ├── CenturyStrip.astro       — Century navigation bar
│   ├── SearchInput.astro        — Search bar
│   ├── MetadataSidebar.astro    — Document metadata panel
│   ├── PortableTextRenderer.astro — Renders Sanity blocks to HTML
│   └── TimelineItem.astro       — Single item in timeline view
├── layouts/
│   └── BaseLayout.astro         — HTML shell, nav, footer
├── lib/
│   └── sanity.js                — Sanity client singleton + GROQ helpers
└── pages/                       — (as above)
```

---

## Setup Steps

```sh
# 1. Create Astro project
npm create astro@latest -- --template basics --typescript --no-install --no-git

# 2. Install deps
npm install @sanity/client @portabletext/react tailwindcss @astrojs/tailwind astro

# 3. Configure Tailwind
npx astro add tailwind

# 4. Configure Sanity client in src/lib/sanity.js
import {createClient} from '@sanity/client'
export const client = createClient({
  projectId: import.meta.env.SANITY_PROJECT_ID,
  dataset: import.meta.env.SANITY_DATASET || 'production',
  apiVersion: '2024-01-01',
  useCdn: true,
})

# 5. Build pages + components
```

---

## Deployment

```sh
npm run build    # static output in dist/
```

For random redirect to work, deploy to Vercel/Netlify with SSR (or use `export const prerender = false` on that page with a server adapter).

Adapter: `@astrojs/vercel` or `@astrojs/netlify` — minimal config.

---

## Effort Estimate

| Task | Time |
|------|------|
| Scaffold Astro + Sanity client + Tailwind | 10 min |
| Pope grid (home + /popes) | 20 min |
| Pope detail page with doc list | 20 min |
| Document detail page (body + metadata + summary) | 30 min |
| Tag cloud + tag filter page | 15 min |
| Century browsing | 10 min |
| Timeline view | 20 min |
| Full-text search | 15 min |
| Random document redirect | 5 min |
| Styling / polish | 30 min |
| **Total** | **~3 hours** |
