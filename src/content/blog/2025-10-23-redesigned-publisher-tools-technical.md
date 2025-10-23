---
title: "How the Redesigned Publisher Tools Work: A Technical Dive"
description: "A technical exploration of the architecture details behind the redesigned Publisher Tools"
date: 2025-10-23
slug: redesigned-publisher-tools-technical-dive
authors:
  - Darian Avasan
author_urls:
  - https://www.linkedin.com/in/darian-avasan/
tags:
  - Interledger
  - Web Monetization
  - Publisher Tools
  - Technical
  - Architecture
---

If you haven’t heard of Publisher Tools yet, you’re missing out on a simple way to monetize your content! Don’t worry, you can catch up on the details [here](https://webmonetization.org/publishers/). Today, we’ll focus on the redesign.

The Publisher Tools have been completely redesigned with a focus on simplicity, but there’s a lot happening behind that simplicity. Let's find out how things work after the embed script tag gets added to a website.

### From Script Tag to Rendered Component: The Complete Flow

![Configuration flow](/developers/img/blog/2025-10-17/tools-flowpng.png)

**Key flow steps:**

1. Publisher customizes through the interface (the `frontend` module) → Configuration stored as JSON (keyed by wallet address + preset tag e.g., ($ilp.link/your-wallet)", "version1").
2. Visitor loads page with embed script → Script loads from `cdn` module
3. Script fetches configuration → `api` retrieves stored JSON and returns it
4. Script renders the Tool → Instantiates Web Component from `components` with fetched configuration

This system cleanly separates responsibilities: publishers customize through the interface (the `frontend` module), and visitors consume the configuration at WebPage runtime. The `frontend` and visitor-facing flow never interact directly, they're connected only through stored configuration.

### The Publisher Embeds the Script

```html
<script
  id="wmt-widget-init-script"
  type="module"
  data-wallet-address="https://ilp.wallet.money/alice"
  data-tag="version1"
  src="https://cdn.webmonetization.org/widget.js"
></script>
```

**Why we need a `cdn` module**

Publishers embed this script on their sites, so it must load quickly. The `cdn` module bundles the component source code, optimizes it for production, and serves it from Cloudflare's global network.\
The CDN's role is pure delivery: take the source code from `components` module, bundle it and serve it.

### Configuration Fetch from API

The embedded script makes an HTTP request to fetch the interactive tool's configuration:

```typescript
async function fetchConfig<T extends Tool>(
  apiUrl: string,
  tool: T,
  params: ReturnType<typeof getScriptParams>
): Promise<ToolConfig<T>> {
  const url = new URL(`config/${tool}`, apiUrl)
  url.searchParams.set('wa', params.walletAddressId)
  url.searchParams.set('preset', params.presetId)
  await fetch(url)
  ...
}
```

Looking at the URL above, it includes the wallet address and preset tag retrieved as `data-*` attributes via the `dataset` property from the script element, hence the `params`.\
The API looks up the stored configuration and returns it as JSON.

**Why we need an `api` module**

Our tool configuration preferences need to be stored on the server as JSON and served dynamically. This enables publishers to update their widget appearance without touching their website code or doing redeployment.\
The **`api`** provides a service that retrieves configuration and later can handle payment operations too, so it serves two critical purposes:

1. **Configuration delivery:** Fetch stored settings and serve them to embedded widgets
2. **Payment proxy:** Handle the Open Payments protocol flow (quote generation, grant authorization, payment finalization)

### Tool Rendering

All our Interactive Tools are built as custom Web component elements within Shadow DOM to prevent host page CSS from affecting the Tool and vice versa.\
With the configuration fetched, the script creates and renders the web component:

```typescript
fetchConfig(API_URL, "widget", params).then((config) => {
  const element = document.createElement("wm-payment-widget");
  element.config = {
    receiverAddress: walletAddress,
    ...config
  };
  document.body.appendChild(element);
});
```

The `<wm-payment-widget>` element is one of our interactive tools defined in the `components` module. The script creates an instance, passes the configuration as properties, and appends it to the DOM, using Shadow DOM for style encapsulation.

Lastly, also adds a monetization `<link>` tag to the `<head>`, using the wallet address used through the `frontend` interface. That means your site becomes Web Monetized automatically. You are welcome!

```typescript
function appendMonetizationLink(walletAddressUrl: string) {
  const monetizationElement = document.createElement("link");
  monetizationElement.rel = "monetization";
  monetizationElement.href = walletAddressUrl;
  document.head.appendChild(monetizationElement);
}
```

That's it!

That’s all the embedded script does, nothing hidden or extra complexity, but don’t just take my word for it: you can always check the source code yourself. We’re open source, after all!

**Why we need a `components` module**

The UI logic for widgets needs to live somewhere separate from the embed script, hence `components` module contains the actual Web Component implementations: the rendering logic, event handlers, state management, and UI interactions.

By keeping components as standalone source code, they can be consumed in multiple ways:

- Bundled by the `cdn` module for production embed scripts
- Imported by the `frontend` module for live preview during configuration
- 🎉 Potentially published as an npm package for developers who want to bundle them with their own build systems

### Runtime Payment Operations

Beyond the new architecture, the Publisher Tools also handle payments using [Open Payments protocol](https://openpayments.dev/overview/getting-started/). Every step of the payment flow is proxied through our `api` module. For example, when a visitor interacts with the widget wanting to make a one time donation (entering an amount, clicking "Pay"), the component makes API requests:

```typescript
// Generate a quote
await fetch(`${apiUrl}/payment/quote`, {
  method: "POST",
  body: JSON.stringify({
    senderWalletAddress,
    receiverWalletAddress,
    amount
  })
});

// Initialize grant authorization
await fetch(`${apiUrl}/payment/grant`, { method: "POST", body: "..." });

// Finalize payment after authorization
await fetch(`${apiUrl}/payment/finalize`, { method: "POST", body: "..." });
```

The API manages all interactions with Open Payments SDK handling grant authorization, creating outgoing payments, and coordinating with the component to complete the full protocol flow for the payment.

**Key flow steps:**

1. Visitor interacts with widget (from `components`) → Enters wallet address and desired amount
2. Component requests quote → `api` proxies to Open Payments infrastructure to handle the amount
3. Component initializes interactive grant → `api` returns authorization URL
4. Visitor authenticate and authorizes in popup → Wallet provider redirects back with interaction reference
5. Component finalizes payment → `api` creates outgoing payment on Interledger network

## What's Next?

The redesigned Publisher Tools establish a foundation for future enhancements:

**More tools** We plan to add new interactive tools with new ways of visitors to interact and sponsor your website's content through open payments.

**Analytics integration** We want to give publishers insight into how visitors engage with their tools: how often users interact and how revenue breaks down per page.

**Webhook notifications** Give callback webhooks to publisher when payments occur, with the amount and currency received.

## Try It Yourself

The redesigned **Publisher Tools are live** at [webmonetization.org/tools](https://webmonetization.org/tools).\
Check out the open source at [github.com/interledger/publisher-tools](https://github.com/interledger/publisher-tools).

## Resources

**Web Monetization Documentation:** [webmonetization.org/docs](https://webmonetization.org/docs/)

---

_Questions or feedback about the technical implementation? Open an issue or discussion on [GitHub](https://github.com/interledger/web-monetization-tools) or connect with the Interledger developer community._
