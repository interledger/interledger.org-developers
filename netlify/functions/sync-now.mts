import { getStore } from '@netlify/blobs'
import { buildSnapshot } from '../../src/linear/build-snapshot.js'
import type { Context } from '@netlify/functions'

export default async function handler(
  req: Request,
  _ctx: Context
): Promise<Response> {
  // Verify API_SECRET bearer token
  const authHeader = req.headers.get('authorization') ?? ''
  const token = authHeader.replace(/^Bearer\s+/i, '')
  const expected = process.env.API_SECRET

  if (!expected || token !== expected) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' }
    })
  }

  const snapshot = await buildSnapshot()

  const store = getStore('roadmap')
  await store.setJSON('roadmap-snapshot', snapshot)

  // Purge CDN cache
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
      '[sync-now] NETLIFY_SITE_ID or NETLIFY_API_TOKEN not set — skipping CDN cache purge.'
    )
  }

  return new Response(
    JSON.stringify({ ok: true, generatedAt: snapshot.generatedAt }),
    {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    }
  )
}

export const config = {
  path: '/api/sync'
}
