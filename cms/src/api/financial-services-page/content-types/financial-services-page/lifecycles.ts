import fs from 'fs'
import path from 'path'
import { gitCommitAndPush } from '../../../../utils/gitSync'

interface FinancialServicesPage {
  heroTitle: string
  heroDescription: string
  programOverview: string
  applicationNotice?: string
  ctaTitle?: string
  ctaDescription?: string
  ctaEmailLabel?: string
  ctaSubscribeLabel?: string
  faqItems?: Array<{ title: string; content: string; order?: number }>
  publishedAt?: string
}

interface Event {
  result?: FinancialServicesPage
}

function escapeQuotes(value: string | undefined): string {
  if (!value) return ''
  return value.replace(/"/g, '\\"')
}

function generateMDX(page: FinancialServicesPage): string {
  const faqItems = page.faqItems ?? []
  const frontmatter = [
    `heroTitle: "${escapeQuotes(page.heroTitle)}"`,
    `heroDescription: "${escapeQuotes(page.heroDescription)}"`,
    `programOverview: "${escapeQuotes(page.programOverview)}"`,
    page.applicationNotice
      ? `applicationNotice: "${escapeQuotes(page.applicationNotice)}"`
      : undefined,
    `ctaTitle: "${escapeQuotes(page.ctaTitle || '')}"`,
    `ctaDescription: "${escapeQuotes(page.ctaDescription || '')}"`,
    `ctaEmailLabel: "${escapeQuotes(page.ctaEmailLabel || 'Contact Us')}"`,
    `ctaSubscribeLabel: "${escapeQuotes(page.ctaSubscribeLabel || 'Subscribe for Updates')}"`,
    `faqItems: ${JSON.stringify(faqItems)}`
  ]
    .filter(Boolean)
    .join('\n')

  return `---\n${frontmatter}\n---\n`
}

async function writeMDXFile(page: FinancialServicesPage): Promise<void> {
  const outputPath =
    process.env.FINANCIAL_SERVICES_PAGE_MDX_OUTPUT_PATH ||
    '../src/content/financial-services'
  const baseDir = path.resolve(__dirname, '../../../../../../', outputPath)

  if (!fs.existsSync(baseDir)) {
    fs.mkdirSync(baseDir, { recursive: true })
  }

  const filename = `financial-services-page.mdx`
  const filepath = path.join(baseDir, filename)
  const mdxContent = generateMDX(page)

  fs.writeFileSync(filepath, mdxContent, 'utf-8')
  console.log(`✅ Generated Financial Services Page MDX file: ${filepath}`)

  await gitCommitAndPush(filepath, 'financial-services: update page content')
}

async function deleteMDXFile(): Promise<void> {
  const outputPath =
    process.env.FINANCIAL_SERVICES_PAGE_MDX_OUTPUT_PATH ||
    '../src/content/financial-services'
  const baseDir = path.resolve(__dirname, '../../../../../../', outputPath)
  const filename = `financial-services-page.mdx`
  const filepath = path.join(baseDir, filename)

  if (fs.existsSync(filepath)) {
    fs.unlinkSync(filepath)
    console.log(`🗑️  Deleted Financial Services Page MDX file: ${filepath}`)
    await gitCommitAndPush(filepath, 'financial-services: delete page content')
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
        await deleteMDXFile()
      }
    }
  },
  async afterDelete() {
    await deleteMDXFile()
  }
}
