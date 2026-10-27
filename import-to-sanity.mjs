import 'dotenv/config'
import {createClient} from '@sanity/client'
import {readFileSync, existsSync} from 'fs'
import path from 'path'
import {fileURLToPath} from 'url'
import {
  extractExcerpt,
  normalizeSummaryMarkdown,
  summaryDocumentId,
} from './lib/summary.mjs'
import {inferDocumentKind, inferEnglishTitle, tagDocumentId, tagLabelFromSlug} from './lib/tags.mjs'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const DATA_DIR = path.join(__dirname, 'encyclicals/markdown')

const PROJECT_ID = process.env.SANITY_PROJECT_ID
const DATASET = process.env.SANITY_DATASET || 'production'
const TOKEN = process.env.SANITY_TOKEN
const DRY_RUN = process.argv.includes('--dry')

if (!PROJECT_ID || !TOKEN) {
  console.error('Missing required env vars: SANITY_PROJECT_ID, SANITY_TOKEN')
  process.exit(1)
}

const client = createClient({
  projectId: PROJECT_ID,
  dataset: DATASET,
  token: TOKEN,
  useCdn: false,
  apiVersion: '2024-01-01',
})

async function main() {
  const popesData = JSON.parse(readFileSync(path.join(DATA_DIR, 'popes.json'), 'utf-8'))
  const indexData = JSON.parse(readFileSync(path.join(DATA_DIR, 'index.json'), 'utf-8'))

  const popeIdMap = {}

  const allTagSlugs = new Set()
  for (const entry of indexData.documents) {
    const meta = JSON.parse(
      readFileSync(path.join(DATA_DIR, entry.popeSlug, `${entry.slug}.json`), 'utf-8'),
    )
    for (const t of meta.tags || []) allTagSlugs.add(t)
  }

  for (const tagSlug of allTagSlugs) {
    const tagDoc = {
      _type: 'tag',
      _id: tagDocumentId(tagSlug),
      slug: tagSlug,
      label: tagLabelFromSlug(tagSlug),
    }
    if (DRY_RUN) {
      console.log(`[DRY] tag: ${tagSlug}`)
    } else {
      await client.createOrReplace(tagDoc)
    }
  }

  for (const pope of popesData.popes) {
    const doc = {
      _type: 'pope',
      _id: `pope-${pope.slug}`,
      slug: pope.slug,
      regnalName: pope.regnalName,
      number: pope.number,
      fullName: pope.fullName,
      pontificateStart: pope.pontificateStart,
      pontificateEnd: pope.pontificateEnd,
    }
    if (DRY_RUN) {
      console.log(`[DRY] pope: ${pope.fullName}`)
    } else {
      await client.createOrReplace(doc)
      console.log(`pope: ${pope.fullName}`)
    }
    popeIdMap[pope.slug] = doc._id
  }

  const total = indexData.documents.length
  for (let i = 0; i < total; i++) {
    const entry = indexData.documents[i]
    const {popeSlug, slug} = entry
    const basePath = path.join(DATA_DIR, popeSlug, slug)
    const sidecarPath = basePath + '.json'
    const mdPath = basePath + '.md'
    const summaryPath = basePath + '-summary.md'

    const meta = JSON.parse(readFileSync(sidecarPath, 'utf-8'))
    const mdContent = readFileSync(mdPath, 'utf-8')

    let summaryContent = ''
    if (existsSync(summaryPath)) {
      summaryContent = readFileSync(summaryPath, 'utf-8')
    }

    const doc = {
      _type: 'encyclical',
      _id: `doc-${popeSlug}-${slug}`,
      slug,
      incipit: meta.incipit,
      englishTitle: inferEnglishTitle(popeSlug, slug, meta.englishTitle),
      pope: {_ref: `pope-${popeSlug}`, _type: 'reference'},
      documentKind: inferDocumentKind(popeSlug, slug, meta.type),
      year: meta.year,
      date: meta.date || undefined,
      dateApproximate: meta.dateApproximate ?? false,
      addressee: meta.addressee || undefined,
      addresseeScope: meta.addresseeScope || undefined,
      language: meta.language || undefined,
      translated: meta.translated ?? false,
      translationSource: meta.translationSource || undefined,
      tags: (meta.tags || []).map((t) => ({
        _type: 'reference',
        _ref: tagDocumentId(t),
        _key: t,
      })),
      wordCount: meta.wordCount,
      body: mdContent,
      rawClosingDate: meta.rawClosingDate || undefined,
    }

    if (DRY_RUN) {
      console.log(`[DRY] [${i + 1}/${total}] ${meta.incipit}`)
    } else {
      await client.createOrReplace(doc)
      console.log(`[${i + 1}/${total}] ${meta.incipit}`)
    }

    if (summaryContent.trim()) {
      const summaryBody = normalizeSummaryMarkdown(summaryContent)
      const summaryDoc = {
        _type: 'documentSummary',
        _id: summaryDocumentId(popeSlug, slug),
        document: {_type: 'reference', _ref: doc._id},
        body: summaryBody,
        excerpt: extractExcerpt(summaryBody),
      }
      if (DRY_RUN) {
        console.log(`[DRY] summary: ${meta.incipit}`)
      } else {
        await client.createOrReplace(summaryDoc)
      }
    }
  }

  console.log(`\nDone. ${total} documents + ${popesData.popes.length} popes imported.`)
}

main().catch((err) => {
  console.error('Import failed:', err)
  process.exit(1)
})
