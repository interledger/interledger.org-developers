import { defineConfig } from 'astro/config'
import netlify from '@astrojs/netlify'
import starlight from '@astrojs/starlight'
import starlightLinksValidator from 'starlight-links-validator'
import starlightFullViewMode from 'starlight-fullview-mode'

import mdx from '@astrojs/mdx'

// https://astro.build/config
export default defineConfig({
  site: 'https://interledger.org',
  output: 'server',
  prerender: {
    default: true
  },
  adapter: netlify(),
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
            src: '/scripts/highlight.min.js',
            defer: true
          }
        },
        {
          tag: 'script',
          attrs: {
            src: '/scripts/init.js',
            defer: true
          }
        },
        {
          tag: 'script',
          attrs: {
            defer: true,
            'data-website-id': '50d81dd1-bd02-4f82-8a55-34a09ccbbbd9',
            src: 'https://ilf-site-analytics.netlify.app/script.js',
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
            {
              label: 'Interledger Protocol V4 (ILPv4)',
              link: '/rfcs/interledger-protocol'
            },
            {
              label: 'Interledger Architecture',
              link: '/rfcs/interledger-architecture'
            },
            {
              label: 'Interledger Addresses',
              link: '/rfcs/ilp-addresses'
            },
            {
              label: 'STREAM Protocol',
              link: '/rfcs/stream-protocol'
            },
            {
              label: 'Simple Payment Setup Protocol (SPSP)',
              link: '/rfcs/simple-payment-setup-protocol'
            },
            {
              label: 'Peering, Clearing and Settling',
              link: '/rfcs/peering-clearing-settling'
            },
            {
              label: 'Settlement Engines',
              link: '/rfcs/settlement-engines'
            },
            {
              label: 'ILP Over HTTP',
              link: '/rfcs/ilp-over-http'
            },
            {
              label: 'Bilateral Transfer Protocol',
              link: '/rfcs/bilateral-transfer-protocol'
            },
            {
              label: 'STREAM Receipts',
              link: '/rfcs/stream-receipts'
            },
            {
              label: 'Hashed-Timelock Agreements',
              link: '/rfcs/hashed-timelock-agreements'
            },
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
