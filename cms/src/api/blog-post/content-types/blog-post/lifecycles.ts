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
  documentId?: string
  title: string
  description: string
  slug: string
  date: string
  content: string
  featuredImage?: MediaFile
  lang?: string
  ogImageUrl?: string
  publishedAt?: string
  locale?: string
  localizations?: Array<{ id: number; locale: string; documentId?: string }>
}

interface Event {
  result?: BlogPost
  params?: {
    data?: BlogPost
    locale?: string
  }
  model?: {
    uid?: string
  }
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

/**
 * Generates a contentId for a blog post
 * For English posts: uses slug as contentId (stable identifier)
 * For locale posts: should be provided from the base entry
 */
function generateContentId(post: BlogPost, locale: string): string {
  // For English posts, use slug as contentId (stable and human-readable)
  if (locale === 'en' || !locale) {
    return post.slug
  }
  // For locale posts, this should be set from the base entry
  // If not set, fall back to slug (will be updated when base entry is found)
  return post.slug
}

/**
 * Gets the contentId for a locale post by finding its English base entry
 * In Strapi v5 i18n, all localizations share the same documentId
 */
async function getContentIdForLocale(
  strapi: any,
  post: BlogPost,
  locale: string
): Promise<string | null> {
  if (!strapi) {
    return null
  }

  try {
    const docId = (post as any).documentId

    // Strategy 1: Use Strapi v5 documents API with documentId
    // All localizations share the same documentId, so query with locale='en'
    if (docId && strapi.documents) {
      try {
        console.log(`   🔍 Querying English entry with documentId: ${docId}`)
        const englishEntry = await strapi.documents('api::blog-post.blog-post').findOne({
          documentId: docId,
          locale: 'en'
        })

        if (englishEntry && englishEntry.slug) {
          console.log(`   ✅ Found via documents API: ${englishEntry.slug}`)
          return englishEntry.slug
        }
      } catch (e) {
        console.log(`   ⚠️  Documents API query failed: ${e.message}`)
      }
    }

    // Strategy 2: Use entityService with filters (Strapi v5 fallback)
    if (docId) {
      try {
        const results = await strapi.entityService.findMany('api::blog-post.blog-post', {
          filters: { documentId: docId },
          locale: 'en',
          limit: 1
        })

        if (results && results.length > 0 && results[0].slug) {
          console.log(`   ✅ Found via entityService filter: ${results[0].slug}`)
          return results[0].slug
        }
      } catch (e) {
        console.log(`   ⚠️  EntityService filter query failed: ${e.message}`)
      }
    }

    // Strategy 3: Query all English entries and match by documentId
    try {
      const allEnglishEntries = await strapi.entityService.findMany('api::blog-post.blog-post', {
        locale: 'en',
        limit: 200
      })

      // Find English entry with matching documentId
      for (const englishEntry of allEnglishEntries) {
        if ((englishEntry as any).documentId === docId && englishEntry.slug) {
          console.log(`   ✅ Found via iteration: ${englishEntry.slug}`)
          return englishEntry.slug
        }
      }
    } catch (e) {
      console.error(`   ❌ Error querying English entries: ${e.message}`)
    }

    console.log(`   ⚠️  Could not find English entry for documentId: ${docId}`)
    return null
  } catch (error) {
    console.error(`Error finding contentId for locale post: ${error.message}`)
    return null
  }
}

function generateMDX(post: BlogPost, contentId?: string): string {
  const imageUrl = getImageUrl(post.featuredImage)
  const locale = post.locale || 'en'
  const postContentId = contentId || generateContentId(post, locale)

  const frontmatterLines = [
    `title: "${escapeQuotes(post.title)}"`,
    `description: "${escapeQuotes(post.description)}"`,
    post.ogImageUrl
      ? `ogImageUrl: "${escapeQuotes(post.ogImageUrl)}"`
      : undefined,
    `date: ${formatDate(post.date)}`,
    `slug: ${post.slug}`,
    `locale: "${locale}"`,
    `contentId: "${postContentId}"`, // Always include contentId
    post.lang ? `lang: "${escapeQuotes(post.lang)}"` : undefined,
    imageUrl ? `image: "${escapeQuotes(imageUrl)}"` : undefined
  ].filter(Boolean) as string[]

  const frontmatter = frontmatterLines.join('\n')
  const content = post.content ? htmlToMarkdown(post.content) : ''

  return `---\n${frontmatter}\n---\n\n${content}\n`
}

async function writeMDXFile(post: BlogPost, strapi?: any, contentId?: string): Promise<void> {
  const baseOutputPath = process.env.BLOG_MDX_OUTPUT_PATH || '../src/content/blog'
  const locale = post.locale || 'en'
  const localeForPath = normalizeLocaleForPath(locale)

  // Determine locale-specific directory
  // Default locale (en) goes to /blog/, other locales go to /{locale}/blog/
  // e.g., ../src/content/blog (en) or ../src/content/es/blog (es)
  const outputPath = localeForPath === 'en'
    ? baseOutputPath
    : path.join(path.dirname(baseOutputPath), localeForPath, 'blog')

  // Resolve from dist/src/api/blog-post/content-types/blog-post/ up to cms root then project root
  const resolvedDir = path.resolve(__dirname, '../../../../../../', outputPath)

  if (!fs.existsSync(resolvedDir)) {
    fs.mkdirSync(resolvedDir, { recursive: true })
  }

  const filename = generateFilename(post)
  const filepath = path.join(resolvedDir, filename)

  // For locale posts, try to get contentId from English base entry first
  let finalContentId = contentId

  if (locale !== 'en') {
    // Strategy 1: Try to find English base entry via Strapi
    if (!finalContentId && strapi) {
      const baseContentId = await getContentIdForLocale(strapi, post, locale)
      if (baseContentId) {
        finalContentId = baseContentId
        console.log(`   🔗 Found English base entry: ${finalContentId}`)
      }
    }

    // Strategy 2: If Strapi lookup failed, check existing MDX file
    if (!finalContentId && fs.existsSync(filepath)) {
      try {
        const existingContent = fs.readFileSync(filepath, 'utf-8')
        const contentIdMatch = existingContent.match(/contentId:\s*["']([^"']+)["']/)
        if (contentIdMatch && contentIdMatch[1]) {
          const existingContentId = contentIdMatch[1].trim()
          // Only use if it's different from the post's own slug
          if (existingContentId !== post.slug) {
            finalContentId = existingContentId
            console.log(`   📋 Using existing contentId from MDX: ${finalContentId}`)
          }
        }
      } catch (e) {
        // Ignore read errors
      }
    }

    // If we still don't have a valid contentId, log a warning
    if (!finalContentId || finalContentId === post.slug) {
      console.warn(`   ⚠️  No English base entry found for ${post.slug}. MDX will use slug as contentId.`)
      console.warn(`   💡 To link this post to an English entry, manually set contentId in the MDX file.`)
      finalContentId = undefined // Let generateMDX use the default
    }
  }

  const mdxContent = generateMDX(post, finalContentId)

  fs.writeFileSync(filepath, mdxContent, 'utf-8')
  console.log(`✅ Generated Blog Post MDX file (locale: ${locale}): ${filepath}`)
  if (finalContentId) {
    console.log(`   📌 contentId: ${finalContentId}`)
  }
}

async function deleteMDXFile(post: BlogPost): Promise<void> {
  const baseOutputPath = process.env.BLOG_MDX_OUTPUT_PATH || '../src/content/blog'
  const locale = post.locale || 'en'
  const localeForPath = normalizeLocaleForPath(locale)
  
  // Determine locale-specific directory
  const outputPath = localeForPath === 'en'
    ? baseOutputPath
    : path.join(path.dirname(baseOutputPath), localeForPath, 'blog')
  const baseDir = path.resolve(__dirname, '../../../../../../', outputPath)
  
  const filename = generateFilename(post)
  const filepath = path.join(baseDir, filename)

  if (fs.existsSync(filepath)) {
    fs.unlinkSync(filepath)
    console.log(`🗑️  Deleted Blog Post MDX file (locale: ${locale}): ${filepath}`)
  }
}

/**
 * Gets the locale from a blog post or event params
 */
function getLocale(post: BlogPost | undefined, event?: Event): string {
  // Try to get locale from the post first
  if (post?.locale) {
    return post.locale
  }
  // Fall back to event params
  if (event?.params?.locale) {
    return event.params.locale
  }
  // Default to 'en'
  return 'en'
}

/**
 * Normalizes locale code to use only the language part (e.g., 'es-ES' -> 'es')
 * This ensures directory paths use simple language codes like /es/ instead of /es-ES/
 */
function normalizeLocaleForPath(locale: string): string {
  // Extract just the language code (part before hyphen)
  // e.g., 'es-ES' -> 'es', 'en-US' -> 'en', 'fr' -> 'fr'
  return locale.split('-')[0]
}

/**
 * Gets the filepath for a blog post based on its locale
 */
function getFilepath(post: BlogPost, locale?: string): string {
  const baseOutputPath = process.env.BLOG_MDX_OUTPUT_PATH || '../src/content/blog'
  const postLocale = locale || post.locale || 'en'
  const localeForPath = normalizeLocaleForPath(postLocale)
  const outputPath = localeForPath === 'en'
    ? baseOutputPath
    : path.join(path.dirname(baseOutputPath), localeForPath, 'blog')
  const baseDir = path.resolve(__dirname, '../../../../../../', outputPath)
  const filename = generateFilename(post)
  return path.join(baseDir, filename)
}

export default {
  async afterCreate(event: Event) {
    const { result } = event
    if (result && result.publishedAt) {
      const locale = getLocale(result, event)

      // Skip MDX generation for non-English locales
      // The sync-mdx.cjs script handles locale MDX files with proper contentId linking
      if (locale !== 'en') {
        console.log(`⏭️  Skipping MDX generation for locale post: ${result.slug} (${locale})`)
        console.log(`   💡 Use sync-mdx.cjs to sync locale posts with correct contentId`)
        return
      }

      const postWithLocale = { ...result, locale }
      const contentId = result.slug // English posts use slug as contentId
      const strapi = (global as any).strapi

      await writeMDXFile(postWithLocale, strapi, contentId)
      const filepath = getFilepath(postWithLocale, locale)
      await gitCommitAndPush(filepath, `blog: add "${result.title}" (${locale})`)
    }
  },

  async afterUpdate(event: Event) {
    const { result } = event
    if (result) {
      const locale = getLocale(result, event)

      // Skip MDX generation for non-English locales
      // The sync-mdx.cjs script handles locale MDX files with proper contentId linking
      if (locale !== 'en') {
        console.log(`⏭️  Skipping MDX generation for locale post: ${result.slug} (${locale})`)
        return
      }

      const postWithLocale = { ...result, locale }
      const filepath = getFilepath(postWithLocale, locale)
      const contentId = result.slug // English posts use slug as contentId
      const strapi = (global as any).strapi

      if (result.publishedAt) {
        await writeMDXFile(postWithLocale, strapi, contentId)
        await gitCommitAndPush(filepath, `blog: update "${result.title}" (${locale})`)
      } else {
        await deleteMDXFile(postWithLocale)
        await gitCommitAndPush(filepath, `blog: unpublish "${result.title}" (${locale})`)
      }
    }
  },

  async afterDelete(event: Event) {
    const { result } = event
    if (result) {
      const locale = getLocale(result, event)

      // Skip MDX deletion for non-English locales
      // The sync-mdx.cjs script handles locale MDX files
      if (locale !== 'en') {
        console.log(`⏭️  Skipping MDX deletion for locale post: ${result.slug} (${locale})`)
        return
      }

      const postWithLocale = { ...result, locale }
      await deleteMDXFile(postWithLocale)
      const filepath = getFilepath(postWithLocale, locale)
      await gitCommitAndPush(filepath, `blog: delete "${result.title}" (${locale})`)
    }
  }
}
