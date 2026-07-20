import {marked} from 'marked'

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

export function cleanMarkdown(md: string): string {
  if (!md) return ''

  let text = md
    .replace(/^\[(?:AR|DE|EN|ES|FR|IT|PL|PT|RU)\]\(.*?\).*$/gm, '')
    .replace(/^.*Multimedia.*vatican\.va.*$/gm, '')
    .replace(/^_{3,}$/gm, '')
    .replace(/^!?\[.*?\]\(.*?\)$/gm, '')

  text = text
    .replace(/\\\[/g, '\x00')
    .replace(/\\\]/g, '\x01')

  text = text.replace(/\[([^\]]*)\]\(#[^)]*\)/g, '$1')

  text = text
    .replace(/\x00/g, '[')
    .replace(/\x01/g, ']')

  text = text
    .replace(/^[ \t]*_[ \t]+/gm, '')
    .replace(/^ENCYCLICAL LETTER_[ \t]*$/gm, '')
    .replace(/^_OF (?:THE|HIS|OUR).*$/gm, '')
    .replace(/^[ \t]+$/gm, '')
    .replace(/\n{3,}/g, '\n\n')

  const idx = text.search(/^(?:\d+(?:\\\.|\.)\s|##\s)/m)
  if (idx !== -1) {
    text = text.slice(idx)
  }

  text = text
    .replace(/^\*\*([A-Z][A-Z\s'.]*)\*\*$/gm, '## $1')
    .replace(/^\*\*(.+?)\*\*$/gm, '## $1')

  text = text
    .replace(/^##\s*.*Holy\s+See.*$/gm, '')

  return text.trim()
}

export interface Heading {
  level: number
  text: string
  id: string
}

function stripMarkdown(text: string): string {
  return text
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/[*_]/g, '')
    .trim()
}

export function extractHeadings(md: string): Heading[] {
  const cleaned = cleanMarkdown(md)
  const headings: Heading[] = []
  const seen = new Set<string>()

  for (const line of cleaned.split('\n')) {
    const trimmed = line.trim()
    if (!trimmed) continue

    const m = trimmed.match(/^(#{2,3})\s+(.+)/)
    if (m) {
      const level = m[1].length as 2 | 3
      const text = stripMarkdown(m[2])
      if (!text || text.length > 80 || seen.has(text)) continue
      seen.add(text)
      headings.push({level, text, id: slugify(text)})
    }
  }

  return headings
}

const renderer = new marked.Renderer()
renderer.heading = function ({text, depth}: {text: string; depth: number}) {
  const id = slugify(text)
  return `<h${depth} id="${id}">${text}</h${depth}>`
}
marked.use({renderer})

export async function renderMarkdown(md: string): Promise<string> {
  return marked(cleanMarkdown(md) || '')
}
