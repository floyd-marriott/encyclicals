import {createClient} from '@sanity/client'

export const client = createClient({
  projectId: import.meta.env.SANITY_PROJECT_ID,
  dataset: import.meta.env.SANITY_DATASET || 'production',
  apiVersion: '2024-01-01',
  useCdn: true,
})

const docListFields = `
  incipit, slug, "documentKind": coalesce(documentKind, type), year, englishTitle,
  "popeSlug": pope->slug,
  "tags": tags[]->{slug, label},
  "summaryExcerpt": *[_type == "documentSummary" && references(^._id)][0].excerpt
`

export async function getPopes() {
  return client.fetch(
    `*[_type == "pope"] | order(fullName asc) {
      slug, fullName, regnalName, number, pontificateStart, pontificateEnd,
      "documentCount": count(*[_type == "encyclical" && references(^._id)])
    }`,
  )
}

export async function getPope(slug: string) {
  return client.fetch(
    `*[_type == "pope" && slug == $slug][0] {
      ...,
      "documentCount": count(*[_type == "encyclical" && references(^._id)])
    }`,
    {slug},
  )
}

export async function getDocsByPope(slug: string) {
  return client.fetch(
    `*[_type == "encyclical" && pope->slug == $slug] | order(year asc) {${docListFields}}`,
    {slug},
  )
}

export async function getDoc(pope: string, slug: string) {
  return client.fetch(
    `*[_type == "encyclical" && slug == $slug && pope->slug == $pope][0] {
      ...,
      "documentKind": coalesce(documentKind, type),
      body,
      "tags": tags[]->{slug, label},
      "pope": pope->{fullName, slug},
      "summary": *[_type == "documentSummary" && references(^._id)][0]{body, excerpt}
    }`,
    {pope, slug},
  )
}

export async function getTags() {
  return client.fetch(
    `*[_type == "tag"] | order(label asc) {
      slug, label,
      "count": count(*[_type == "encyclical" && references(^._id)])
    }`,
  )
}

export async function getDocsByTag(tag: string) {
  return client.fetch(
    `*[_type == "encyclical" && $tag in tags[]->slug] | order(year asc) {
      ${docListFields},
      "popeSlug": pope->slug,
      "pope": pope->{fullName, slug}
    }`,
    {tag},
  )
}

export async function getDocsByCentury(start: number, end: number) {
  return client.fetch(
    `*[_type == "encyclical" && year >= $start && year <= $end] | order(year asc) {
      incipit, slug, year, "pope": pope->{fullName, slug}
    }`,
    {start, end},
  )
}

export async function getAllDocs() {
  return client.fetch(
    `*[_type == "encyclical"] | order(year asc) {
      incipit, slug, year, "pope": pope->{fullName, slug}
    }`,
  )
}

export async function searchDocs(q: string) {
  return client.fetch(
    `*[_type == "encyclical" && (
      incipit match $q ||
      englishTitle match $q ||
      $q in tags[]->slug ||
      $q in tags[]->label
    )] | order(year asc) {
      incipit, slug, year, englishTitle, "pope": pope->{fullName, slug}
    }`,
    {q: `*${q}*`},
  )
}

export async function getRandomDoc() {
  return client.fetch(
    '*[_type == "encyclical"][floor(random() * count(*[_type == "encyclical"]))] {slug, "pope": pope->slug}',
  )
}
