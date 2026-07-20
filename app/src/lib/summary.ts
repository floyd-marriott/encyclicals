/** Strip the leading "## Summary" heading from summary markdown. */
export function normalizeSummaryMarkdown(md: string): string {
  if (!md) return ''
  return md.replace(/^## Summary\s*\n+/, '').trim()
}

/** Remove a trailing "## Summary" section accidentally appended to document body. */
export function stripSummaryFromBody(body: string): string {
  if (!body) return ''
  const marker = body.search(/\n## Summary\s*\n/)
  if (marker === -1) return body.trim()
  return body.slice(0, marker).trim()
}

/** First paragraph of summary text, plain, truncated for previews. */
export function extractExcerpt(md: string, maxLength = 280): string {
  const body = normalizeSummaryMarkdown(md)
  if (!body) return ''

  const firstPara =
    body.split(/\n\n+/).find((p) => p.trim() && !p.trim().startsWith('#')) || body

  const plain = firstPara
    .replace(/\*([^*]+)\*/g, '$1')
    .replace(/_([^_]+)_/g, '$1')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/\s+/g, ' ')
    .trim()

  if (plain.length <= maxLength) return plain
  return `${plain.slice(0, maxLength - 3).trim()}...`
}

export interface DocumentSummary {
  _id: string
  body: string
  excerpt?: string | null
}
