---
title: 'How Web Monetization uses Open Payments - Part 1: Connecting Wallet'
description: 'Understanding how the browser extension uses Open Payments to securely connect your wallet for Web Monetization'
date: 2025-12-03
slug: web-monetization-open-payments-part-1-connecting-wallet
lang: en
authors:
  - Sid Vishnoi
author_urls:
  - https://sidvishnoi.com?ref=ilf_engg_blog
tags:
  - Open Payments
  - Web Monetization
---

Welcome to the first of a three-part series on how Open Payments powers Web Monetization. We’ll also explore the mechanics of the Web Monetization browser extension, which serves as a temporary agent until web browsers natively support this technology.

I assume a conceptual understanding of the underlying technologies — the [Web Monetization](https://webmonetization.org) standard and the supporting [Open Payments API](https://openpayments.dev) — since I'll be speaking about the relationship between the two throughout the series.

This article focuses on the initial extension and wallet setup. I treat you, the reader, as the paying party here — supporting the content you love.

The next two articles will then shift to explain the actual money-sending mechanics and related topics. They will be from the perspective of the Web Monetization Agent (the browser extension for the time being), as it automatically handles the payment processes on your behalf.

## Parts of the Extension

A browser extension consists of several key components. The pop-up is the user interface that appears when users click the extension icon in the browser's toolbar. The pop-up is typically the main interface that users interact with. In the Web Monetization extension, you will first use this pop-up to enter your wallet address and set a budget as part of the wallet connection process - i.e. when the extension gets permissions to make payments on your behalf via your wallet provider. Later, you can check a website's monetization status and send one-time payments through the same pop-up.

The background script (also known as the background service worker) functions as a secure backend server within your browser. It coordinates activities and securely stores sensitive data, such as payment information, away from the web pages. This is where the Open Payments parts of the extension belong.

Content scripts are injected directly into a website's page, enabling the extension to read or modify the content of that page. We will focus on them in the upcoming articles.

## Using the Open Payments Node.js SDK in the browser

The standard Open Payments Node.js SDK, as the name suggests, is designed specifically for a Node.js environment. Getting it to work within a browser extension requires addressing a couple of key differences.

The first hurdle is that the SDK relies on cryptography modules specific to Node.js. To make it functional in the browser environment, we must polyfill these dependencies. The `crypto-browserify` npm package works well for this use.

Our [esbuild](https://esbuild.github.io/) build process simplifies this polyfilling: a [plugin](https://github.com/interledger/web-monetization-extension/blob/49f525f9ff3a82c935ad5dfb5320c4e9be7491e5/esbuild/plugins.ts#L32-L44) automatically resolves all imports of the Node.js crypto module to a browser-compatible implementation:

```js
const esbuildNodeCryptoPlugin = {
  name: 'crypto-for-extension',
  setup(build) {
    build.onResolve({ filter: /^crypto$/ }, () => ({
      path: require.resolve('crypto-browserify')
    }))
  }
}
```

The Open Payments API requires each request to be [signed](https://openpayments.dev/identity/http-signatures/) using Ed25519 cryptographic curves. Unfortunately, web browsers don't adequately support this algorithm for signing operations. The SDK conveniently provides an `authenticatedRequestInterceptor` hook, which we'll use to insert signature headers using a different, browser-compatible implementation.

```ts
const client = await createAuthenticatedClient({
  // ... regular options for creating authenticated client
  async authenticatedRequestInterceptor(request) {
    const headers = await createHeaders({ request, privateKey, keyId })

    if (request.body) {
      request.headers.set('Content-Type', headers['Content-Type'])
      request.headers.set('Content-Digest', headers['Content-Digest'])
    }
    request.headers.set('Signature', headers['Signature'])
    request.headers.set('Signature-Input', headers['Signature-Input'])

    return request
  }
})
```

For a complete understanding of these nuances and all the necessary configurations, you can explore them directly in the [extension source code](https://github.com/interledger/web-monetization-extension/blob/49f525f9ff3a82c935ad5dfb5320c4e9be7491e5/src/background/services/openPayments.ts#L164-L219).

It is important to note that the need for these technical workarounds is temporary. Active [efforts are underway](https://github.com/interledger/open-payments-node/issues/4) to adapt the existing Node.js SDK to work seamlessly across different JavaScript environments. This adaptation will focus on reducing the need for extensive polyfills and custom hooks, allowing for a lighter and easier implementation of Open Payments, not just for the browser extension, but also in modern runtimes like Cloudflare Workers (without needing the `nodejs_compat` flag).

## Connecting Wallet

Connecting your wallet involves establishing a secure link for future transactions through an interactive "create `outgoing-payment`" grant. This process requests your explicit "interactive" authorization for the extension to manage payments on your behalf. Once you grant this approval, the extension receives and stores the necessary grant tokens. These tokens serve as essential credentials, allowing the extension to execute payments through your wallet in the future.

Let’s go through each of these steps:

### Fetch Wallet Information

The first step is to retrieve your wallet's essential details based on the wallet address entered in the wallet connection form in the extension's pop-up. The wallet address server provides us with a response that defines two critical endpoints: the authorization server (where to ask for payment authorization) and the resource server (where to send payment requests). It also includes details about your wallet, such as its currency (e.g., USD, EUR) and its asset scale for precise calculations.

### Budget and Pay Rate

To control spending, you can set a budget in your wallet's currency. This budget represents the maximum amount the extension is allowed to spend on your behalf.

The extension assists you by fetching [default budget recommendations from our data store](https://github.com/interledger/web-monetization-budget-suggestions) for that currency. If no specific recommendation is available, it converts a generic $5 USD equivalent to serve as a sensible default.

Additionally, the system provides a default rate of pay fetched from our data store, which limits how quickly funds can be spent. You can later adjust this rate as you see it fit.

### Automatic Key Addition

Each instance of the browser extension must operate as a separate Open Payments client. We cannot use a single, publicly shared key pair because any sophisticated malicious user could inspect the browser's local data and compromise it. Therefore, we must generate a unique, cryptographically secure key pair for every installation of the extension. The private key, which is fundamental for signing requests, is securely held in the extension’s isolated storage. Users must upload the corresponding public key to their wallet provider.

Manually adding this unique key to your wallet would be a cumbersome, technical hurdle for most users. To solve this, the extension automates the key upload process. Using the power of browser extensions, it first opens your wallet's website, based on the URL derived from your wallet address. The extension [injects a content script](https://github.com/interledger/web-monetization-extension/tree/449aa9e7c15b1e91ebd1e3663f68cb5cd5565a6d/src/content/keyAutoAdd) to your wallet website, which then automatically simulates the actions you would take, such as automatically clicking the necessary buttons to add the new client key, while communicating status updates back to the extension. For improved performance and reliability, we can often bypass the slow step of clicking buttons entirely by reverse-engineering the API requests those clicks would have triggered and calling them directly. This automation is optional — if you do not feel comfortable with it, you can always manually add the generated public key to your wallet instead. Until there's an [official way to add the key to the wallets](https://github.com/interledger/web-monetization-extension/issues/1190), we aim to support this automation for most of the common wallets.

### Create Outgoing Payment Grant

Next, we need to create the `outgoing-payment` grant itself. This grant authorizes the extension to make numerous future micro-payments on your behalf without requiring you to approve each one individually.

This grant has an upper _limit_ on the total amount the extension can debit from your account, which we refer to as the budget. It is crucial to understand that no money is debited from your wallet at this stage; the grant is merely a permission to spend _up to_ the specified budget amount.

If your account runs out of funds, payments will fail. However, the extension will seamlessly resume spending from the same budget once you add additional funds.

You can choose to set your budget for automatic monthly renewal. When you enable this option during wallet connection, the extension creates a recurring grant by adding an interval parameter to the grant request. This grant will automatically reset your spending limit each month, allowing you to spend up to your chosen amount without requiring a new approval each time your previous funds are utilized. Remember, the monthly limit is just an upper boundary; any remaining budget at the end of the cycle will stay in your wallet.

If you choose to opt out of this monthly renewal option, the grant will eventually run out of funds, and you will need to manually approve a new grant to continue sending payments.

The grant request effectively includes following parameters:

```ts
declare const BUDGET = 7.5 // $7.5 when using USD
declare const RECURRING = true

const walletAddress = await fetchJSON(YOUR_WALLET_ADDRESS)

// Convert a human-friendly amount to format Open Payments expects
// $7.5 budget at asset scale 2 means value: "750"
const amount = BUDGET * Math.pow(10, walletAddress.assetScale)
// ISO8601 repeating interval, when RECURRING is true
const interval = `R/${new Date().toISOString()}/P1M`

// partial grant request
const outgoingPaymentAccess = {
  type: 'outgoing-payment',
  actions: ['create', 'read'],
  identifier: walletAddress.id,
  limits: {
    debitAmount: {
      value: amount.toFixed(),
      assetScale: walletAddress.assetScale,
      assetCode: walletAddress.assetCode
    },
    interval: interval
  }
}
```

### Wait for Grant Approval

Once the extension creates the outgoing payment grant, you get redirected to your wallet provider's grant consent page. The extension now must patiently wait for your decision.

In the grant request, we provide an interaction finish URL (`interact.finish.uri`). Once you approve or decline the grant, your wallet provider redirects your browser to this specified page. Crucially, the extension's background script is constantly monitoring for a tab to land on this exact URL. This detection immediately triggers the extension to issue the final grant-continuation request and obtain the access tokens for all your future micro-payments.

```ts
const pendingGrant = await client.grant.request(
  { url: walletAddress.authServer },
  {
    access_token: { access: [outgoingPaymentAccess] },
    interact: {
      // the wallet provider will return a URL where user can approve grant
      start: ['redirect'],
      // once the user approves/declines, the wallet provider redirects to REDIRECT_URL, which the extension monitors.
      finish: { method: 'redirect', uri: REDIRECT_URL }
    }
  }
)
```

As modern browser security policies prohibit external sites (like your wallet provider) from redirecting directly back into the extension's internal pages, the URL must be for an external `https://` page (the extension uses `https://webmonetization.org/welcome`). Upon arrival, this page also displays a clear success or failure message regarding your wallet connection.

This unique ability to wait for the redirect is highly efficient. By instantly detecting the confirmation, the extension avoids repeatedly polling the grant status every few seconds.

### Storing Grant Tokens

Once the grant continuation request is successful, we store the final access tokens in the extension's local storage. Crucially, websites or other extensions cannot access this data.

The access tokens are stored unencrypted, which aligns with our current threat model. If an attacker gains physical access to your computer, they may be able to retrieve these tokens; however, this level of system breach presents a higher security risk that falls outside the extension's scope of defense (read about [physically local attacks](https://chromium.googlesource.com/chromium/src/+/refs/heads/main/docs/security/faq.md#Why-arent-physically_local-attacks-in-Chromes-threat-model)).

While we could encrypt the stored tokens, this would require forcing you to enter a password to unlock the extension each time. We are actively watching the development of new, more secure storage options, such as the [proposed `browser.secureStorage` API](https://github.com/w3c/webextensions/issues/154).

If you believe your tokens are compromised, you can revoke the extension's grant directly from your wallet. This instantly invalidates the tokens, preventing any further unauthorized payments. You can then reconnect your wallet with the extension to obtain a fresh, secure set of tokens.

## Next up: Sending money

Have your wallet connected and access tokens handy? The [next article](https://interledger.org/developers/blog/web-monetization-open-payments-part-2-payment-sessions) will focus on the payment session setup, followed by a detailed look at the core function: precisely how, when, and where the extension triggers the payments through your wallet.
