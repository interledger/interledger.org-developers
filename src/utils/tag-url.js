/**
 * Converts a tag name to a URL-friendly slug and returns the full tag URL path
 * @param {string} tag - The tag name
 * @returns {string} The tag URL path (e.g., "/developers/blog/tag/my-tag")
 */
export function getTagUrl(tag) {
  const slug = tag.toLowerCase().replace(/\s+/g, '-')
  return `/developers/blog/tag/${slug}`
}

/**
 * Converts a tag name to a URL-friendly slug
 * @param {string} tag - The tag name
 * @returns {string} The tag slug (e.g., "my-tag")
 */
export function getTagSlug(tag) {
  return tag.toLowerCase().replace(/\s+/g, '-')
}
