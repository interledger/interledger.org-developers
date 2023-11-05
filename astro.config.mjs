import { defineConfig } from "astro/config";
import starlight from "@astrojs/starlight";

// https://astro.build/config
export default defineConfig({
  site: "https://interledger.org",
  base: "/developers",
  integrations: [
    starlight({
      title: "Interledger Protocol (ILP)",
      description: "Enable seamless exchange of value across payment networks.",
      customCss: [
        "./node_modules/@interledger/docs-design-system/src/styles/green-theme.css",
        "./node_modules/@interledger/docs-design-system/src/styles/ilf-docs.css",
        "./src/styles/interledger.css",
        "./src/styles/atom-one-light.min.css",
      ],
      head: [
        {
          tag: "script",
          attrs: {
            src: "/developers/scripts/highlight.min.js",
            defer: true,
          },
        },
        {
          tag: "script",
          attrs: {
            src: "/developers/scripts/init.js",
            defer: true,
          },
        },
      ],
      components: {
        Header: "./src/components/Header.astro",
      },
      social: {
        github: "https://github.com/interledger",
      },
      sidebar: [
        {
          label: "Get started",
          link: "/get-started",
        },
        {
          label: "Specs",
          items: [
            {
              label: "Interledger Protocol V4 (ILPv4)",
              link: "/rfcs/interledger-protocol",
            },
            {
              label: "Interledger Architecture",
              link: "/rfcs/interledger-architecture",
            },
            {
              label: "Interledger Addresses",
              link: "/rfcs/ilp-addresses",
            },
            {
              label: "STREAM Protocol",
              link: "/rfcs/stream-protocol",
            },
            {
              label: "Simple Payment Setup Protocol (SPSP)",
              link: "/rfcs/simple-payment-setup-protocol",
            },
            {
              label: "Peering, Clearing and Settling",
              link: "/rfcs/peering-clearing-settling",
            },
            {
              label: "Settlement Engines",
              link: "/rfcs/settlement-engines",
            },
            {
              label: "ILP Over HTTP",
              link: "/rfcs/ilp-over-http",
            },
            {
              label: "Bilateral Transfer Protocol",
              link: "/rfcs/bilateral-transfer-protocol",
            },
            {
              label: "STREAM Receipts",
              link: "/rfcs/stream-receipts",
            },
            {
              label: "Hashed-Timelock Agreements",
              link: "/rfcs/hashed-timelock-agreements",
            },
            {
              label: "Payment Pointers",
              link: "https://paymentpointers.org",
              attrs: {
                target: "_blank",
                class: "external-link",
                rel: "noopener noreferrer",
              },
            },
          ],
        },
        {
          label: "Tools",
          link: "/tools",
        },
        {
          label: "Community",
          link: "/community",
        },
      ],
    }),
  ],
  server: {
    port: 1103,
  },
});
