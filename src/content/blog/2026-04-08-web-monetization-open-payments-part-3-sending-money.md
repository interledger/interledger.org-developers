---
title: 'How the Web Monetization Extension works - Part 3: Sending money for real'
description: 'The final installment covers the "how" of sending funds: the who, when and how much, handling embedded content, and signaling monetization to the website.'
date: 2026-04-08
slug: web-monetization-open-payments-part-3-sending-money
authors:
  - Sid Vishnoi
author_urls:
  - https://sidvishnoi.com?ref=ilf_engg_blog
tags:
  - Open Payments
  - Web Monetization
---

In [Part 1](https://interledger.org/developers/blog/web-monetization-open-payments-part-1-connecting-wallet/) of the series, we covered how to link your wallet to the extension and secure the access tokens required for future transactions. In [Part 2](https://interledger.org/developers/blog/web-monetization-open-payments-part-2-payment-sessions), we explored the receiving side: identifying a website's receiving wallet addresses via `<link rel="monetization">` and calculating the amounts our wallet can pay into them. Now, we'll combine these elements to actually move money.

Thanks to the Open Payments API, sending the payment is now actually the simplest step. This article focuses more on the extension's internal payment logic and flow. I'll assume you're already familiar with basic browser extension architecture, [Web Monetization](https://webmonetization.org/), and [Open Payments API](https://openpayments.dev/) from the previous articles.

## Payment manager

As we explored in the last article, the extension's background script creates a "payment session" for every `<link rel="monetization">` element found on the website you're visiting. Each session also figures out a `minSendAmount` - the smallest unit your connected-wallet can send to it. Once this value is confirmed, the extension knows a transaction is technically possible.

A "payment manager" acts as the container for these sessions for a given browser tab. It maintains a list of all payment sessions (monetization links) in the exact order they appear on the page. This order is critical because it dictates which wallet address receives priority when the extension decides where to send money. Even if a site only has one wallet address, the payment manager still handles the lifecycle of that single session.

When a website contains `<iframe>` elements, a "frame manager" coordinates those additional sources. We'll dive into the specifics of iframe-based payments later in this article.

To recap, when you (the user) visit a site, the payment manager performs some quick steps for every link element the extension finds on a page:

1. Creates a payment session corresponding to the link element,
2. Sets up an incoming payment for the receiving end, and
3. Computes the `minSendAmount`, as we learnt in Part 2.

Once these sessions are "prepared", the extension triggers a continuous payment loop. This sends small payments sequentially to all the receiving wallet addresses on the website, as long as you remain active on the tab.

## Sending money

### Where to send?

To handle multiple recipients on a single page, the payment manager uses an internal pointer (technically, an infinite iterator). You can think of this as a continuous loop that tracks which wallet address is next in line to be paid. Instead of just picking one wallet and sticking with it, the extension "peeks" at the next address in the list, checks if it is ready to receive funds, and then advances the pointer once the payment is triggered.

The order of these addresses is determined by their appearance in the website's DOM. The iterator ensures that every wallet address on a page - whether it corresponds to the main author or a platform contributor - gets a fair share of the "streaming" payment over time. If the iterator reaches the end of the list, it simply circles back to the first link and continues the process over. If there's only one wallet address, we loop over just that.

This cycling logic also acts as a built-in safeguard. If the iterator encounters a wallet address that is broken or incompatible with your own wallet (e.g., sending from a test wallet to a production one), it doesn't break the entire payment loop. It simply skips that specific entry and moves to the next available link in the cycle, ensuring the payment flow remains uninterrupted for the remaining valid recipients. If there are no suitable wallet addresses, then the entire site is treated as "non-payable".

### How much to send?

Determining exactly how much money to send depends on the receiving wallet. As we covered in the previous article, every receiving wallet address has a `minSendAmount`, which is the smallest unit of currency it is willing to accept in a single transaction. For example, when sending from an MXN wallet to a USD one, we can't send 0.01MXN because the converted amount (0.00056) is too small to be receivable by a USD wallet. The amount, depending on current exchange rates and fees, comes to around 0.18MXN. To ensure every payment is successful, the extension never sends arbitrary fractions; it only sends money in exact multiples of this minimum amount.

### When to send?

Think of the `minSendAmount` as the size of a single shipping container. The extension won't send a half-empty container because the receiving wallet won't process it. Instead, the extension waits until it has _accumulated_ enough value to fill one or more "containers" before initiating the transfer. By sticking to these strict multiples, the extension guarantees that every cent sent is compatible with the receiver's specific currency and scale settings.

### User's rate of pay

The amount sent over time is governed by your chosen "hourly rate." This rate is defined as the total amount you are willing to pay if you stay on a single website for one full hour [^1].

For example, if you set your rate to $1.50 per hour, the extension breaks this down into a per-second value of $0.0004167.\
While the math is correct, the economics isn't quite right. We can't send an amount as small as $0.0004167, as most wallets can only represent amounts up to 2 decimals (i.e., $0.01 is the smallest possible fiat-compatible representation). In Open Payments, it is represented as `assetScale = 2`. So, instead of trying to send $0.0004167 every second, we'll send $0.01 every 24 seconds (as $0.01 every 24s == $0.0004167 every 1s).\
If there's a wallet that supports `assetScale = 3`, we can then send $0.001 as well. For example, at a $1.50 per hour rate, $0.001 roughly can be sent every 2.4 seconds, which feels much more stream-like. The reality is more inclined towards $0.01 every 24 seconds.

Even if you were to set your hourly rate at $3600 per hour, because you're too generous, the extension won't be sending $1.00 every second (or $0.10 every tenth of a second). To protect both the servers from excessive load and yourself from higher data usage, the extension enforces a minimum gap of two seconds between payments, as a practical speed limit. So, even if you choose a very high rate of pay, the website will never receive monetization events faster than this two-second interval.

```ts
const MS_IN_HOUR = 60 * 60 * 1000
const MIN_PAYMENT_WAIT = 2000 // 2 seconds
const hourlyRate = BigInt(userConfig.hourlyRate) // "$1.50" per hour -> 150n

// Every `period` milliseconds, we can send `units` amount
const period = MS_IN_HOUR / Number(hourlyRate)
const units = Math.ceil(MIN_PAYMENT_WAIT / period)
this.interval = {
  units: BigInt(units),
  period: Math.ceil(units * period)
}

// The math above is roughly equivalent to the following, if that helps:
this.interval = { units: 1n, period }
while (interval.period < MIN_PAYMENT_WAIT) {
  this.interval.units += 1n
  this.interval.period += period
}
```

### Payment buckets and the time-loop

While this works across regular payments within the same currency, things become even more interesting when you're sending across different currencies.

Let's say you connected a Mexican peso (MXN) wallet to the extension, and set up a rate of pay corresponding to MXN0.01 per second. The receiving wallet is USD. The math works by comparing your per-second rate against the receiving wallet's `minSendAmount`. The USD wallet cannot receive until we send MXN0.18. So, we have to wait 18 seconds to accumulate enough to meet this threshold.

If your rate is high enough to exceed the minimum every second, the extension combines that value into a larger multiple and sends every two seconds, rather than trying to send smaller amounts more frequently.

The payment manager is driven by a steady internal timer that ticks at a fixed interval - usually every two seconds (see `interval.period` earlier). This timer is the heartbeat of the extension's payment flow for the given tab. Every time it beats, the extension calculates how much value the site has "earned" based on your hourly rate since the last tick and drops that value into your payment bucket.

Importantly, the timer ticking doesn't always trigger a transaction. Instead, each time the heart beats, the extension checks if the accumulated balance in the bucket has finally reached the receiving wallet address's `minSendAmount`. If the bucket is still too low, the value simply sits there, continuing to grow with every subsequent tick of the timer.

This separation between the "timer loop" and the "payment trigger" ensures a smooth, predictable flow. It prevents the extension from spamming the network with tiny, invalid transactions while ensuring that as soon as you have enough saved up, the money is bundled and sent immediately to the current wallet address in the queue, and then moves on to the next wallet address.

We can summarize all we discussed so far, with the help of a little code:

```ts
// Note: this is a simplified version

let pendingAmount = 0n // the payment bucket
setInterval(() => {
  pendingAmount += this.interval.units

  const session = peekNextPaymentSessionInQueue()
  if (pendingAmount >= session.minSendAmount) {
    // How much of pendingAmount can we pay this session?
    // e.g. if pendingAmount = 37n (say, due to user's high rate of pay) & minSendAmount = 17n,
    // we can pay 34n from pendingAmount in single timer loop.
    const amount = getPayableAmount(session.minSendAmount, pendingAmount)

    void session.pay(amount).then((paid) => {
      if (!paid) pendingAmount += amount
    })
    pendingAmount -= amount
    moveCursorToNextPaymentSessionInQueue()
  }
}, this.interval.period)
```

[TODO: show an illustration of how "time loop" works. show bucket filling: example: MXN to USD, MXN, EUR wallets. try to create a live interactive demonstration if enough time. Will explain much better that way.]

#### What if you switched the browser tab?

One of the most common questions we receive is how the extension handles inactive tabs or minimized windows. To ensure you only pay for content you are actually consuming, the timer pauses the moment you switch tabs or move to another application. When you return, the timer resumes from its exact leftover duration rather than resetting. This focus-based logic prevents your budget from draining on background pages and ensures that every cent of your "streaming" payment is tied directly to your active attention [^2].

### Handling `<iframe>`

A web page can choose to share monetization with the content embedded inside it. In practice, this means a website owner adds an `allow="monetization"` attribute to any `<iframe>` they find acceptable to monetize. If that iframe contains its own monetization link, the extension will recognize it and include it in the payment cycle.

To manage this, the payment manager uses a dedicated "frame manager" for every frame on the page - including the main website (the "root" frame) and each eligible iframe. For security and performance reasons, we only monetize the first level of iframes; any further nested iframes are ignored.

#### Sequence of payments with `<iframe>`s involved

When iframes are involved, the extension follows a specific "round-robin" sequence to ensure everyone gets paid fairly:

1. Main website first: The extension starts by paying all monetization links on the main website (the root frame).
2. Iframe rotation: It then moves through each iframe one by one, paying the first link in the first iframe, then the first link in the second iframe, and so on.
3. The next cycle: Once all frames have received a payment, the cycle starts again from the main website. This time, it moves to the second link in each iframe (or repeats the first link if no second one exists).

This loop continues indefinitely as long as the tab remains in view, ensuring that both the primary publisher and the embedded content creators receive a continuous stream of support.

<iframe src="https://sidvishnoi.com/embeds/web-monetization-open-payments-part-3-sending-money/iframes/index.html" style="width: 100%; aspect-ratio: 2.33336; border: none" loading="lazy"></iframe>

### Create outgoing payment

With the recipient identified (who to pay), the timing set (when to pay), and the payment bucket filled (how much to pay), the Open Payments API finally enters the picture to move the money. Up until this point, all the logic has lived locally within the extension; now, we communicate with the outside world to execute the actual transaction.

```js
const outgoingPayment = await openPaymentsClient.outgoingPayment.create(
  {
    accessToken: access_token.value, // found in Part 1 of article series
    url: sender.resourceServer
  },
  {
    incomingPayment: session.incomingPaymentId, // receiver: found in Part 2 of article series
    walletAddress: sender.id, // your wallet
    debitAmount: {
      value: amount.toString(), // $0.15 means "15" when assetScale is 2
      assetCode: sender.assetCode,
      assetScale: sender.assetScale
    }
  }
)

// inform the website about the payment via `monetization` event
session.sendMonetizationEvent(outgoingPayment)
```

## `MonetizationEvent`

Once a payment is successfully processed, the website wants to know about it - whether that's to unlock premium content, hide advertisements, or update a global tip counter in real time. This communication happens via the monetization event.

### The "polyfill" content script

To make this work in browsers, the extension injects a content script. This script runs directly within the context of the web page, allowing the site to access the global `MonetizationEvent` interface. It also modifies `HTMLLinkElement.relList.supports` so developers can programmatically check if the browser supports Web Monetization:

```ts
if (document.createElement('link').relList.supports('monetization')) {
  console.log('Web Monetization is supported!')
}
```

### Informing website of payment

Because this script runs in the website's own environment, we have to be extremely careful. We cannot expose extension internals or sensitive user data, as the website could intercept them, or clever users could create fake monetization events to trick the website. To bridge the gap safely, we use a message-passing system.

When the extension's background script completes a payment, it sends a message to the content script using a randomly generated event name known only to these two components. This prevents the web page from eavesdropping on internal communication. The content script then receives this private message and dispatches a public `MonetizationEvent` on the web page.

Websites can listen for these events globally on the window or on specific link elements, as these events bubble up the DOM tree:

```js
window.addEventListener('monetization', (event) => {
  console.assert(event instanceof MonetizationEvent)

  console.assert(event.target instanceof HTMLLinkElement) // the `<link>` element that got paid

  const { currency, value } = event.amountSent
  console.log(`Received ${currency} ${value}`) // -> Received USD 0.01

  // Unlock premium content/features
  showPremiumContent()
})
```

## Epilogue

I hope this three-part series has given you a clear map of the full Open Payments and Web Monetization flow. My goal was to provide enough technical depth that you feel confident building your own implementations - whether you're working on a [browser extension](https://github.com/interledger/web-monetization-extension), a server-side integration, or an entirely different platform outside the browser.

The native browser implementations currently on the horizon will mostly follow a similar logic, though different teams will undoubtedly experiment with new approaches to find what works best for supporters and publishers. The architecture we've discussed in these articles is a reflection of the lessons we learned while building the extension, and we are always open to suggestions on how to refine it. By understanding these foundations, you're [ready to help](https://github.com/WICG/webmonetization) shape the future of how value moves across the web.

[^1]: It is important to note that your actual spending can fluctuate. Because the extension triggers an initial payment the moment a page loads, visiting many different sites in a short burst might cause you to spend more than your average hourly rate within that specific window. If this activity exhausts your pre-allocated budget, the extension will stop all payments until you either top up your balance or the budget period resets.

[^2]: It is worth noting that "focus" simply means the tab is the one currently in view. As long as the tab is active, the timer keeps running even if you aren't actively scrolling or clicking - after all, you might just be deeply absorbed in a long paragraph. We don't consider a user inactive based on movement yet; if the page is open and visible, the monetization continues.
