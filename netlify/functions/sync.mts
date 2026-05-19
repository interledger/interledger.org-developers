import { getStore } from '@netlify/blobs'
import { buildSnapshot } from '../../src/linear/build-snapshot.js'
import { NETLIFY_SITE_ID, NETLIFY_API_TOKEN } from '../../src/config.js'

export default async function handler() {
  const snapshot = await buildSnapshot()

  const store = getStore('roadmap')
  await store.setJSON('roadmap-snapshot', snapshot)

  // Purge CDN cache so the next user request re-renders fresh HTML
  if (NETLIFY_SITE_ID && NETLIFY_API_TOKEN) {
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
}

export const config = {
  schedule: '0 */12 * * *'
}
