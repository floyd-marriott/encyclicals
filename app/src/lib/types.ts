export interface Pope {
  _id: string
  slug: string
  regnalName: string
  number: number
  fullName: string
  pontificateStart: number | null
  pontificateEnd: number | null
  documentCount: number
}

export interface DocEntry {
  incipit: string
  slug: string
  type?: string | null
  year?: number | null
  tags?: string[] | null
  englishTitle?: string | null
  pope: {
    fullName: string
    slug: string
  }
}

export interface DocDetail extends DocEntry {
  body: any[]
  summary: any[]
  date?: string | null
  dateApproximate?: boolean
  addressee?: string | null
  addresseeScope?: string | null
  language?: string | null
  translated?: boolean
  translationSource?: string | null
  wordCount?: number | null
  fileSize?: number | null
  rawClosingDate?: string | null
  pope: {
    fullName: string
    slug: string
  }
}
