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

/** Known English titles not present in source markdown headers. */
export const ENGLISH_TITLE_OVERRIDES = {
  'alex04/dignum-arbitramur-et-congruum': 'On Teaching Rights of Salamanca Graduates',
  'alex04/inter-ea-quae-placita': 'On the University of Salamanca',
  'alex04/petitionibus-vestris-benignum-impertientes': 'On the Seal of the University of Salamanca',
  'jp02/dives-in-misericordia': 'On the Mercy of God',
  'jp02/redemptoris-mater': 'On the Blessed Virgin Mary in the Life of the Pilgrim Church',
  'jp02/slavorum-apostoli': 'On Saints Cyril and Methodius',
  'jp02/sollicitudo-rei-socialis': 'On Social Concern',
  'jp02/veritatis-splendor': 'On the Splendor of Truth',
  'eugene04/sicut-dudum': 'Against the Enslaving of Black Natives from the Canary Islands',
  'leo13/longinqua-january-6-1895': 'On Catholicism in the United States',
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

export function inferEnglishTitle(popeSlug, slug, extractedTitle) {
  const override = ENGLISH_TITLE_OVERRIDES[`${popeSlug}/${slug}`]
  if (override) return override
  return extractedTitle || undefined
}
