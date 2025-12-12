export async function getMediaPageFromStrapi(preview) {
  const token = import.meta.env.STRAPI_PREVIEW_TOKEN
  const base = import.meta.env.STRAPI_URL

  if (!token || !base) {
    throw new Error(
      `Missing Strapi config: token=${!!token}, url=${!!fetch_url}`
    )
  }

  const query =
    'populate[media_hero][populate][hero_call_to_action]=true' +
    '&populate[media_cta]=true' +
    '&populate[dynamic]=true'
  const fetch_url = preview
    ? `${base}/api/media-page?status=draft&` + query
    : `${base}/api/media-page?` + query

  try {
    const response = await fetch(fetch_url, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    })
    if (!response.ok) {
      throw new Error(`Strapi API error: ${response.status}`)
    }
    const data = await response.json()
    return data.data
  } catch (error) {
    console.error('Strapi fetch failed:', error)
    throw error
  }
}
