import fs from 'fs'
import path from 'path'
import dotenv from 'dotenv'
import { markdownToHtml } from '../src/utils/contentUtils.js'

dotenv.config({ path: path.join(__dirname, '../.env') })

const STRAPI_URL = process.env.STRAPI_URL || 'http://localhost:1337'
const STRAPI_API_TOKEN = process.env.STRAPI_API_TOKEN

if (!STRAPI_API_TOKEN) {
  console.error('❌ STRAPI_API_TOKEN is required. Set it in .env')
  process.exit(1)
}

const IMPORTS_DIR = path.join(__dirname, '../exports/translations')

interface Frontmatter {
  title?: string
  description?: string
  date?: string
  slug?: string
  image?: string
  ogImageUrl?: string
  [key: string]: string | undefined
}

interface ParsedMDX {
  frontmatter: Frontmatter
  body: string
}

interface StrapiBlogPost {
  title: string
  description: string
  slug: string
  date: string
  content: string
  lang: string
  publishedAt: string
  ogImageUrl?: string
  featuredImage?: { id: number }
  linked_translations?: any
}

interface FullPostAttributes {
  title?: string
  description?: string
  date?: string
  slug?: string
  image?: string
  ogImageUrl?: string
  lang?: string
  featuredImage?: {
    data?: {
      id: number
    }
  }
}

interface StrapiResponse {
  data?: Array<{
    id: number
    attributes: Frontmatter
  }>
}

interface FullStrapiResponse {
  data?: Array<{
    id: number
    documentId: string
    slug: string
    lang?: string
    ogImageUrl?: string
    featuredImage?: {
      id: number
      url: string
    }
  }>
}

interface ImportError {
  file: string
  error: string
}

interface SkipInfo {
  file: string
  reason: string
}

function parseFrontmatter(content: string): ParsedMDX | null {
  const frontmatterRegex = /^---\n([\s\S]*?)\n---\n([\s\S]*)$/
  const match = content.match(frontmatterRegex)

  if (!match) {
    return null
  }

  const [, frontmatterStr, body] = match
  const frontmatter: Frontmatter = {}

  frontmatterStr.split('\n').forEach((line) => {
    const [key, ...valueParts] = line.split(':')
    if (key && valueParts.length > 0) {
      let value = valueParts.join(':').trim()
      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1)
      }
      frontmatter[key.trim()] = value
    }
  })

  return {
    frontmatter,
    body
  }
}

function extractLangFromFilename(filename: string): string | null {
  const match = filename.match(/\.([a-z]{2}(-[A-Z]{2})?)\.mdx$/)
  return match ? match[1] : null
}

function extractSlugAndDate(filename: string): {
  date: string | null
  slug: string
} {
  const dateMatch = filename.match(/^(\d{4}-\d{2}-\d{2})-(.*)/)
  if (dateMatch) {
    return {
      date: dateMatch[1],
      slug: dateMatch[2]
        .replace(/\.([a-z]{2}(-[A-Z]{2})?)\.mdx$/, '')
        .replace(/\.mdx$/, '')
    }
  }
  const slugMatch = filename.match(/^(.*)/)
  return {
    date: null,
    slug: slugMatch
      ? slugMatch[1]
        .replace(/\.([a-z]{2}(-[A-Z]{2})?)\.mdx$/, '')
        .replace(/\.mdx$/, '')
      : filename
  }
}

async function checkExistingEntry(
  slug: string,
  lang: string
): Promise<number | null> {
  try {
    const filters = [`filters[slug][$eq]=${slug}`]
    // If checking for EN, also check for null lang as Strapi might have it as null
    if (lang === 'en') {
      filters.push(`filters[$or][0][lang][$eq]=en&filters[$or][1][lang][$null]=true`)
    } else {
      filters.push(`filters[lang][$eq]=${lang}`)
    }

    const response = await fetch(
      `${STRAPI_URL}/api/blog-posts?${filters.join('&')}`,
      {
        headers: {
          Authorization: `Bearer ${STRAPI_API_TOKEN}`
        }
      }
    )

    if (!response.ok) {
      return null
    }

    const data = (await response.json()) as StrapiResponse
    return data.data && data.data.length > 0 ? data.data[0].id : null
  } catch (error) {
    console.error('❌ Error checking existing entry:', (error as Error).message)
    return null
  }
}

async function getEnglishPostImage(englishSlug: string): Promise<{
  id: number
  documentId: string
  featuredImage?: number
  ogImageUrl?: string
  imageUrl?: string
} | null> {
  try {
    const response = await fetch(
      `${STRAPI_URL}/api/blog-posts?filters[slug][$eq]=${englishSlug}&populate=featuredImage`,
      {
        headers: {
          Authorization: `Bearer ${STRAPI_API_TOKEN}`
        }
      }
    )

    if (!response.ok) {
      return null
    }

    const data = (await response.json()) as FullStrapiResponse
    if (data.data && data.data.length > 0) {
      const post = data.data[0]
      return {
        id: post.id,
        documentId: post.documentId,
        featuredImage: post.featuredImage?.id,
        ogImageUrl: post.ogImageUrl,
        imageUrl: post.featuredImage?.url
      }
    }
    return null
  } catch (error) {
    console.error(
      '❌ Error fetching English post image:',
      (error as Error).message
    )
    return null
  }
}

async function createBlogPost(postData: StrapiBlogPost): Promise<string> {
  try {
    const response = await fetch(`${STRAPI_URL}/api/blog-posts`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${STRAPI_API_TOKEN}`
      },
      body: JSON.stringify({
        data: postData
      })
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(
        `Failed to create blog post: ${response.statusText} - ${errorText}`
      )
    }

    const data = (await response.json()) as { data: { documentId: string } }
    return data.data.documentId
  } catch (error) {
    console.error('❌ Error creating blog post:', (error as Error).message)
    throw error
  }
}

async function updateBlogPost(documentId: string, data: Partial<StrapiBlogPost>): Promise<void> {
  try {
    const response = await fetch(`${STRAPI_URL}/api/blog-posts/${documentId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${STRAPI_API_TOKEN}`
      },
      body: JSON.stringify({
        data
      })
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(
        `Failed to update blog post: ${response.statusText} - ${errorText}`
      )
    }
  } catch (error) {
    console.error('❌ Error updating blog post:', (error as Error).message)
    throw error
  }
}

async function importTranslations(): Promise<void> {
  console.log('🚀 Starting translation import...')

  if (!fs.existsSync(IMPORTS_DIR)) {
    console.log('ℹ️  No translations directory found at', IMPORTS_DIR)
    return
  }

  const files = fs
    .readdirSync(IMPORTS_DIR)
    .filter((file) => file.endsWith('.mdx'))
    .sort((a, b) => {
      const langA = extractLangFromFilename(a) || 'en'
      const langB = extractLangFromFilename(b) || 'en'
      if (langA === 'en' && langB !== 'en') return -1
      if (langA !== 'en' && langB === 'en') return 1
      return a.localeCompare(b)
    })

  if (files.length === 0) {
    console.log('ℹ️  No MDX files found in', IMPORTS_DIR)
    return
  }

  console.log(`📂 Found ${files.length} MDX files to process\n`)

  const failedImports: ImportError[] = []
  const skippedImports: SkipInfo[] = []

  for (const file of files) {
    try {
      console.log(`📖 Processing: ${file}`)

      const filepath = path.join(IMPORTS_DIR, file)
      const content = fs.readFileSync(filepath, 'utf-8')
      const parsed = parseFrontmatter(content)

      if (!parsed) {
        console.log(`   ⚠️  Skipped: Invalid frontmatter format\n`)
        skippedImports.push({ file, reason: 'Invalid frontmatter format' })
        continue
      }

      const { frontmatter, body } = parsed

      // Check isTranslated flag
      if (frontmatter.isTranslated === 'false') {
        console.log(`   ⚠️  Skipped: Translation not ready (isTranslated: false)\n`)
        skippedImports.push({ file, reason: 'isTranslated is false' })
        continue
      }
      const { date, slug } = extractSlugAndDate(file)
      // Default to 'en' if no language code is found in the filename
      const lang = extractLangFromFilename(file) || 'en'

      const uniqueSlug = lang !== 'en' ? `${lang}-${slug}` : slug
      const existingId = await checkExistingEntry(uniqueSlug, lang)
      if (existingId) {
        console.log(
          `   ⚠️  Skipped: Entry already exists for "${uniqueSlug}" in language "${lang}"\n`
        )
        skippedImports.push({ file, reason: 'Entry already exists' })
        continue
      }

      let englishPostDocumentId: string | null = null // For linking
      let englishImage: {
        featuredImage?: number
        ogImageUrl?: string
        imageUrl?: string
      } | null = null

      if (lang !== 'en') {
        const englishSlug = slug
        const engData = await getEnglishPostImage(englishSlug)
        if (engData) {
          englishImage = engData
          englishPostDocumentId = engData.documentId
          console.log(`Found English parent post: Document ID ${englishPostDocumentId}`)
        } else {
          console.log(`⚠️  Warning: English parent post not found for slug "${englishSlug}". Creating as standalone.`)
        }
      }

      const postData: StrapiBlogPost = {
        title: frontmatter.title || slug,
        description: frontmatter.description || '',
        slug: uniqueSlug,
        date: frontmatter.date || date || '',
        content: body,
        lang: lang,
        publishedAt: new Date().toISOString()
      }

      // Set ogImageUrl from frontmatter or English post
      if (frontmatter.ogImageUrl) {
        postData.ogImageUrl = frontmatter.ogImageUrl
      } else if (englishImage?.ogImageUrl) {
        postData.ogImageUrl = englishImage.ogImageUrl
      }

      // Set featuredImage from English post for translated content
      if (englishImage?.featuredImage) {
        postData.featuredImage = { id: englishImage.featuredImage }
      }

      // Create the post
      const newPostDocId = await createBlogPost(postData)

      if (lang !== 'en' && englishPostDocumentId) {
        // Link bidirectional
        // 1. Update English post to connect to this new translation
        await updateBlogPost(englishPostDocumentId, {
          linked_translations: { connect: [newPostDocId] }
        } as any)

        // 2. Update this new translation to connect back to the English post
        await updateBlogPost(newPostDocId, {
          linked_translations: { connect: [englishPostDocumentId] }
        } as any)

        console.log(`   ✅ Imported (linked bidirectional to ${englishPostDocumentId}): "${postData.title}" (${lang})\n`)
      } else {
        console.log(`   ✅ Imported: "${postData.title}" (${lang})\n`)
      }
    } catch (error) {
      console.error(
        `   ❌ Failed to import "${file}":`,
        (error as Error).message,
        '\n'
      )
      failedImports.push({ file, error: (error as Error).message })
    }
  }

  const total = files.length
  const success = total - failedImports.length - skippedImports.length

  console.log(`\n✨ Import complete!`)
  console.log(`   ✅ Success: ${success}/${total}`)
  console.log(`   ⚠️  Skipped: ${skippedImports.length}/${total}`)
  console.log(`   ❌ Failed: ${failedImports.length}/${total}`)

  if (skippedImports.length > 0) {
    console.log(`\n⚠️  Skipped imports (${skippedImports.length}):`)
    skippedImports.forEach(({ file, reason }) => {
      console.log(`   - ${file}: ${reason}`)
    })
  }

  if (failedImports.length > 0) {
    console.log(`\n❌ Failed imports (${failedImports.length}):`)
    failedImports.forEach(({ file, error }) => {
      console.log(`   - ${file}: ${error}`)
    })
  }
}

importTranslations().catch((error) => {
  console.error('❌ Unhandled error during import:', error)
  process.exit(1)
})
