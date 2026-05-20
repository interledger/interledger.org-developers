import { buildSnapshot } from '../src/linear/build-snapshot.ts'
import { getStore } from '@netlify/blobs'
import { NETLIFY_SITE_ID, NETLIFY_API_TOKEN } from '../src/config.js'

if (!NETLIFY_SITE_ID || !NETLIFY_API_TOKEN) {
  /* eslint-disable-next-line no-console */
  console.log('Skipping blob sync: missing env vars')
  process.exit(0)
}

const snapshot = await buildSnapshot()
const store = getStore({
  name: 'roadmap',
  siteID: NETLIFY_SITE_ID,
  token: NETLIFY_API_TOKEN
})
await store.setJSON('roadmap-snapshot', snapshot)
