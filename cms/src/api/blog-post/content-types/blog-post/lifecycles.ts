/**
 * Lifecycle callbacks for blog-post
 * Generates MDX files that match the blog post format used on the site
 * Then commits and pushes to trigger Netlify preview builds
 */

import fs from 'fs'
import path from 'path'
import { gitCommitAndPush } from '../../../../utils/gitSync'

const escapeQuotes = (str: string) => str?.replace(/"/g, '\\"') || ''

const formatDate = (date: string) => {
  if (!date) return ''
  return date.split('T')[0]
}

const generateFilename = (post: BlogPost) => {
  const dateStr = formatDate(post.date)
  const lang = post.lang || 'en'
  return `${dateStr}-${post.slug}.${lang}.mdx`
}

/**
 * Gets the image URL from a media field
 * Returns the full Strapi URL
 */
const getImageUrl = (media: any) => {
  if (!media) return null
  if (Array.isArray(media)) {
    media = media[0]
  }
  const STRAPI_URL = process.env.STRAPI_URL || 'http://localhost:1337'
  const url = media.url || media.attributes?.url
  if (!url) return null
  return url.startsWith('http') ? url : `${STRAPI_URL}${url}`
}

/**
 * Simple HTML to Markdown conversion (Regex-based as used originally)
 * This handles basic tags and avoids over-escaping existing Markdown
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

interface BlogPost {
  id: number
  documentId?: string
  title: string
  description: string
  slug: string
  date: string
  content: string
  lang?: string
  ogImageUrl?: string
  featuredImage?: any
  publishedAt?: string
}

interface Translations {
  [key: string]: string | boolean
}

function generateMDX(post: BlogPost, translations?: Translations, isTranslated?: boolean): string {
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
    imageUrl ? `image: "${escapeQuotes(imageUrl)}"` : undefined,
    isTranslated !== undefined ? `isTranslated: ${isTranslated}` : undefined
  ].filter(Boolean) as string[]

  if (translations && Object.keys(translations).length > 0) {
    frontmatterLines.push('translations:')
    Object.entries(translations).forEach(([key, value]) => {
      if (typeof value === 'boolean') {
        frontmatterLines.push(`  ${key}: ${value}`)
      } else {
        frontmatterLines.push(`  ${key}: "${value}"`)
      }
    })
  }

  const frontmatter = frontmatterLines.join('\n')
  // Use simple regex-based conversion or direct content if it's already markdown
  // CKEditor defaultMarkdown preset usually saves as markdown.
  const content = htmlToMarkdown(post.content)

  return `---\n${frontmatter}\n---\n\n${content}\n`
}

async function writeMDXFile(post: BlogPost, cascade = true): Promise<string> {
  // Use Document Service in Strapi v5 for better relation consistency
  const populatedPost: any = await (strapi as any).documents('api::blog-post.blog-post').findOne({
    documentId: post.documentId || (post as any).id,
    populate: {
      featuredImage: true,
      linked_translations: {
        populate: ['linked_translations']
      }
    }
  })

  if (!populatedPost) {
    console.error(`❌ Could not find post to generate MDX: ${post.id}`)
    return ''
  }

  const outputPath = process.env.BLOG_MDX_OUTPUT_PATH || '../src/content/blog'
  const baseDir = path.resolve(__dirname, '../../../../../../', outputPath)

  if (!fs.existsSync(baseDir)) {
    fs.mkdirSync(baseDir, { recursive: true })
  }

  // Build translations map
  const translations: Translations = {}
  const addPostToMap = (p: any) => {
    const lang = p.lang || 'en'
    if (p.slug) {
      translations[lang] = p.slug
    }
  }

  addPostToMap(populatedPost)

  if (populatedPost.linked_translations && Array.isArray(populatedPost.linked_translations)) {
    populatedPost.linked_translations.forEach((loc: any) => {
      addPostToMap(loc)
      if (loc.linked_translations && Array.isArray(loc.linked_translations)) {
        loc.linked_translations.forEach((sibling: any) => {
          addPostToMap(sibling)
        })
      }
    })
  }

  const mdxContent = generateMDX(populatedPost as BlogPost, translations, true)
  const filename = generateFilename(populatedPost as BlogPost)
  const filepath = path.join(baseDir, filename)

  fs.writeFileSync(filepath, mdxContent, 'utf-8')
  console.log(`✅ Generated Blog Post MDX file: ${filepath}`)

  // Cascade to siblings (one level only)
  if (cascade && populatedPost.linked_translations && Array.isArray(populatedPost.linked_translations)) {
    for (const loc of populatedPost.linked_translations) {
      await writeMDXFile(loc, false)
    }
  }

  return filepath
}

async function deleteMDXFile(post: BlogPost): Promise<string> {
  const outputPath = process.env.BLOG_MDX_OUTPUT_PATH || '../src/content/blog'
  const baseDir = path.resolve(__dirname, '../../../../../../', outputPath)
  const filename = generateFilename(post)
  const filepath = path.join(baseDir, filename)

  if (fs.existsSync(filepath)) {
    fs.unlinkSync(filepath)
    console.log(`🗑️  Deleted Blog Post MDX file: ${filepath}`)
  }
  return filepath
}

export default {
  async afterCreate(event: any) {
    const { result } = event
    if (result && result.publishedAt) {
      const filepath = await writeMDXFile(result)
      if (filepath) {
        await gitCommitAndPush(filepath, `blog: add "${result.title}"`)
      }
    }
  },

  async afterUpdate(event: any) {
    const { result } = event
    if (result) {
      if (result.publishedAt) {
        const filepath = await writeMDXFile(result)
        if (filepath) {
          await gitCommitAndPush(filepath, `blog: update "${result.title}"`)
        }
      } else {
        const filepath = await deleteMDXFile(result)
        await gitCommitAndPush(filepath, `blog: unpublish "${result.title}"`)
      }
    }
  },

  async afterDelete(event: any) {
    const { result } = event
    if (result) {
      const filepath = await deleteMDXFile(result)
      await gitCommitAndPush(filepath, `blog: delete "${result.title}"`)
    }
  }
}
