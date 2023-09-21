import { defineConfig } from "astro/config";
import starlight from "@astrojs/starlight";

import react from "@astrojs/react";
import overrideIntegration from "./src/overrideIntegration.mjs";

// https://astro.build/config
export default defineConfig({
  base: "/developers",
  integrations: [
    overrideIntegration(),
    starlight({
      title: "Interledger Protocol (ILP)",
      customCss: [
        "./node_modules/@interledger/docs-design-system/src/styles/green-theme.css",
        "./node_modules/@interledger/docs-design-system/src/styles/ilf-docs.css",
        "./src/styles/interledger.css",
      ],
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
    react(),
  ],
  redirects: {
    "/rfcs/0027-interledger-protocol-4/": "/rfcs/interledger-protocol",
    "/rfcs/0015-ilp-addresses/": "/rfcs/ilp-addresses/",
    "/rfcs/0029-stream/": "/rfcs/stream-protocol/",
    "/rfcs/0009-simple-payment-setup-protocol/":
      "/rfcs/simple-payment-setup-protocol/",
    "/rfcs/0030-notes-on-oer-encoding/": "/rfcs/oer-encoding/",
    "/rfcs/0031-dynamic-configuration-protocol/":
      "/rfcs/dynamic-configuration-protocol/",
    "/rfcs/0032-peering-clearing-settlement/":
      "/rfcs/peering-clearing-settling/",
    "/rfcs/0038-settlement-engines/": "/rfcs/settlement-engines/",
    "/rfcs/0035-ilp-over-http/": "/rfcs/ilp-over-http/",
    "/rfcs/0036-spsp-pull-payments/": "/rfcs/spsp-pull-payments/",
    "/rfcs/0039-stream-receipts/": "/rfcs/stream-receipts/",
  },
  // Process images with sharp: https://docs.astro.build/en/guides/assets/#using-sharp
  image: {
    service: {
      entrypoint: "astro/assets/services/sharp",
    },
  },
  server: {
    port: 1103,
  },
});
