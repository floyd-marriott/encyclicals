export interface Pope {
  _id?: string
  slug: string
  regnalName?: string
  number?: number
  fullName: string
  pontificateStart?: number | null
  pontificateEnd?: number | null
  documentCount?: number
}

export interface TagRef {
  slug: string
  label: string
}

export interface DocEntry {
  incipit: string
  slug: string
  documentKind?: string | null
  year?: number | null
  tags?: TagRef[] | null
  englishTitle?: string | null
  summaryExcerpt?: string | null
  pope?: {
    fullName: string
    slug: string
  }
  popeSlug?: string
}

export interface DocDetail extends DocEntry {
  body: string
  date?: string | null
  dateApproximate?: boolean
  addressee?: string | null
  addresseeScope?: string | null
  language?: string | null
  translated?: boolean
  translationSource?: string | null
  wordCount?: number | null
  rawClosingDate?: string | null
  summary?: {
    body: string
    excerpt?: string | null
  } | null
  pope: {
    fullName: string
    slug: string
  }
}
