import { getStore } from '@netlify/blobs'
import { buildSnapshot } from '../../src/linear/build-snapshot.js'

export default async function handler() {
  console.log('[sync] Starting scheduled Linear sync...')

  const snapshot = await buildSnapshot()

  const store = getStore('roadmap')
  await store.setJSON('roadmap-snapshot', snapshot)

  // Purge CDN cache so the next user request re-renders fresh HTML
  const siteId = process.env.NETLIFY_SITE_ID
  const apiToken = process.env.NETLIFY_API_TOKEN

  if (siteId && apiToken) {
    const res = await fetch('https://api.netlify.com/api/v1/purge', {
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
  } else {
    console.warn(
      '[sync] NETLIFY_SITE_ID or NETLIFY_API_TOKEN not set — skipping CDN cache purge.'
    )
  }
}

export const config = {
  schedule: '0 */12 * * *'
}
