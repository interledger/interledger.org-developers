/**
 * Lifecycle callbacks for press-item
 * Automatically generates MDX files when press items are created, updated, or deleted
 */

import fs from 'fs'
import path from 'path'

interface PressItem {
  id: number
  title: string
  description: string
  publishDate: string
  slug: string
  publication?: string
  publicationLogo?: string
  externalUrl?: string
  content?: string
  featured: boolean
  category: string
  publishedAt?: string
}

interface Event {
  result?: PressItem
  params?: {
    data?: Partial<PressItem>
    where?: { id?: number }
  }
}

/**
 * Converts HTML content to markdown-like format
 */
function htmlToMarkdown(html: string): string {
  if (!html) return ''

  // Basic HTML to Markdown conversion
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
    .replace(/<[^>]+>/g, '') // Remove remaining HTML tags
    .trim()
}

/**
 * Generates MDX file content from press item data
 */
function generateMDX(item: PressItem): string {
  const frontmatter = {
    title: item.title,
    description: item.description,
    publishDate: item.publishDate,
    slug: item.slug,
    ...(item.publication && { publication: item.publication }),
    ...(item.publicationLogo && { publicationLogo: item.publicationLogo }),
    ...(item.externalUrl && { externalUrl: item.externalUrl }),
    featured: item.featured,
    category: item.category
  }

  const yamlFrontmatter = Object.entries(frontmatter)
    .map(([key, value]) => {
      if (typeof value === 'boolean') {
        return `${key}: ${value}`
      } else if (typeof value === 'string') {
        // Escape quotes in strings and wrap in quotes if contains special chars
        const escaped = value.replace(/"/g, '\\"')
        return `${key}: "${escaped}"`
      }
      return `${key}: ${value}`
    })
    .join('\n')

  const content = item.content ? htmlToMarkdown(item.content) : ''

  return `---\n${yamlFrontmatter}\n---\n\n${content}\n`
}

/**
 * Writes MDX file to the file system
 */
async function writeMDXFile(item: PressItem): Promise<void> {
  const outputPath = process.env.MDX_OUTPUT_PATH || '../src/content/press'
  // Go up from dist/src/api/press-item/content-types/press-item/ to cms root, then to project root
  const baseDir = path.resolve(__dirname, '../../../../../../', outputPath)

  // Ensure directory exists
  if (!fs.existsSync(baseDir)) {
    fs.mkdirSync(baseDir, { recursive: true })
  }

  const filename = `${item.slug}.mdx`
  const filepath = path.join(baseDir, filename)
  const mdxContent = generateMDX(item)

  fs.writeFileSync(filepath, mdxContent, 'utf-8')
  console.log(`✅ Generated MDX file: ${filepath}`)
}

/**
 * Deletes MDX file from the file system
 */
async function deleteMDXFile(slug: string): Promise<void> {
  const outputPath = process.env.MDX_OUTPUT_PATH || '../src/content/press'
  // Go up from dist/src/api/press-item/content-types/press-item/ to cms root, then to project root
  const baseDir = path.resolve(__dirname, '../../../../../../', outputPath)
  const filename = `${slug}.mdx`
  const filepath = path.join(baseDir, filename)

  if (fs.existsSync(filepath)) {
    fs.unlinkSync(filepath)
    console.log(`🗑️  Deleted MDX file: ${filepath}`)
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
        // If unpublished, delete the MDX file
        await deleteMDXFile(result.slug)
      }
    }
  },

  async afterDelete(event: Event) {
    const { result } = event
    if (result) {
      await deleteMDXFile(result.slug)
    }
  }
}
