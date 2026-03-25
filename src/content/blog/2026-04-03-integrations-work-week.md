---
title: 'Three Days, Five Tracks, One Great Team: Our Latest Work Week Recap'
description: 'Integrations Work Week Recap'
date: 2026-04-03
slug: integrations-work-week
authors:
  - Timea Nagy
author_urls:
  - https://github.com/tymmmy
tags:
  - WorkWeek
  - Integrations
---

Every so often, we take a step back from the day-to-day development and dedicate focused time to push forward some ideas that are always put on the sidelines. This time around, we ran a three-day work week in Cluj-Napoca, labeled as Integrations Work Week, but we made space for the Interledger Wallet team as well, so we decided to structure and accomodate five tracks: **POS App for Android**, **Integrations Initial Guidebook**, **Integrating Rafiki into the New Architecture**, **POC for Peering with the Test Wallet**, and **Log and Error Hunt**. It was three days packed with deep dives, live demos, lively debates, and, as always, good conversations, good food, even better coffee and desserts and a wonderful team dinner. Here's how it all went down.

---

## POS App for Android: Building the Future of Payments

One of the most technically exciting tracks this week was the work on the Point-of-Sale (POS) app. Vlad and Serghei kicked things off by presenting a proof of concept application that reads card data directly using NFC (Near Field Communication). They managed to successfully read public card data, but ran into a wall when it came to encrypted, certified data, which requires a payment processor to handle decryption and bank communication.

The custom NFC approach has some genuinely appealing advantages: full control over the codebase, no transaction fees, and white-label potential. But the road to production is long, EMV certification alone is a notoriously lengthy process, and iOS implementation comes with its own security and compliance complexity.

That's where **Stripe Terminal SDK** comes in as the second implementation option. Stripe takes on the heavy lifting: security, cross-platform support for both Android and iOS, automatic updates, and even simulated testing without real cards. The tradeoff would be, that it offers less UI flexibility, since Stripe controls most of the interface and integrating Stripe on iOS requires a special entitlement from Apple.

With Stripe available in over 40 countries, the geographic reach is strong, nevertheless the team will make sure to research other options as well before making a final decision.

---

## Integrations Initial Guidebook: Making Rafiki Accessible

Not everything in a platform's success is about the technology, documentation matters just as much. The integration team realized that grantees and community members new to the ecosystem find the existing documentation overwhelming, and sometimes they get lost in the details. Enter the **Integrator's Initial Guide**.

Max presented a blog post originally conceived as an "integration guide for dummies", a friendly, approachable resource that explains what Rafiki is, what it _isn't_, and what the integrator is actually responsible for versus what the API/Service Component handles. It covers the basics of Open Payments, the Interledger Protocol, and walks through a simple step-by-step payment scenario. It's the kind of onboarding resource that can make a real difference for someone hitting the ecosystem for the first time.

We highly recommend checking the blog post out, as it is already live, and hopefully already helping out the community.

---

## Integrating Rafiki into the New Architecture: Going Faster

Radu presented findings on how to integrate Rafiki as an external service while increasing transaction speed. The current setup generates _two_ transactions per payment, one for the sender, one for the receiver, which isn't ideal. The new proposal consolidates this into a single payment representing both sides, with all validations (accounts, KYC, limits) done once upfront.

The result? Local transaction time drops from nearly **one second to just 71 milliseconds**. It might not seem like it, but that's a meaningful improvement.

The bigger challenge is handling high volumes. The current durable execution setup via Temporal introduces sequential wait times between activities, around 40 milliseconds each, which compounds quickly at scale. The team needs to explore alternatives like **Kafka**, mapping out multiple options against each other to find what can handle high throughput while still maintaining the reliability needed for financial transactions.

---

## POC for Peering with the Test Wallet: A Live Demo Moment

Bogdan S. delivered one of the week's most exciting presentations: the foundational work for the Interledger App to become a **Rafiki node**. After upgrading to the latest Rafiki version and integrating Rafiki webhooks, the Interledger App successfully peered with the Test Wallet in the development environment, enabling multihop transfers from the Interledger App all the way to the GitHub sandbox through Test Wallet.

Bogdan gave a live demo of a multihop transfer, acting as both sender and receiver, using Open Payments via Interledger Pay. The transaction went through successfully, hitting all the required steps including payment confirmation and security approval.

---

## Log and Error Hunt: Building a Better Support Experience

Antoniu and Iurie rounded out the week's presentations with a proposal for **unified error handling**, a single, standardized error contract that maps domain-specific errors from external clients (like gRPC or Kratos) into consistent, user-facing messages.

The Backend for Frontend (BFF) layer handles the errors through a centralized error handler, giving the team the ability to provide specific feedback, return validation errors for forms, or redirect users as needed. For customer support, this is a game-changer: instead of hunting through inconsistent logs, support staff can quickly trace issues, reduce resolution time, and improve SLA performance.

---

## Mandatory Fun: Unpopular Opinions & Random Photos

No work week is complete without a little "mandatory fun with Timea". Everyone shared an unpopular opinion and a random photo straight from their phone.
The opinions were controversial :). Let's just say the topic of developers using Dark Mode appeared a few times. Whether you're a Dark Mode devotee or a Light Mode loyalist, at least now everyone knows where their colleagues stand. But you know why developers use Dark Mode? Because light attracts bugs...so there's that.
It was a simple activity, but we shared a few laughs, a few raised eyebrows, and a few photos that probably raised more questions than answers.

## Welcoming New Faces

The week closed on a special note. As part of the junior onboarding extra track, new team members shared their impressions from the three days. One described the experience as "really interesting and really fun," expressing excitement about the project and gratitude for how welcoming the team has been, saying they already feel like part of a family.

That sense of belonging is something worth celebrating. Great technology is built by great teams, and moments like these are a reminder of what makes the work meaningful. The best products are built by people who genuinely love what they're building.

---

![Team photo in the garden.](/developers/img/blog/2026-04-03/group-photo.jpg)

Three days, five tracks, and a lot of progress. There's still work to do, as always after a few days of focused work. The work never really stops, and honestly, we wouldn't have it any other way. More work weeks are coming, more updates on the way. To the Web Monetization team, Interledger Wallet team and the Rafiki & Cards team, you're next, and we can't wait to see what you focus on.
