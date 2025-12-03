#!/usr/bin/env node

import crypto from 'crypto'
import { mkdir, writeFile } from 'fs/promises'
import http from 'http'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const CONTENT_DIR = path.join(__dirname, '..', 'src', 'content', 'press')
const PORT = Number(process.env.STRAPI_WEBHOOK_PORT || 4369)
const SECRET = process.env.STRAPI_WEBHOOK_SECRET || ''

const slugify = (value) =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')

const formatDate = (value) => {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return new Date().toISOString().slice(0, 10)
  return date.toISOString().slice(0, 10)
}

const escapeYaml = (value) =>
  value
    .replace(/\\/g, '\\\\')
    .replace(/"/g, '\\"')
    .replace(/\n/g, '\\n')

const serializeFrontmatter = (meta) => {
  const lines = []
  const append = (key, value, { raw } = {}) => {
    if (value === undefined || value === null || value === '') return
    if (Array.isArray(value)) {
      if (!value.length) return
      lines.push(`${key}:`)
      value.forEach((item) => lines.push(`  - ${escapeYaml(String(item))}`))
      return
    }
    if (typeof value === 'boolean' || typeof value === 'number') {
      lines.push(`${key}: ${value}`)
      return
    }
    if (raw) {
      lines.push(`${key}: ${String(value)}`)
      return
    }
    lines.push(`${key}: "${escapeYaml(String(value))}"`)
  }

  append('title', meta.title)
  append('slug', meta.slug)
  append('summary', meta.summary)
  append('url', meta.url)
  append('source', meta.source)
  append('date', formatDate(meta.date), { raw: true })
  append('tags', meta.tags)
  append('image', meta.image)
  append('featured', meta.featured)

  return `---\n${lines.join('\n')}\n---\n`
}

const normalizePayload = (payload) => {
  const entry = payload?.entry || payload?.data || payload || {}
  const attributes = entry.attributes || entry
  const normalizeUrl = (value) => {
    if (!value) return 'https://example.com'
    const trimmed = String(value).trim()
    if (/^https?:\/\//i.test(trimmed)) return trimmed
    return `https://${trimmed}`
  }
  return {
    title: attributes.title || attributes.headline || 'Untitled press item',
    slug: attributes.slug || slugify(attributes.title || 'press-item'),
    summary:
      attributes.summary ||
      attributes.description ||
      attributes.excerpt ||
      'Update summary pending.',
    url: normalizeUrl(attributes.url || attributes.link || ''),
    source: attributes.source || attributes.publication || 'Press',
    date: attributes.date || attributes.publishedAt || new Date().toISOString(),
    tags: attributes.tags || attributes.keywords || [],
    image:
      attributes.image?.url ||
      attributes.hero_image ||
      attributes.featured_image ||
      undefined,
    featured: Boolean(attributes.featured),
    body: attributes.body || attributes.content || attributes.markdown || ''
  }
}

const verifySignature = (rawBody, header) => {
  if (!SECRET || !header) return true
  const expected = crypto
    .createHmac('sha256', SECRET)
    .update(rawBody)
    .digest('hex')

  const provided = header.startsWith('sha256=')
    ? header.replace('sha256=', '')
    : header

  const expectedBuffer = Buffer.from(expected, 'utf8')
  const providedBuffer = Buffer.from(provided, 'utf8')
  if (expectedBuffer.length !== providedBuffer.length) return false

  return crypto.timingSafeEqual(expectedBuffer, providedBuffer)
}

const server = http.createServer(async (req, res) => {
  if (req.method !== 'POST') {
    res.writeHead(405, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify({ error: 'Method not allowed' }))
    return
  }

  const pathname = new URL(req.url, 'http://localhost').pathname
  if (pathname !== '/press') {
    res.writeHead(404, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify({ error: 'Not found' }))
    return
  }

  const chunks = []
  req.on('data', (chunk) => chunks.push(chunk))
  req.on('end', async () => {
    const rawBody = Buffer.concat(chunks).toString()

    if (!verifySignature(rawBody, req.headers['x-strapi-signature'])) {
      res.writeHead(401, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify({ error: 'Invalid signature' }))
      return
    }

    let payload
    try {
      payload = JSON.parse(rawBody)
    } catch (error) {
      res.writeHead(400, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify({ error: 'Invalid JSON payload' }))
      return
    }

    const entry = normalizePayload(payload)
    const frontmatter = serializeFrontmatter(entry)
    const mdx = `${frontmatter}\n${entry.body}\n`
    const filename = `${entry.slug || slugify(entry.title)}.mdx`

    try {
      await mkdir(CONTENT_DIR, { recursive: true })
      await writeFile(path.join(CONTENT_DIR, filename), mdx, 'utf8')
    } catch (error) {
      res.writeHead(500, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify({ error: 'Failed to write MDX file' }))
      return
    }

    res.writeHead(201, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify({ status: 'saved', file: filename }))
  })
})

server.listen(PORT, () => {
  console.log(`Listening for Strapi webhooks on http://localhost:${PORT}/press`)
})
