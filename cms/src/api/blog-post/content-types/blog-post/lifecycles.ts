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
  documentId?: number
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
  localizations?: Array<{ id: number; locale: string; documentId?: number }>
  localizations?: any
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
 * In Strapi i18n, all localizations share the same documentId
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
    const entityService = strapi.entityService
    
    // Strategy 1: Use documentId if available (all localizations share the same documentId)
    // In Strapi, documentId might be in result.documentId or we need to query with the ID
    const docId = (post as any).documentId
    
    if (docId) {
      try {
        const englishEntry = await entityService.findOne('api::blog-post.blog-post', docId, {
          locale: 'en'
        })
        
        if (englishEntry && englishEntry.slug) {
          return englishEntry.slug // Use English slug as contentId
        }
      } catch (e) {
        // documentId query failed, try other methods
      }
    }
    
    // Strategy 2: Query by ID with locale='en' (if post.id is available)
    // In Strapi i18n, the same ID can be queried with different locales
    if (post.id) {
      try {
        const englishEntry = await entityService.findOne('api::blog-post.blog-post', post.id, {
          locale: 'en'
        })
        
        if (englishEntry && englishEntry.slug) {
          return englishEntry.slug
        }
      } catch (e) {
        // ID query failed, might not work if IDs are different per locale
      }
    }
    
    // Strategy 3: Query all English entries and find by matching localizations
    // Find English entry that has this post as a localization
    try {
      const allEnglishEntries = await entityService.findMany('api::blog-post.blog-post', {
        locale: 'en',
        populate: ['localizations'],
        limit: 200 // Increased limit to find matches
      })
      
      // Find English entry that has this post as a localization
      for (const englishEntry of allEnglishEntries) {
        if (englishEntry.localizations && Array.isArray(englishEntry.localizations)) {
          // Check if any localization matches this post
          const hasThisLocale = englishEntry.localizations.some((loc: any) => {
            // Match by ID or documentId
            return (loc.id === post.id) || 
                   (loc.documentId === docId) ||
                   (loc.slug === post.slug && (loc.locale === locale || loc.locale === 'es-ES' || loc.locale === 'es'))
          })
          
          if (hasThisLocale && englishEntry.slug) {
            return englishEntry.slug
          }
        }
      }
    } catch (e) {
      console.error(`Error querying English entries: ${e.message}`)
    }
    
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

  // For locale posts, try to get contentId from English base entry
  let finalContentId = contentId
  if (!finalContentId && locale !== 'en' && strapi) {
    const baseContentId = await getContentIdForLocale(strapi, post, locale)
    if (baseContentId) {
      finalContentId = baseContentId
    }
  }

  const filename = generateFilename(post)
  const filepath = path.join(resolvedDir, filename)
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
      // Ensure locale is set on the result
      const locale = getLocale(result, event)
      const postWithLocale = { ...result, locale }
      
      // Get contentId: for English use slug, for locales find base entry
      let contentId: string | undefined = undefined
      const strapi = (global as any).strapi
      
      if (locale === 'en' || !locale) {
        contentId = result.slug // English posts use slug as contentId
      } else {
        // For locale posts, try to find the English base entry
        try {
          if (strapi) {
            // Log what we have to work with
            console.log(`   🔍 Looking for English base entry for: ${result.slug} (${locale})`)
            console.log(`   📋 Post ID: ${result.id}, documentId: ${(result as any).documentId || 'N/A'}`)
            
            // Try multiple strategies to find the English entry
            const baseContentId = await getContentIdForLocale(strapi, result, locale)
            if (baseContentId) {
              contentId = baseContentId
              console.log(`   ✅ Found English base entry: ${baseContentId}`)
            } else {
              console.warn(`   ⚠️  Could not find English base entry for locale post: ${result.slug} (${locale})`)
              console.warn(`   💡 The English post may not exist yet, or they're not linked.`)
              console.warn(`   💡 You may need to manually set contentId in frontmatter to match the English slug.`)
            }
          } else {
            console.warn(`   ⚠️  Strapi instance not available for locale post: ${result.slug}`)
          }
        } catch (error) {
          console.error(`Error getting contentId for locale post: ${error.message}`)
          console.error(`Stack: ${error.stack}`)
        }
      }
      
      await writeMDXFile(postWithLocale, strapi, contentId)
      const filepath = getFilepath(postWithLocale, locale)
      await gitCommitAndPush(filepath, `blog: add "${result.title}" (${locale})`)
    }
  },

  async afterUpdate(event: Event) {
    const { result } = event
    if (result) {
      const locale = getLocale(result, event)
      const postWithLocale = { ...result, locale }
      const filepath = getFilepath(postWithLocale, locale)

      // Get contentId: for English use slug, for locales find base entry
      let contentId: string | undefined = undefined
      const strapi = (global as any).strapi
      
      if (locale === 'en' || !locale) {
        contentId = result.slug // English posts use slug as contentId
      } else {
        // For locale posts, try to find the English base entry
        try {
          if (strapi) {
            const baseContentId = await getContentIdForLocale(strapi, result, locale)
            if (baseContentId) {
              contentId = baseContentId
              console.log(`   🔗 Found English base entry: ${baseContentId}`)
            } else {
              console.warn(`   ⚠️  Could not find English base entry for locale post: ${result.slug} (${locale})`)
            }
          }
        } catch (error) {
          console.error(`Error getting contentId for locale post: ${error.message}`)
        }
      }

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
      const postWithLocale = { ...result, locale }
      await deleteMDXFile(postWithLocale)
      const filepath = getFilepath(postWithLocale, locale)
      await gitCommitAndPush(filepath, `blog: delete "${result.title}" (${locale})`)
    }
  }
}
