---
title: "The Redesigned Publisher Tools: Making Web Monetization Easier Than Ever"
description: "A complete redesign of the Publisher Tools brings a cleaner interface, simpler setup, and powerful customization - see what's new with the Widget tool"
date: 2025-10-17
slug: redesigned-publisher-tools-widget
authors:
  - Darian Avasan
author_urls:
  - https://www.linkedin.com/in/darian-avasan/
tags:
  - Interledger
  - Web Monetization
  - Publisher Tools
  - Widget
---

We've completely redesigned the Publisher Tools from the ground up!\
The new interface is cleaner, the setup process is simpler, and customization is more powerful than ever.
In this post, we'll walk through what's new in the redesign and the **Widget** tool and show you how easy it is to start accepting payments on your website.

## A New Organization: Setup Tools vs Interaction Tools

As part of the redesign, we've reorganized how Publisher Tools are structured. The tools are now divided into two clear categories based on what they help you accomplish to give you everything in one place.

**Setup tools** help you get Web Monetization running on your website. These are foundational tools that generate the code you need to enable Web Monetization or manage revenue sharing. The Link tag generator creates the monetization tag for your pages, while the Probabilistic revenue share tool lets you split payments across multiple wallets.

**Interaction tools** are the embeddable components that visitors see and interact with. These tools are lightweight scripts that you embed on your pages, and they're fully customizable to match your site's design.

This separation makes it easier to understand what each tool does and when to use it. Setup tools lay the foundation, and interaction tools engage your audience.

## What's New with the Redesign?

If you used the original Publisher Tools, you'll immediately notice the improvements. And if you're new here, you'll appreciate how straightforward everything is now.

### A Two-Step Setup That Makes Sense

Gone are the days of confusing configuration screens. Every tool now follows the same simple pattern:

**Step 1: Connect Your Wallet** (required)
Before you can customize anything, we need to verify that you own the wallet address. This security step ensures that only you can set up payment tools for your wallet. You'll enter your wallet address, and we'll ask you to confirm ownership - just once.

**Step 2: Build Your Tool**
Now comes the fun part! Customize how your tool looks and what it says. Change colors, fonts, text, and positioning to match your website's style. Don't like the defaults? No problem - you have full control.

Once you're happy with your design, you get a simple script tag to copy into your website. That's it!

### Multiple Versions of Each Tool

Here's something powerful: **you can save up to three different versions of each tool**.

Why does this matter? Maybe you have a light theme and a dark theme on your website. Or maybe you run multiple websites that need different styles. Perhaps different sections of your site need different messaging. Instead of creating separate configurations or compromising on one design, you can save up tp three versions. Each version gets its own unique name (we call it a "profile"), and you choose which one to use when you embed the script on your page.

All three point to the same wallet address, but look completely different!

### Separate Content and Appearance

Customization is now split into two tabs. The Content tab controls what your tool says: the title and the message that explains why visitors should support you. The Appearance tab controls how your tool looks: colors for background, text, and buttons, font choices and sizes, border styles, and position on the page. This separation makes it much easier to find what you want to change.

### See Changes Instantly

Every change you make appears immediately in the live preview panel. Pick a color, see it. Change the text, see it. Adjust the font size, see it. What you see is exactly what your visitors will see.

## How to Set Up the Widget on Your Website

Let's walk through the entire process, from start to finish.

### Step 1: Connect Your Wallet

Go to webmonetization.org/tools and click on Widget. Enter your wallet address in the input field and click the Connect button. You will be redirected to your wallet provider to confirm ownership once you decide to save one of the profiles. Once confirmed, you're taken back to the builder interface. This security step happens once per session and ensures that only you can create or edit configurations for your wallet address.

### Step 2: Customize Your Widget

Now you're in the builder. You'll see your widget preview on the right side, and two customization tabs on the left.
Make it match your website by choosing your colors for the widget container background, the text, and the main action button. As you make changes, watch the preview update in real-time!

### Step 3: Save Your Configuration

When you're happy with how it looks, you have two options:

**"Save edits only"** - Saves your changes but doesn't show you the script. Use this while you're still tweaking things.

**"Save and generate script"** - Saves your changes AND gives you the script tag to embed on your website. Use this when you're ready to go live or update your site.

### Step 4: Embed on Your Website

After clicking "Save and generate script," you'll get a script tag that looks like this:

```html
<script
  id="wmt-widget-init-script"
  type="module"
  src="tools-cdn.webmonetization.workers.dev/widget.js"
  data-wallet-address="your-wallet-address"
  data-tag="version3"
></script>
```

Copy this script and paste it into your website's HTML - usually right before the closing `</body>` tag. That's all you need to do!

The script is tiny and loads fast. It automatically adds your configured widget to every page where the script is present.

### Using Multiple Versions

Remember those three versions we mentioned? Here's how they work. When you save a configuration, you can give it a name (a "tag"). Let's say you create a configuration tagged "light" for your light theme pages, another tagged "dark" for your dark theme pages, and a third tagged "blog" for your blog section. Then on different pages, you use different script tags./
Each page gets the right style automatically. All payments still go to your same wallet address.

## What Makes the Widget Payment Special?

The Widget isn't just a payment button - it's a complete payment experience that happens right on your page, without redirecting visitors away.

### From Your Visitor's Perspective

**They see a small icon** in the corner of your page - either your custom icon or our animated Web Monetization logo. It's unobtrusive but noticeable.

**They click it** and a panel slides open with your custom title and message explaining why you need support.

**They enter their wallet address** - this is the wallet they'll pay from. The widget validates it instantly to make sure it's real and active.

**They choose an amount** - they can enter any amount they choose.

**They see the exact costs** - as soon as they enter or select an amount, the widget calculates a real-time quote. It shows "You send: $5.00" and "They will receive: $4.85" (accounting for any currency conversion). No surprises.

**They can add a note** - if they want, visitors can add a short message with their payment. It's optional but adds a personal touch.

**They confirm** - clicking "Confirm Payment" opens a new browser window with their wallet provider, where they authorize the payment securely.

**They see the result** - once authorized, the authorization window closes automatically, and the widget shows the payment status: processing, then success! The payment is complete, and you've received the funds.

**All of this happens without leaving your page.** No full-page redirects, no losing their place in your content, no interruption to their experience.

## How the Widget Gets Delivered to Your Page

You might be wondering: how does a simple script tag create such a rich payment experience? Here's the magic:

### The Script Does the Heavy Lifting

When you paste that script tag into your HTML, here's what happens. The script loads - it's small (just a few kilobytes), so it loads instantly. It calls home to request the configuration for your wallet address and tag. We send back your settings - all your customization including colors, text, fonts, position, everything gets sent to the browser. The widget appears on the page using your exact configuration.

This approach has huge benefits.

**You can update anytime** - Change your widget's colors or text in the admin panel, and every page with that script immediately shows the new version. No need to update your website's code.

**One script, many looks** - Use different tags on different pages, and the same tiny script delivers completely different styles.

**Fast loading** - The widget component itself is optimized and cached globally on a CDN (Content Delivery Network), so visitors anywhere in the world get fast load times.

**Always up-to-date** - When we improve the widget (better animations, bug fixes, new features), your embedded widgets get those improvements automatically. No action needed from you.

### Where Your Settings Live

Your configuration is stored securely on our servers, linked to your wallet address. When you save a configuration, it's stored in a fast, globally-distributed database. It's retrieved in milliseconds when someone visits your page. Only you can edit it (thanks to wallet ownership verification), and we never store sensitive payment information. Think of it like a content management system, but for publisher tools. You manage the content and appearance through our admin interface, and we handle delivery to all your pages.

### How Payments Actually Work

The payment process uses the **Open Payments** standard - an open protocol that lets different wallets talk to each other securely. Here's what makes it special:

**Direct wallet-to-wallet** - Money goes directly from your visitor's wallet to your wallet. We don't hold funds or act as a middleman.

**Real authorization** - When visitors confirm a payment, they're redirected to their own wallet provider (like opening their banking app) to explicitly authorize it. This is secure and puts them in control.

**Currency conversion** - If your visitor has a wallet in one currency and you have a wallet in another, the protocol handles conversion automatically.

**Instant settlement** - Once authorized, payments settle in seconds through the Interledger network.

**No personal data** - We don't collect visitor information. The protocol is designed for privacy.

### What About Security?

Security is built into every layer. Wallet ownership verification ensures only you can configure tools for your wallet. Grant-based authorization means every payment requires explicit visitor approval. We don't keep sensitive payment data. Open Payments is a public standard, reviewed by security experts worldwide. You don't need to worry about PCI compliance, storing credit cards, or payment fraud. The architecture is fundamentally different from traditional payment systems.

## Beyond the Widget: The Full Publisher Tools Suite

The Widget is just one of several tools available to help you monetize your content:

### Banner Tool

These include the Banner that appears at the top or bottom of your page, encouraging visitors to enable Web Monetization in their browser by installing the extension. Once they enable it, the banner disappears.\
Here's a bonus: when you embed the Banner on your page, the script automatically adds the necessary monetization link tag to your HTML. You don't need to manually add any tags to your web page.

### More Tools Coming Soon

We're actively developing additional tools. The Button will be an inline payment button you can place anywhere in your content. Exclusive Content will be a simple paywall system to gate premium content. All tools follow the same intuitive setup process and share the same design system. Once you learn how to use one tool, you know how to use them all.

## What's Next?

This redesign is a major step forward, but we're not stopping here. Based on feedback from creators like you, we're working on better customization with more fonts, more positioning options, and custom colors for more elements. Analytics are coming so you can see how many visitors use your widgets, how much you're earning, and which pages perform best. More integrations are in development to make it easy to add publisher tools to popular platforms like WordPress.

We're building this for you, so your feedback matters. Try the redesigned tools, tell us what works, what doesn't, and what you wish existed.

## Try It Yourself

Ready to add a payment widget to your site? Get a Web Monetization wallet if you don't have one yet by visiting webmonetization.org. Go to the Publisher Tools at webmonetization.org/tools.\
Follow the setup steps to customize it to match your site. Copy the script and paste it into your HTML. That's it. You'll be accepting payments in minutes, not hours or days.

## Resources

**GitHub:** [interledger/publisher-tools](https://github.com/interledger/publisher-tools)

**Publisher Tools:** [webmonetization.org/tools](https://webmonetization.org/tools/)

**Open Payments Specification:** [openpayments.dev](https://openpayments.dev/)

**Web Monetization:** [webmonetization.org](https://webmonetization.org/)

**Interledger Foundation:** [interledger.org](https://interledger.org/)

---

_Have questions or feedback about the redesigned Publisher Tools? Join the conversation on [GitHub Discussions](https://github.com/interledger/publisher-tools/discussions) or reach out to the Interledger community._
