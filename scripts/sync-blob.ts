import { buildSnapshot } from '../src/linear/build-snapshot.ts'
import { getStore } from '@netlify/blobs'

const snapshot = await buildSnapshot()
const store = getStore('roadmap')
await store.setJSON('roadmap-snapshot', snapshot)
