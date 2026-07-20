import 'dotenv/config'
import {createClient} from '@sanity/client'
import {readFileSync} from 'fs'
import path from 'path'
import {fileURLToPath} from 'url'
import {stripSummaryFromBody} from './lib/summary.mjs'
import {inferDocumentKind, tagDocumentId, tagLabelFromSlug} from './lib/tags.mjs'

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
  const allTagSlugs = new Set()
  const stats = {
    tagsCreated: 0,
    docsPatched: 0,
    titlesBackfilled: 0,
    kindsSet: 0,
    bodiesCleaned: 0,
    popesCleaned: 0,
  }

  for (const {popeSlug, slug} of indexData.documents) {
    const meta = JSON.parse(
      readFileSync(path.join(DATA_DIR, popeSlug, `${slug}.json`), 'utf-8'),
    )
    for (const t of meta.tags || []) allTagSlugs.add(t)
  }

  for (const tagSlug of [...allTagSlugs].sort()) {
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
    stats.tagsCreated++
  }

  const total = indexData.documents.length
  for (let i = 0; i < total; i++) {
    const {popeSlug, slug} = indexData.documents[i]
    const docId = `doc-${popeSlug}-${slug}`
    const meta = JSON.parse(
      readFileSync(path.join(DATA_DIR, popeSlug, `${slug}.json`), 'utf-8'),
    )

    const existing = await client.fetch(`*[_id == $id][0]{body, documentKind, englishTitle}`, {
      id: docId,
    })
    if (!existing) {
      console.warn(`[${i + 1}/${total}] missing: ${docId}`)
      continue
    }

    const patch = {}
    const unsetFields = ['fileSize']

    const cleanBody = stripSummaryFromBody(existing.body || '')
    if (cleanBody !== (existing.body || '').trim()) {
      patch.body = cleanBody
      stats.bodiesCleaned++
    }

    const kind = inferDocumentKind(popeSlug, slug, meta.type)
    if (kind && kind !== existing.documentKind) {
      patch.documentKind = kind
      stats.kindsSet++
    }

    if (!existing.englishTitle && meta.incipit) {
      patch.englishTitle = meta.incipit
      stats.titlesBackfilled++
    }

    if (meta.tags?.length) {
      patch.tags = meta.tags.map((t) => ({
        _type: 'reference',
        _ref: tagDocumentId(t),
        _key: t,
      }))
    }

    if (DRY_RUN) {
      const changes = [...Object.keys(patch), ...unsetFields.map((f) => `unset:${f}`)]
      if (changes.length) console.log(`[DRY] ${docId}: ${changes.join(', ')}`)
    } else {
      let mutation = client.patch(docId)
      if (Object.keys(patch).length > 0) mutation = mutation.set(patch)
      if (unsetFields.length > 0) mutation = mutation.unset(unsetFields)
      await mutation.commit()
    }
    stats.docsPatched++

    if ((i + 1) % 50 === 0 || i + 1 === total) {
      console.log(`[${i + 1}/${total}] documents processed`)
    }
  }

  const popes = await client.fetch('*[_type == "pope"]{_id}')
  for (const pope of popes) {
    if (DRY_RUN) {
      console.log(`[DRY] unset documentCount on ${pope._id}`)
    } else {
      await client.patch(pope._id).unset(['documentCount']).commit()
    }
    stats.popesCleaned++
  }

  console.log('\nCleanup complete:', stats)
}

main().catch((err) => {
  console.error('Cleanup failed:', err)
  process.exit(1)
})
