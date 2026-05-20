import { getStore } from '@netlify/blobs'
import { buildSnapshot } from '../../src/linear/build-snapshot.js'
import { purgeRoadmapCache } from './utils/purge-roadmap-cache.mts'

export default async function handler() {
  const snapshot = await buildSnapshot()

  const store = getStore('roadmap')
  await store.setJSON('roadmap-snapshot', snapshot)

  await purgeRoadmapCache()
}

export const config = {
  schedule: '0 */12 * * *'
}
