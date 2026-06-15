import { NETLIFY_SITE_ID, NETLIFY_API_TOKEN } from '../../../src/config.js'

export async function purgeRoadmapCache(): Promise<void> {
  if (!NETLIFY_SITE_ID || !NETLIFY_API_TOKEN) return

  await fetch('https://api.netlify.com/api/v1/purge', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${NETLIFY_API_TOKEN}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      site_id: NETLIFY_SITE_ID,
      paths: ['/developers/roadmap']
    })
  })
}
