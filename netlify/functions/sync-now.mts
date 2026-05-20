import { timingSafeEqual } from 'crypto'
import { getStore } from '@netlify/blobs'
import { buildSnapshot } from '../../src/linear/build-snapshot.js'
import type { Context } from '@netlify/functions'
import { API_SECRET } from '../../src/config.js'
import { purgeRoadmapCache } from './utils/purge-roadmap-cache.mts'

const FIVE_MINUTES_MS = 5 * 60 * 1000
const RL_KEY = 'sync-rate-limit'

export default async function handler(
  req: Request,
  _ctx: Context
): Promise<Response> {
  const authHeader = req.headers.get('authorization') ?? ''
  const token = authHeader.replace(/^Bearer\s+/i, '')

  if (!API_SECRET) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' }
    })
  }

  const secretBuf = Buffer.from(API_SECRET)
  const tokenBuf = Buffer.from(token)
  const authorized =
    tokenBuf.length === secretBuf.length && timingSafeEqual(tokenBuf, secretBuf)

  if (!authorized) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' }
    })
  }

  const store = getStore('roadmap')

  const lastSync = (await store.get(RL_KEY, { type: 'json' })) as {
    ts: number
  } | null
  if (lastSync && Date.now() - lastSync.ts < FIVE_MINUTES_MS) {
    const retryAfter = Math.ceil(
      (FIVE_MINUTES_MS - (Date.now() - lastSync.ts)) / 1000
    )
    return new Response(
      JSON.stringify({ error: 'Too Many Requests', retryAfter }),
      {
        status: 429,
        headers: {
          'Content-Type': 'application/json',
          'Retry-After': String(retryAfter)
        }
      }
    )
  }
  await store.setJSON(RL_KEY, { ts: Date.now() })

  const snapshot = await buildSnapshot()

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
