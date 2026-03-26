import { defineConfig } from 'astro/config'
import starlight from '@astrojs/starlight'
import starlightLinksValidator from 'starlight-links-validator'
import starlightFullViewMode from 'starlight-fullview-mode'

import mdx from '@astrojs/mdx'
import { PUBLISHED_RFC_SIDEBAR_ITEMS } from './src/data/rfcs.ts'

// https://astro.build/config
export default defineConfig({
  site: 'https://interledger.org',
  base: '/developers',
  integrations: [
    starlight({
      title: 'Interledger',
      description: 'Enable seamless exchange of value across payment networks.',
      customCss: [
        './node_modules/@interledger/docs-design-system/src/styles/teal-theme.css',
        './node_modules/@interledger/docs-design-system/src/styles/ilf-docs.css',
        './src/styles/interledger.css',
        './src/styles/atom-one-light.min.css'
      ],
      plugins: [
        starlightLinksValidator({
          exclude: ['/participation-guidelines']
        }),
        starlightFullViewMode({ leftSidebarEnabled: false })
      ],
      head: [
        {
          tag: 'script',
          attrs: {
            src: '/developers/scripts/highlight.min.js',
            defer: true
          }
        },
        {
          tag: 'script',
          attrs: {
            src: '/developers/scripts/init.js',
            defer: true
          }
        },
        {
          tag: 'script',
          attrs: {
            defer: true,
            'data-website-id': '50d81dd1-bd02-4f82-8a55-34a09ccbbbd9',
            src: 'https://uwa.interledger.org/script.js',
            'data-domains': 'interledger.org'
          }
        }
      ],
      components: {
        Header: './src/components/Header.astro',
        PageSidebar: './src/components/PageSidebar.astro'
      },
      social: [
        {
          icon: 'github',
          label: 'GitHub',
          href: 'https://github.com/interledger'
        }
      ],
      sidebar: [
        {
          label: 'Overview',
          link: '/get-started'
        },
        {
          label: 'Get involved',
          link: '/get-involved'
        },
        {
          label: 'Specifications',
          items: [
            ...PUBLISHED_RFC_SIDEBAR_ITEMS,
            {
              label: 'Payment Pointers',
              link: 'https://paymentpointers.org',
              attrs: {
                target: '_blank',
                rel: 'noopener noreferrer',
                'data-icon': 'external'
              }
            }
          ]
        }
      ],
      expressiveCode: {
        themes: ['github-dark-dimmed'],
        styleOverrides: {
          borderColor: 'transparent',
          borderRadius: 'var(--border-radius)'
        },
        defaultProps: {
          wrap: true
        }
      }
    }),
    mdx()
  ],
  redirects: {
    '/hacktoberfest': 'https://interledger.org/hacktoberfest',
    '/hacktoberfest-2023': 'https://interledger.org/hacktoberfest'
  },
  server: {
    port: 1103
  }
})
