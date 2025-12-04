import { defineCollection, z } from 'astro:content'
import { docsLoader, i18nLoader } from '@astrojs/starlight/loaders'
import { docsSchema, i18nSchema } from '@astrojs/starlight/schema'
import { glob } from 'astro/loaders'

const blogCollection = defineCollection({
  loader: glob({ pattern: '**/[^_]*.{md,mdx}', base: './src/content/blog' }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    slug: z.string(),
    date: z.date(),
    lang: z.string().optional(),
    image: z.string().optional(),
    ogImageUrl: z.string().optional()
  })
})

const pressCollection = defineCollection({
  loader: glob({ pattern: '**/[^_]*.{md,mdx}', base: './src/content/press' }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    publishDate: z.string(),
    slug: z.string(),
    publication: z.string().optional(),
    publicationLogo: z.string().optional(),
    externalUrl: z.string().optional(),
    featured: z.boolean().default(false),
    category: z.enum(['press-release', 'media-mention', 'announcement']).default('media-mention')
  })
})

const grantTrackCollection = defineCollection({
  loader: glob({ pattern: '**/[^_]*.{md,mdx}', base: './src/content/grant-tracks' }),
  schema: z.object({
    name: z.string(),
    amount: z.string(),
    description: z.string(),
    order: z.number().default(0)
  })
})

const infoItemsCollection = defineCollection({
  loader: glob({ pattern: '**/[^_]*.{md,mdx}', base: './src/content/info-items' }),
  schema: z.object({
    title: z.string(),
    content: z.string(),
    order: z.number().default(0)
  })
})

const financialServicesPageCollection = defineCollection({
  loader: glob({
    pattern: '**/[^_]*.{md,mdx}',
    base: './src/content/financial-services'
  }),
  schema: z.object({
    heroTitle: z.string(),
    heroDescription: z.string(),
    introText: z.string(),
    ctaTitle: z.string(),
    ctaDescription: z.string().optional(),
    ctaEmailLabel: z.string(),
    ctaSubscribeLabel: z.string()
  })
})

export const collections = {
  docs: defineCollection({ loader: docsLoader(), schema: docsSchema() }),
  i18n: defineCollection({ loader: i18nLoader(), schema: i18nSchema() }),
  blog: blogCollection,
  press: pressCollection,
  'grant-tracks': grantTrackCollection,
  'info-items': infoItemsCollection,
  'financial-services': financialServicesPageCollection
}
