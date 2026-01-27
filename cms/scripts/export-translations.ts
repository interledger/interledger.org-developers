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

// CLI Argument Parsing
const args = process.argv.slice(2)
const options = {
  limit: parseInt(getArgValue('--limit') || '0'),
  since: getArgValue('--since'),
  ids: getArgValue('--ids')?.split(',').map(Number),
  slugs: getArgValue('--slugs')?.split(','),
  force: args.includes('--force'),
  help: args.includes('--help') || args.includes('-h')
}

function getArgValue(name: string): string | undefined {
  const index = args.indexOf(name)
  if (index !== -1 && index + 1 < args.length) {
    return args[index + 1]
  }
  return undefined
}

if (options.help) {
  console.log(`
Usage: tsx scripts/export-translations.ts [options]

Options:
  --limit <number>      Process only the first N posts
  --since <YYYY-MM-DD>  Process posts published after this date
  --ids <id1,id2>       Process only specific post IDs
  --slugs <s1,s2>       Process only specific slugs
  --force               Export all locales even if translation exists (uses translated content)
  -h, --help            Show this help message
  `)
  process.exit(0)
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

interface BlogPost {
  id: number
  title: string
  description: string
  slug: string
  date: string
  content?: string
  featuredImage?: MediaFile
  ogImageUrl?: string
  lang?: string
  linked_translations?: BlogPost[]
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

async function fetchBlogPosts(filters: string[] = []): Promise<BlogPost[]> {
  try {
    const queryParams = [
      'populate[0]=featuredImage',
      'populate[1]=linked_translations',
      'populate[2]=linked_translations.featuredImage',
      'filters[publishedAt][$notNull]=true',
      // Only export English posts as source
      'filters[$or][0][lang][$eq]=en',
      'filters[$or][1][lang][$null]=true',
      ...filters
    ]

    const response = await fetch(
      `${STRAPI_URL}/api/blog-posts?${queryParams.join('&')}`,
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

  const apiFilters: string[] = []
  if (options.since) {
    apiFilters.push(`filters[publishedAt][$gte]=${options.since}`)
  }
  if (options.ids) {
    options.ids.forEach((id, index) => {
      apiFilters.push(`filters[id][$in][${index}]=${id}`)
    })
  }
  if (options.slugs) {
    options.slugs.forEach((slug, index) => {
      apiFilters.push(`filters[slug][$in][${index}]=${slug}`)
    })
  }

  let posts = await fetchBlogPosts(apiFilters)

  if (options.limit > 0) {
    posts = posts.slice(0, options.limit)
    console.log(`🔢 Limited to ${options.limit} posts`)
  }

  if (posts.length === 0) {
    console.log('ℹ️  No published blog posts found to export')
    return
  }

  if (!fs.existsSync(EXPORTS_DIR)) {
    fs.mkdirSync(EXPORTS_DIR, { recursive: true })
  }

  const failedExports: string[] = []
  let totalExported = 0
  let totalSkipped = 0

  for (const post of posts) {
    try {
      // Build translations map
      const translations: Translations = {
        en: post.slug
      }

      // Check which locales already have translations in Strapi
      const existingLocales = (post.linked_translations || [])
        .map((t) => t.lang)
        .filter(Boolean) as string[]

      let localesToExport: string[]
      if (options.force) {
        localesToExport = locales
      } else {
        localesToExport = locales.filter((l) => !existingLocales.includes(l))
      }

      if (localesToExport.length === 0) {
        console.log(
          `⏭️  Skipping "${post.title}": Translations already exist for all locales (use --force to override)`
        )
        totalSkipped++
        continue
      }

      locales.forEach((locale) => {
        // e.g., 'es-my-post-title'
        translations[locale] = `${locale}-${post.slug}`
      })

      // Export English version as reference
      const filename = generateFilename(post)
      const filepath = path.join(EXPORTS_DIR, filename)
      const mdxContent = generateMDX(post, undefined, translations)

      fs.writeFileSync(filepath, mdxContent, 'utf-8')
      console.log(`✅ Exported reference (EN): ${filename}`)
      totalExported++

      // Export missing or forced localized versions for translation
      for (const locale of localesToExport) {
        const existingTranslation = (post.linked_translations || []).find(
          (t) => t.lang === locale
        )

        const localizedFilename = generateFilename(post, locale)
        const localizedFilepath = path.join(EXPORTS_DIR, localizedFilename)

        let localizedMdxContent: string
        if (existingTranslation && options.force) {
          // Use the actual translation data from Strapi
          const translationData: BlogPost = {
            ...existingTranslation,
            date: existingTranslation.date || post.date // Fallback to parent date
          }
          // Use isTranslated: true because this reflects existing state
          localizedMdxContent = generateMDX(
            translationData,
            locale,
            translations,
            true
          )
          console.log(
            `✅ Exported existing translation (${locale}): ${localizedFilename}`
          )
        } else {
          // Use English source as template
          localizedMdxContent = generateMDX(
            post,
            locale,
            translations,
            false
          )
          console.log(
            `✅ Exported for translation (${locale}): ${localizedFilename}`
          )
        }

        fs.writeFileSync(localizedFilepath, localizedMdxContent, 'utf-8')
        totalExported++
      }

      if (!options.force && localesToExport.length < locales.length) {
        const skipped = locales.filter((l) => !localesToExport.includes(l))
        console.log(`   (Skipped ${skipped.join(', ')} - already exists)`)
      }
    } catch (error) {
      console.error(
        `❌ Failed to export post "${post.title}":`,
        (error as Error).message
      )
      failedExports.push(post.title)
    }
  }

  console.log(
    `\n✨ Export complete! ${totalExported} files generated. ${totalSkipped} posts fully skipped.`
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
