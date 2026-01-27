import fs from 'fs'
import path from 'path'
import { htmlToMarkdown } from '../../../../utils/contentUtils'

const escapeQuotes = (str: string) => str?.replace(/"/g, '\\"') || ''

const formatDate = (date: string) => {
  if (!date) return ''
  return date.split('T')[0]
}

const generateFilename = (post: BlogPost) => {
  const dateStr = formatDate(post.date)
  return `${dateStr}-${post.slug}.${post.lang || 'en'}.mdx`
}

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

  if (translations) {
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
  const content = post.content || '' // CKEditor is already in Markdown mode

  return `---\n${frontmatter}\n---\n\n${content}\n`
}

async function writeMDXFile(post: BlogPost, cascade = true): Promise<void> {
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
    return
  }

  const outputPath = process.env.BLOG_MDX_OUTPUT_PATH || '../src/content/blog'
  const baseDir = path.resolve(__dirname, '../../../../../../', outputPath)

  if (!fs.existsSync(baseDir)) {
    fs.mkdirSync(baseDir, { recursive: true })
  }

  // Build translations map
  const translations: Translations = {}
  const addPostToMap = (p: any) => {
    if (p.lang && p.slug) {
      translations[p.lang] = p.slug
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

  const filename = generateFilename(populatedPost as BlogPost)
  const filepath = path.join(baseDir, filename)
  const mdxContent = generateMDX(populatedPost as BlogPost, translations, true)

  fs.writeFileSync(filepath, mdxContent, 'utf-8')
  console.log(`✅ Generated Blog Post MDX file: ${filepath}`)

  // Cascade to siblings
  if (cascade && populatedPost.linked_translations && Array.isArray(populatedPost.linked_translations)) {
    for (const loc of populatedPost.linked_translations) {
      await writeMDXFile(loc, false)
    }
  }
}

async function deleteMDXFile(post: BlogPost): Promise<void> {
  const outputPath = process.env.BLOG_MDX_OUTPUT_PATH || '../src/content/blog'
  const baseDir = path.resolve(__dirname, '../../../../../../', outputPath)
  const filename = generateFilename(post)
  const filepath = path.join(baseDir, filename)

  if (fs.existsSync(filepath)) {
    fs.unlinkSync(filepath)
    console.log(`🗑️  Deleted Blog Post MDX file: ${filepath}`)
  }
}

export default {
  async afterCreate(event: any) {
    const { result } = event
    if (result && result.publishedAt) {
      await writeMDXFile(result)
    }
  },

  async afterUpdate(event: any) {
    const { result } = event
    if (result) {
      if (result.publishedAt) {
        await writeMDXFile(result)
      } else {
        await deleteMDXFile(result)
      }
    }
  },

  async afterDelete(event: any) {
    const { result } = event
    if (result) {
      await deleteMDXFile(result)
    }
  }
}
