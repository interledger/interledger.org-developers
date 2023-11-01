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
              label: "Notes on OER Encoding",
              link: "/rfcs/oer-encoding",
            },
            {
              label: "Dynamic Configuration Protocol (ILDCP)",
              link: "/rfcs/dynamic-configuration-protocol",
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
              label: "SPSP Pull Payments",
              link: "/rfcs/spsp-pull-payments",
            },
            {
              label: "STREAM Receipts",
              link: "/rfcs/stream-receipts",
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
