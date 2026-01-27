/**
 * Lifecycle callbacks for blog-post
 * Generates MDX files that match the blog post format used on the site
 * Then commits and pushes to trigger Netlify preview builds
 */

import fs from 'fs'
import path from 'path'
import { gitCommitAndPush } from '../../../../utils/gitSync'

interface MediaFile {
  id: number
  url: string
  alternativeText?: string
  name?: string
  width?: number
  height?: number
  formats?: {
    thumbnail?: { url: string }
    small?: { url: string }
    medium?: { url: string }
    large?: { url: string }
  }
}

interface BlogPost {
  id: number
  title: string
  description: string
  slug: string
  date: string
  content: string
  featuredImage?: MediaFile
  lang?: string
  ogImageUrl?: string
  publishedAt?: string
}

interface Event {
  result?: BlogPost
}

/**
 * Converts HTML content to markdown-like format
 */
function htmlToMarkdown(html: string): string {
  if (!html) return ''

  return html
    .replace(/&nbsp;/gi, ' ')
    .replace(/<h1[^>]*>([\s\S]*?)<\/h1>/gi, '# $1\n\n')
    .replace(/<h2[^>]*>([\s\S]*?)<\/h2>/gi, '## $1\n\n')
    .replace(/<h3[^>]*>([\s\S]*?)<\/h3>/gi, '### $1\n\n')
    .replace(/<h4[^>]*>([\s\S]*?)<\/h4>/gi, '#### $1\n\n')
    .replace(/<h5[^>]*>([\s\S]*?)<\/h5>/gi, '##### $1\n\n')
    .replace(/<h6[^>]*>([\s\S]*?)<\/h6>/gi, '###### $1\n\n')
    .replace(/<p[^>]*>([\s\S]*?)<\/p>/gi, '$1\n\n')
    .replace(/<strong[^>]*>([\s\S]*?)<\/strong>/gi, '**$1**')
    .replace(/<b[^>]*>([\s\S]*?)<\/b>/gi, '**$1**')
    .replace(/<em[^>]*>([\s\S]*?)<\/em>/gi, '*$1*')
    .replace(/<i[^>]*>([\s\S]*?)<\/i>/gi, '*$1*')
    .replace(/<a[^>]*href="([^"]*)"[^>]*>([\s\S]*?)<\/a>/gi, '[$2]($1)')
    .replace(/<pre[^>]*><code[^>]*>([\s\S]*?)<\/code><\/pre>/gi, '```\n$1\n```')
    .replace(/<code[^>]*>([\s\S]*?)<\/code>/gi, '`$1`')
    .replace(/<ul[^>]*>/gi, '\n')
    .replace(/<\/ul>/gi, '\n')
    .replace(/<ol[^>]*>/gi, '\n')
    .replace(/<\/ol>/gi, '\n')
    .replace(/<li[^>]*>([\s\S]*?)<\/li>/gi, '- $1\n')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<blockquote[^>]*>([\s\S]*?)<\/blockquote>/gi, '> $1\n')
    .replace(/<img[^>]*src="([^"]*)"[^>]*alt="([\s\S]*?)"[^>]*>/gi, '![$2]($1)')
    .replace(/<img[^>]*src="([^"]*)"[^>]*>/gi, '![]($1)')
    .replace(/<[^>]+>/g, '')
    .trim()
}

function escapeQuotes(value: string): string {
  return value.replace(/"/g, '\\"')
}

function formatDate(dateString: string): string {
  if (!dateString) return ''
  const date = new Date(dateString)
  if (isNaN(date.getTime())) return dateString
  return date.toISOString().split('T')[0]
}

function generateFilename(post: BlogPost): string {
  const date = formatDate(post.date)
  const prefix = date ? `${date}-` : ''
  return `${prefix}${post.slug}.mdx`
}

/**
 * Gets the image URL from a media field
 * Returns the full Strapi URL for local files, or the full URL for external
 */
function getImageUrl(media: MediaFile | undefined): string | undefined {
  if (!media?.url) return undefined

  // If it's a relative URL (starts with /uploads/), allow an optional base URL override, otherwise keep it relative
  if (media.url.startsWith('/uploads/')) {
    const uploadsBase = process.env.STRAPI_UPLOADS_BASE_URL
    return uploadsBase
      ? `${uploadsBase.replace(/\/$/, '')}${media.url}`
      : media.url
  }

  // Return the URL as-is for external images
  return media.url
}

function generateMDX(post: BlogPost): string {
  const imageUrl = getImageUrl(post.featuredImage)

  const frontmatterLines = [
    `title: "${escapeQuotes(post.title)}"`,
    `description: "${escapeQuotes(post.description)}"`,
    post.ogImageUrl
      ? `ogImageUrl: "${escapeQuotes(post.ogImageUrl)}"`
      : undefined,
    `date: ${formatDate(post.date)}`,
    `slug: ${post.slug}`,
    post.lang ? `lang: "${escapeQuotes(post.lang)}"` : undefined,
    imageUrl ? `image: "${escapeQuotes(imageUrl)}"` : undefined
  ].filter(Boolean) as string[]

  const frontmatter = frontmatterLines.join('\n')
  const content = post.content ? htmlToMarkdown(post.content) : ''

  return `---\n${frontmatter}\n---\n\n${content}\n`
}

async function writeMDXFile(post: BlogPost): Promise<void> {
  const outputPath = process.env.BLOG_MDX_OUTPUT_PATH || '../src/content/blog'
  // Resolve from dist/src/api/blog-post/content-types/blog-post/ up to cms root then project root
  const baseDir = path.resolve(__dirname, '../../../../../../', outputPath)

  if (!fs.existsSync(baseDir)) {
    fs.mkdirSync(baseDir, { recursive: true })
  }

  const filename = generateFilename(post)
  const filepath = path.join(baseDir, filename)
  const mdxContent = generateMDX(post)

  fs.writeFileSync(filepath, mdxContent, 'utf-8')
  console.log(`✅ Generated Blog Post MDX file: ${filepath}`)
}

async function deleteMDXFile(post: BlogPost): Promise<void> {
  const outputPath = process.env.BLOG_MDX_OUTPUT_PATH || '../src/content/blog'
  // Resolve from dist/src/api/blog-post/content-types/blog-post/ up to cms root then project root
  const baseDir = path.resolve(__dirname, '../../../../../../', outputPath)
  const filename = generateFilename(post)
  const filepath = path.join(baseDir, filename)

  if (fs.existsSync(filepath)) {
    fs.unlinkSync(filepath)
    console.log(`🗑️  Deleted Blog Post MDX file: ${filepath}`)
  }
}

export default {
  async afterCreate(event: Event) {
    const { result } = event
    if (result && result.publishedAt) {
      await writeMDXFile(result)
      const filename = generateFilename(result)
      const outputPath =
        process.env.BLOG_MDX_OUTPUT_PATH || '../src/content/blog'
      const baseDir = path.resolve(__dirname, '../../../../../../', outputPath)
      const filepath = path.join(baseDir, filename)
      await gitCommitAndPush(filepath, `blog: add "${result.title}"`)
    }
  },

  async afterUpdate(event: Event) {
    const { result } = event
    if (result) {
      const filename = generateFilename(result)
      const outputPath =
        process.env.BLOG_MDX_OUTPUT_PATH || '../src/content/blog'
      const baseDir = path.resolve(__dirname, '../../../../../../', outputPath)
      const filepath = path.join(baseDir, filename)

      if (result.publishedAt) {
        await writeMDXFile(result)
        await gitCommitAndPush(filepath, `blog: update "${result.title}"`)
      } else {
        await deleteMDXFile(result)
        await gitCommitAndPush(filepath, `blog: unpublish "${result.title}"`)
      }
    }
  },

  async afterDelete(event: Event) {
    const { result } = event
    if (result) {
      await deleteMDXFile(result)
      const filename = generateFilename(result)
      const outputPath =
        process.env.BLOG_MDX_OUTPUT_PATH || '../src/content/blog'
      const baseDir = path.resolve(__dirname, '../../../../../../', outputPath)
      const filepath = path.join(baseDir, filename)
      await gitCommitAndPush(filepath, `blog: delete "${result.title}"`)
    }
  }
}
