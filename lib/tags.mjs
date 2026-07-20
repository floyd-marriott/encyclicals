/** Convert a tag slug like "social-doctrine" to "Social Doctrine". */
export function tagLabelFromSlug(slug) {
  return slug
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

export function tagDocumentId(slug) {
  return `tag-${slug}`
}

/** Slugs that are addresses, allocutions, or biographical notes rather than formal documents. */
export const DOCUMENT_KIND_OVERRIDES = {
  'pius10/pope-st-pius-x': 'biographical-note',
  'pius12/address-to-midwives-on-the-nature-of-their-profession': 'address',
  'pius12/applied-psychology': 'address',
  'pius12/counsel-to-teaching-sisters': 'address',
  'pius12/democracy-and-a-lasting-peace': 'address',
  'pius12/guiding-principles-of-the-lay-apostolate': 'address',
  'pius12/on-psychotherapy-and-religion': 'address',
  'pius12/on-rural-life': 'address',
  'pius12/papal-directives-for-the-woman-of-today': 'address',
  'pius12/the-function-of-art': 'address',
  'pius12/the-internal-order-of-states-and-people': 'address',
  'pius12/the-moral-limits-of-medical-research-and-treatment': 'address',
  'pius12/the-proofs-for-the-existence-of-god-in-the-light-of-modern-natural-science': 'address',
  'pius12/the-states-of-perfection': 'address',
}

export function inferDocumentKind(popeSlug, slug, metaType) {
  const override = DOCUMENT_KIND_OVERRIDES[`${popeSlug}/${slug}`]
  if (override) return override
  return metaType || undefined
}
