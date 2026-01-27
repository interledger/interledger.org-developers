export async function fetchStrapi(endpoint: string) {
  const base = import.meta.env.STRAPI_URL
  const token = import.meta.env.STRAPI_PREVIEW_TOKEN

  // Ensure no double slashes
  const url = endpoint.startsWith('http')
    ? endpoint
    : `${base.replace(/\/$/, '')}/${endpoint.replace(/^\//, '')}`
  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  })

  if (!res.ok) {
    const text = await res.text()
    console.error(`Strapi fetch error for ${url}:`, text)
    throw new Error(`Strapi API error: ${res.status}`)
  }

  return res.json()
}
