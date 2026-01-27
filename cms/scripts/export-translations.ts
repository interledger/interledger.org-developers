import fs from 'fs'
import path from 'path'
import dotenv from 'dotenv'
import { htmlToMarkdown } from '../src/utils/contentUtils.js'

dotenv.config({ path: path.join(__dirname, '../.env') })

const STRAPI_URL = process.env.STRAPI_URL || 'http://localhost:1337'
const STRAPI_API_TOKEN = process.env.STRAPI_API_TOKEN

if (!STRAPI_API_TOKEN) {
  console.error('❌ STRAPI_API_TOKEN is required. Set it in .env')
  process.exit(1)
}

const EXPORTS_DIR = path.join(__dirname, '../exports/translations')

function escapeQuotes(value: string): string {
  return value.replace(/"/g, '\\"')
}

function formatDate(dateString: string): string {
  if (!dateString) return ''
  const date = new Date(dateString)
  if (isNaN(date.getTime())) return dateString
  return date.toISOString().split('T')[0]
}

interface BlogPost {
  id: number
  title: string
  description: string
  slug: string
  date: string
  content?: string
  featuredImage?: MediaFile
  ogImageUrl?: string
}

interface MediaFile {
  id: number
  url: string
  alternativeText?: string
  name?: string
}

interface StrapiResponse {
  data?: BlogPost[]
}

interface Locale {
  id: number
  name: string
  code: string
  isDefault: boolean
}

interface LocalesResponse {
  data?: Locale[]
}

interface Translations {
  [key: string]: string | boolean
}

function generateMDX(post: BlogPost, locale?: string, translations?: Translations, isTranslated?: boolean): string {
  const imageUrl = post.featuredImage?.url

  const frontmatterLines = [
    `title: "${escapeQuotes(post.title)}"`,
    `description: "${escapeQuotes(post.description)}"`,
    post.ogImageUrl
      ? `ogImageUrl: "${escapeQuotes(post.ogImageUrl)}"`
      : undefined,
    `date: ${formatDate(post.date)}`,
    `slug: ${post.slug}`,
    imageUrl ? `image: "${escapeQuotes(imageUrl)}"` : undefined,
    locale ? `lang: "${escapeQuotes(locale)}"` : undefined,
    locale
      ? `uniqueSlug: ${locale !== 'en' ? `${locale}-${post.slug}` : post.slug}`
      : undefined,
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
  const content = post.content || ''

  return `---\n${frontmatter}\n---\n\n${content}\n`
}

function generateFilename(post: BlogPost, locale?: string): string {
  const date = formatDate(post.date)
  const prefix = date ? `${date}-` : ''
  const langSuffix = locale ? `.${locale}` : ''
  return `${prefix}${post.slug}${langSuffix}.mdx`
}

async function fetchLocales(): Promise<string[]> {
  try {
    const response = await fetch(`${STRAPI_URL}/api/i18n/locales`, {
      headers: {
        Authorization: `Bearer ${STRAPI_API_TOKEN}`
      }
    })

    if (!response.ok) {
      console.warn('⚠️  Could not fetch locales from Strapi, using default set')
      return ['es', 'zh', 'de', 'fr']
    }

    const data = await response.json()
    console.log('Locales API response:', data)
    let localeCodes: string[] = []
    if (Array.isArray(data)) {
      localeCodes = data
        .map((locale: Locale) => locale.code)
        .filter((code) => code !== 'en')
    } else {
      const responseData = data as LocalesResponse
      localeCodes =
        responseData.data
          ?.map((locale) => locale.code)
          .filter((code) => code !== 'en') || []
    }
    return localeCodes.length > 0 ? localeCodes : ['es', 'zh', 'de', 'fr']
  } catch (error) {
    console.warn(
      '⚠️  Error fetching locales, using default set:',
      (error as Error).message
    )
    return ['es', 'zh', 'de', 'fr']
  }
}

async function fetchBlogPosts(): Promise<BlogPost[]> {
  try {
    const response = await fetch(
      `${STRAPI_URL}/api/blog-posts?populate=*&filters[publishedAt][$notNull]=true`,
      {
        headers: {
          Authorization: `Bearer ${STRAPI_API_TOKEN}`
        }
      }
    )

    if (!response.ok) {
      throw new Error(`Failed to fetch blog posts: ${response.statusText}`)
    }

    const data = (await response.json()) as StrapiResponse
    return data.data || []
  } catch (error) {
    console.error('❌ Error fetching blog posts:', (error as Error).message)
    return []
  }
}

async function exportTranslations(): Promise<void> {
  console.log('🚀 Starting translation export...')

  const locales = await fetchLocales()
  console.log(
    `📍 Found ${locales.length} locales for translation: ${locales.join(', ')}`
  )

  const posts = await fetchBlogPosts()
  if (posts.length === 0) {
    console.log('ℹ️  No published blog posts found to export')
    return
  }

  if (!fs.existsSync(EXPORTS_DIR)) {
    fs.mkdirSync(EXPORTS_DIR, { recursive: true })
  }

  const failedExports: string[] = []

  for (const post of posts) {
    try {
      // Build translations map
      // Default: Generate predictable slugs for all locales
      const translations: Translations = {
        en: post.slug
      }

      locales.forEach(locale => {
        // e.g., 'es-my-post-title'
        translations[locale] = `${locale}-${post.slug}`
      })

      // Export English version
      const filename = generateFilename(post)
      const filepath = path.join(EXPORTS_DIR, filename)
      const mdxContent = generateMDX(post, undefined, translations)

      fs.writeFileSync(filepath, mdxContent, 'utf-8')
      console.log(`✅ Exported: ${filename}`)

      // Export localized versions for translation
      for (const locale of locales) {
        const localizedFilename = generateFilename(post, locale)
        const localizedFilepath = path.join(EXPORTS_DIR, localizedFilename)
        // Add isTranslated: false to frontmatter for localized files
        const localizedMdxContent = generateMDX(post, locale, translations, false)

        fs.writeFileSync(localizedFilepath, localizedMdxContent, 'utf-8')
        console.log(`✅ Exported: ${localizedFilename}`)
      }
    } catch (error) {
      console.error(
        `❌ Failed to export post "${post.title}":`,
        (error as Error).message
      )
      failedExports.push(post.title)
    }
  }

  const totalFiles = posts.length * (1 + locales.length)
  const successFiles =
    (posts.length - failedExports.length) * (1 + locales.length)

  console.log(
    `\n✨ Export complete! ${successFiles}/${totalFiles} files exported to ${EXPORTS_DIR} (${posts.length} posts × ${1 + locales.length} locales)`
  )

  if (failedExports.length > 0) {
    console.log(`\n⚠️  Failed exports (${failedExports.length}):`)
    failedExports.forEach((title) => console.log(`   - ${title}`))
  }
}

exportTranslations().catch((error) => {
  console.error('❌ Unhandled error during export:', error)
  process.exit(1)
})
