import { getStore } from '@netlify/blobs'
import { buildSnapshot } from '../../src/linear/build-snapshot.js'
import type { Context } from '@netlify/functions'
import { API_SECRET } from '../../src/config.js'
import { purgeRoadmapCache } from './utils/purge-roadmap-cache.mts'

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

  await purgeRoadmapCache()

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
