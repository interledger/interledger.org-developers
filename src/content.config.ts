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
    lang: z.string(),
    date: z.date(),
    image: z.string().optional(),
    tags: z.array(
      z.enum([
        'Interledger Protocol',
        'Open Payments',
        'Rafiki',
        'Releases',
        'Updates',
        'Web Monetization'
        // Please add a matching translation in i18n/ui.ts for any new tag
      ])
    ),
    authors: z.array(z.string()),
    author_urls: z.array(z.string())
  })
})

export const collections = {
  docs: defineCollection({ loader: docsLoader(), schema: docsSchema() }),
  i18n: defineCollection({ loader: i18nLoader(), schema: i18nSchema() }),
  blog: blogCollection
}
