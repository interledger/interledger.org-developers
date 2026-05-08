import { getStore } from '@netlify/blobs'
import { buildSnapshot } from '../../src/linear/build-snapshot.js'

export default async function handler() {
  const snapshot = await buildSnapshot()

  const store = getStore('roadmap')
  await store.setJSON('roadmap-snapshot', snapshot)

  // Purge CDN cache so the next user request re-renders fresh HTML
  const siteId = process.env.NETLIFY_SITE_ID
  const apiToken = process.env.NETLIFY_API_TOKEN

  if (siteId && apiToken) {
    await fetch('https://api.netlify.com/api/v1/purge', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        site_id: siteId,
        paths: ['/developers/roadmap']
      })
    })
  }
}

export const config = {
  schedule: '0 */12 * * *'
}
