import 'dotenv/config'
import {createClient} from '@sanity/client'
import {readFileSync, existsSync} from 'fs'
import path from 'path'
import {fileURLToPath} from 'url'
import {
  extractExcerpt,
  normalizeSummaryMarkdown,
  stripSummaryFromBody,
  summaryDocumentId,
} from './lib/summary.mjs'

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
  const indexData = JSON.parse(readFileSync(path.join(DATA_DIR, 'index.json'), 'utf-8'))
  const total = indexData.documents.length
  let summariesCreated = 0
  let bodiesCleaned = 0
  let kindsMigrated = 0

  for (let i = 0; i < total; i++) {
    const {popeSlug, slug} = indexData.documents[i]
    const docId = `doc-${popeSlug}-${slug}`
    const summaryPath = path.join(DATA_DIR, popeSlug, `${slug}-summary.md`)

    const existing = await client.fetch(
      `*[_id == $id][0]{body, type, documentKind, summary}`,
      {id: docId},
    )
    if (!existing) {
      console.warn(`[${i + 1}/${total}] missing document: ${docId}`)
      continue
    }

    let summaryMarkdown = ''
    if (existsSync(summaryPath)) {
      summaryMarkdown = readFileSync(summaryPath, 'utf-8')
    } else if (existing.summary) {
      summaryMarkdown = existing.summary
    }

    const patch = {}
    const cleanBody = stripSummaryFromBody(existing.body || '')
    if (cleanBody !== (existing.body || '')) {
      patch.body = cleanBody
      bodiesCleaned++
    }

    if (existing.type && !existing.documentKind) {
      patch.documentKind = existing.type
      kindsMigrated++
    }

    const unsetFields = []
    if (existing.summary) unsetFields.push('summary')
    if (existing.type && !existing.documentKind) unsetFields.push('type')

    if (Object.keys(patch).length > 0 || unsetFields.length > 0) {
      if (DRY_RUN) {
        console.log(
          `[DRY] patch ${docId}: set ${Object.keys(patch).join(', ') || 'none'}, unset ${unsetFields.join(', ') || 'none'}`,
        )
      } else {
        let mutation = client.patch(docId)
        if (Object.keys(patch).length > 0) mutation = mutation.set(patch)
        if (unsetFields.length > 0) mutation = mutation.unset(unsetFields)
        await mutation.commit()
      }
    }

    if (summaryMarkdown.trim()) {
      const body = normalizeSummaryMarkdown(summaryMarkdown)
      const summaryDoc = {
        _type: 'documentSummary',
        _id: summaryDocumentId(popeSlug, slug),
        document: {_type: 'reference', _ref: docId},
        body,
        excerpt: extractExcerpt(body),
      }

      if (DRY_RUN) {
        console.log(`[DRY] summary: ${docId}`)
      } else {
        await client.createOrReplace(summaryDoc)
      }
      summariesCreated++
    }

    if ((i + 1) % 50 === 0 || i + 1 === total) {
      console.log(`[${i + 1}/${total}] processed`)
    }
  }

  console.log(
    `\nDone. ${summariesCreated} summaries, ${bodiesCleaned} bodies cleaned, ${kindsMigrated} documentKind migrations.`,
  )
}

main().catch((err) => {
  console.error('Migration failed:', err)
  process.exit(1)
})
