import fs from 'fs'
import path from 'path'

interface GrantTrack {
  id: number
  name: string
  amount: string
  description: string
  order?: number
  publishedAt?: string
}

interface Event {
  result?: GrantTrack
}

function htmlToMarkdown(html: string): string {
  if (!html) return ''

  return html
    .replace(/<h1[^>]*>(.*?)<\/h1>/gi, '# $1\n\n')
    .replace(/<h2[^>]*>(.*?)<\/h2>/gi, '## $1\n\n')
    .replace(/<h3[^>]*>(.*?)<\/h3>/gi, '### $1\n\n')
    .replace(/<p[^>]*>(.*?)<\/p>/gi, '$1\n\n')
    .replace(/<strong[^>]*>(.*?)<\/strong>/gi, '**$1**')
    .replace(/<b[^>]*>(.*?)<\/b>/gi, '**$1**')
    .replace(/<em[^>]*>(.*?)<\/em>/gi, '*$1*')
    .replace(/<i[^>]*>(.*?)<\/i>/gi, '*$1*')
    .replace(/<a[^>]*href="([^"]*)"[^>]*>(.*?)<\/a>/gi, '[$2]($1)')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .trim()
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '')
}

function escapeQuotes(value: string): string {
  return value.replace(/"/g, '\\"')
}

function generateMDX(grant: GrantTrack): string {
  const frontmatter = [
    `name: "${escapeQuotes(grant.name)}"`,
    `amount: "${escapeQuotes(grant.amount)}"`,
    `order: ${grant.order ?? 0}`,
    `description: "${escapeQuotes(grant.description)}"`
  ].join('\n')

  const content = htmlToMarkdown(grant.description)

  return `---\n${frontmatter}\n---\n\n${content}\n`
}

async function writeMDXFile(grant: GrantTrack): Promise<void> {
  const outputPath =
    process.env.GRANT_TRACK_MDX_OUTPUT_PATH || '../src/content/grant-tracks'
  const baseDir = path.resolve(__dirname, '../../../../../../', outputPath)

  if (!fs.existsSync(baseDir)) {
    fs.mkdirSync(baseDir, { recursive: true })
  }

  const filename = `${slugify(grant.name)}-${grant.id}.mdx`
  const filepath = path.join(baseDir, filename)
  const mdxContent = generateMDX(grant)

  fs.writeFileSync(filepath, mdxContent, 'utf-8')
  console.log(`✅ Generated Grant Track MDX file: ${filepath}`)
}

async function deleteMDXFile(grant: GrantTrack): Promise<void> {
  const outputPath =
    process.env.GRANT_TRACK_MDX_OUTPUT_PATH || '../src/content/grant-tracks'
  const baseDir = path.resolve(__dirname, '../../../../../../', outputPath)
  const filename = `${slugify(grant.name)}-${grant.id}.mdx`
  const filepath = path.join(baseDir, filename)

  if (fs.existsSync(filepath)) {
    fs.unlinkSync(filepath)
    console.log(`🗑️  Deleted Grant Track MDX file: ${filepath}`)
  }
}

export default {
  async afterCreate(event: Event) {
    const { result } = event
    if (result && result.publishedAt) {
      await writeMDXFile(result)
    }
  },
  async afterUpdate(event: Event) {
    const { result } = event
    if (result) {
      if (result.publishedAt) {
        await writeMDXFile(result)
      } else {
        await deleteMDXFile(result)
      }
    }
  },
  async afterDelete(event: Event) {
    const { result } = event
    if (result) {
      await deleteMDXFile(result)
    }
  }
}
