---
title: 'How Web Monetization uses Open Payments - Part 2: Payment Sessions'
description: 'Explore next steps for sending money: how the extension finds receiving wallet addresses and sets up the necessary payment sessions.'
date: 2025-12-10
slug: web-monetization-open-payments-part-2-payment-sessions
lang: en
authors:
  - Sid Vishnoi
author_urls:
  - https://sidvishnoi.com?ref=ilf_engg_blog
tags:
  - Open Payments
  - Web Monetization
---

In the previous article, we discussed how the [Web Monetization extension connects to your wallet](https://interledger.org/developers/blog/web-monetization-open-payments-part-1-connecting-wallet/) using the Open Payments API. This article will explore the next steps for sending money: discovering the receiving wallet addresses on websites and setting up the necessary payment sessions. Like the previous article, we'll assume a conceptual understanding of [Web Monetization](https://webmonetization.org/) and [Open Payments API](https://openpayments.dev/).

## Finding receiving wallet addresses

As part of the Web Monetization API, websites declare the wallet address where they'd like to receive the money by using the HTML `<link>` tag:

```html
<link rel="monetization" href="https://example-wallet.com/my-wallet" />
```

Websites can add multiple link elements to a page to specify multiple wallet addresses - the extension will send payments to each of them sequentially, while respecting user's choice of payment rate. If user's wallet cannot send payments to a wallet address, the extension will skip that address and move on to the next one.

The extension's background script and pop-up cannot access this HTML from a webpage directly due to browser security restrictions. This is where the content scripts come into play. The [extension injects a content script](https://github.com/interledger/web-monetization-extension/tree/09078c695e42532035e9dd800a95d1fe28ca4c8c/src/content) into each webpage, allowing it to read and modify the page's content.

The content script is the primary interface between the extension and the web page content. It operates directly within the context of web pages, including content inside iframes. In the context of the Web Monetization extension, its primary responsibility is the discovery, validation, and lifecycle management of every potential monetization link element on the site (precisely, within a `Document`).

Once the page loads, the injected content script immediately begins actively monitoring the DOM for all monetization link elements (`<link rel="monetization">` tags).

```js
function getLinkElements() {
  return document.querySelector('link[rel="monetization"]')
}
```

When a new link element is discovered, the content script's first critical action is to assign the element a unique ID. This ID creates a map between the live DOM element and its representation in the background script.

The script proceeds by validating the link element, ensuring its `href` attribute contains a valid wallet address URL. If the address successfully loads with a valid wallet address response, a `load` event is immediately fired on the element, signaling to the web page that the link element is viable for upcoming payments. Conversely, any invalid or malformed address triggers an `error` event, excluding the element from the monetization pool.

The script uses the `MutationObserver` API to maintain a persistent, real-time awareness of the state of all the link elements in a document. For instance, if a developer adds the `disabled` attribute to a monetized link element, the content script instantly signals the background to pause payments for that element. Similarly, when a monetized link element gets removed from the DOM, the content script signals the background script to terminate the associated monetization stream.

```ts
function documentMutationCallback() {
  const linkElements = getLinkElements()
  const addedLinkElements = diff(linkElements, existingLinkElements)
  const removedLinkElements = diff(existingLinkElements, linkElements)

  addedLinkElements.forEach((elem) => {
    const id = assignId(elem)
    const walletAddressInfo = await validateAndFetch(elem.href)
    dispatch('setup_monetization', { walletAddressInfo, id })
  })

  removedLinkElements.forEach((elem) => {
    const id = getAssignedId(elem)
    dispatch('stop_monetization', { id })
  })
}
```

All of these state changes — discovery, modification, and removal — are communicated by passing messages to the background script. This ensures the background script, which manages the actual payment logic, is always perfectly synchronized with the live state of the web page. This synchronization ultimately feeds the pop-up to display accurate, real-time monetization status to the user.

## Payment session

A payment session in the extension's background script acts as the operational counterpart for a monetization link element. It uses the unique ID from the content script to maintain a link between the element in the DOM and its background representation. When a new payment session is initiated, it must undergo a series of checks.

First, it verifies whether the user's connected wallet address is authorized to send payments to the specified wallet address. The extension sends a “[create quote](https://openpayments.dev/apis/resource-server/operations/create-quote/)” request to the receiver’s resource server endpoint. If this request results in an "invalid receiver" error, it means the two wallets are not "peered" or connected. This may occur due to legal or technical reasons. For example, a wallet on the test namespace (e.g., [Interledger Test Wallet](https://wallet.interledger-test.dev/)) using _fake money_ cannot send a payment involving real money to a production wallet (e.g. [Interledger Wallet](https://interledger.app/) or [GateHub](https://gatehub.net/)). Consequently, we mark this payment session as "invalid", and no payments can proceed during the browsing session for this wallet address.

The payment session object also has some helper methods to manage the payments effectively: it includes a method to send a specified amount of money, a method for dispatching `MonetizationEvent` to corresponding link elements (next article), and helpers to check if a wallet address is disabled, paused or payable, ensuring the recipient's status is constantly confirmed to prevent failed payments or unnecessary transactions.

It also needs to find a minimum sendable amount, which I’ll explain next.

## Find minimum sendable amount

Before sending money, we need to determine the amount for a specific wallet address.

For simplicity, we will only use an asset scale of 2 for this discussion. Think of it as a currency divided into hundredths, like dollars (100 cents) or rupees (100 paise). This means the smallest transferable unit is 0.01.

If both the sending and receiving wallets use the same currency, and there are no fees, we could easily send a micropayment of 1 unit. For instance, with USD, this typically represents $0.01.

When transferring funds across currencies (e.g., from a USD wallet to an MXN wallet), the recipient amount can fluctuate. For example, sending US$0.01 could result in the MXN wallet receiving approximately MX$0.18 (based on the current exchange rate). If a transaction fee is applied, the net amount received could be reduced, perhaps to MX$0.15.

But what if we were sending from an MXN wallet to a USD wallet? Can we send MX$0.01 to a USD wallet? If so, how much will the USD wallet receive - ignoring any transaction fees? Ideally, it would be US$0.00054, but an asset scale of 2 implies the minimum receivable amount is constrained to US$0.01. To ensure supporters send only what receivers can actually receive, we must determine an appropriate amount to send.

When using Open Payments, attempting to [create a payment quote](https://openpayments.dev/apis/resource-server/operations/create-quote/) of MX$0.01 to a USD wallet will result in a "non-positive receive amount" error. This is because MX$0.01 translates to a USD amount of US$0.00 - not a positive amount (any value greater than zero is considered positive here).

In the newer implementations, the Open Payments API will provide us with the minimum sendable amount along with the aforementioned error.
However, for wallets that do not use the latest implementation, we need to employ a workaround to determine that amount. It's time for some math and algorithm work!

### Manually finding minimum sendable amount

We use a probing method to find the minimum sendable amount. For example, if we try to create a quote for sending MX$0.01, we receive a "non-positive receive amount" error. We note this error and then attempt with MX$0.02, which also fails. To be clear, with these quote requests, we're not sending money - we're only probing to find an amount that can be safely sent (and received) taking currency exchange rates and any fee into account.

We can continue testing amounts from MX$0.01 up to MX$0.18, which would require 18 separate quote requests to find the right amount. To optimize this process, we can change the increment to an exponential scale by testing MX$0.02, MX$0.04, MX$0.08, MX$0.16, and so on. This leads to far fewer requests - especially with greater currency exchange rates (e.g., 1 USD ~ 88 INR - imagine how many requests it can take without the exponential approach).

Now, we can't send MX$0.16 either, but MX$0.32 is sendable. But it’s not the minimum sendable amount. Why does that matter? MX$0.32 is equal to US$0.017. The wallet can only receive US$0.010, so where does the remaining US$0.007 go? That’s up to the wallet's implementation. They could round up the amount to US$0.02, losing US$0.003 each transaction, or give the receiver US$0.01, keeping a profit of US$0.007 each time. They could also find a balance to maintain liquidity for currency conversion differences.

The sender is sending MX$0.32, expecting the receiver to receive the same amount. However, this is not the case. Micropayments, without some form of consolidation at a higher asset scale (such as US$0.000001), will always lead to this issue.

In the extension, we chose fairness by sending only amounts that can be properly converted for the recipient. We need to determine the minimum amount that can be sent. How do we do that?

We observed that MX$0.16 was not sendable, while MX$0.32 was sendable. Therefore, the minimum sendable amount lies somewhere in between. This is a textbook use-case of the binary search algorithm!
The midpoint between the two amounts is MX$0.24, which is sendable, but it is still above the minimum sendable amount. When we find the midpoint of MX$0.16 and MX$0.24, we get MX$0.20, which is also not the minimum sendable. After some back and forth, we determine that MX$0.17 isn’t sendable, but MX$0.18 is, concluding that MX$0.18 must be the minimum sendable amount.

It may seem the extension inadvertently increased the amount that will be paid. However, your rate of pay remains the same. The larger single payment simply implies a longer delay before the next payment is sent, as we will explore in the next article.

Each test to determine whether an amount is sendable or not costs us one create quote request, which can add up significantly and delay the time it takes to send money to the recipient. To optimize this process, we can utilize currency exchange rates. Instead of starting our tests from MX$0.01, MX$0.02, MX$0.04, and so on up to MX$0.32, we can begin at MX$0.18. This way, we’ve trimmed our search space by a considerable margin. We still need to confirm whether the amount is sendable, as there may be associated fees, and to verify if it is indeed the minimum sendable amount. However, we have minimized the number of unnecessary requests.

As I mentioned earlier, newer implementations of the Open Payments API provide us with a minimum sendable amount directly, and we won’t need this probing in the clients in future.

I hope this clarifies the importance of the minimum sendable amount. Give yourself a pat on the back for navigating the complexities of cross-currency micro-payments!

## Create incoming payment

Before creating the outgoing payment with our previously acquired tokens, the Open Payments API requires us to set up a receiving channel.

The process begins by creating an incoming payment grant on the receiver's wallet. This grant is non-interactive, meaning the user does not need to manually authorize each incoming payment, which would be very cumbersome. Once we obtain the grant, we can proceed with creating the actual incoming payment.

The incoming payment serves as a dedicated "bucket" into which we can stream micro-payments throughout the entire browsing session. Instead of specifying a set amount to receive, we provide an expiration time, after which we will need to create a new bucket. When the incoming payment expires, the receiving wallet can start settling the amount in the background.

## Sending money

This article is already long enough, so let's dive into the fun part — actually executing a payment — in the next article!
