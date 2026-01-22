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

function generateMDX(post: BlogPost): string {
  const imageUrl = post.featuredImage?.url

  const frontmatterLines = [
    `title: "${escapeQuotes(post.title)}"`,
    `description: "${escapeQuotes(post.description)}"`,
    post.ogImageUrl
      ? `ogImageUrl: "${escapeQuotes(post.ogImageUrl)}"`
      : undefined,
    `date: ${formatDate(post.date)}`,
    `slug: ${post.slug}`,
    imageUrl ? `image: "${escapeQuotes(imageUrl)}"` : undefined
  ].filter(Boolean) as string[]

  const frontmatter = frontmatterLines.join('\n')
  const content = post.content ? htmlToMarkdown(post.content) : ''

  return `---\n${frontmatter}\n---\n\n${content}\n`
}

function generateFilename(post: BlogPost): string {
  const date = formatDate(post.date)
  const prefix = date ? `${date}-` : ''
  return `${prefix}${post.slug}.mdx`
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
      const filename = generateFilename(post)
      const filepath = path.join(EXPORTS_DIR, filename)
      const mdxContent = generateMDX(post)

      fs.writeFileSync(filepath, mdxContent, 'utf-8')
      console.log(`✅ Exported: ${filename}`)
    } catch (error) {
      console.error(
        `❌ Failed to export post "${post.title}":`,
        (error as Error).message
      )
      failedExports.push(post.title)
    }
  }

  console.log(
    `\n✨ Export complete! ${posts.length - failedExports.length}/${posts.length} posts exported to ${EXPORTS_DIR}`
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
