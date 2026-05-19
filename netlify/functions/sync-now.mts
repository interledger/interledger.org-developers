import { getStore } from '@netlify/blobs'
import { buildSnapshot } from '../../src/linear/build-snapshot.js'
import type { Context } from '@netlify/functions'
import {
  API_SECRET,
  NETLIFY_SITE_ID,
  NETLIFY_API_TOKEN
} from '../../src/config.js'

export default async function handler(
  req: Request,
  _ctx: Context
): Promise<Response> {
  // Verify API_SECRET bearer token
  const authHeader = req.headers.get('authorization') ?? ''
  const token = authHeader.replace(/^Bearer\s+/i, '')

  if (!API_SECRET || token !== API_SECRET) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' }
    })
  }

  const snapshot = await buildSnapshot()

  const store = getStore('roadmap')
  await store.setJSON('roadmap-snapshot', snapshot)

  // Purge CDN cache
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
