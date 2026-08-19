---
title: 'Our 2026 Wallet Work Week'
description: 'Interledger Wallet Work Week 2026'
date: 2026-06-02
slug: wallet-work-week
authors:
  - Raul Ranete
  - Vlad Daneliuc
author_urls:
  - https://github.com/RaulBR
  - https://github.com/vladdaneliuc
tags:
  - Work Week
  - Interledger Wallet
---

_A week of collaboration, architecture discussions, payment experiments, and product planning around the future of the Interledger Wallet._

Wallet Work Week brought together engineers, product leads, and operations groups for a few packed days of planning, architecture debates, payment experiments, implementation sessions, and the occasional _“wait… how could this fail in production?”_ moment as we continue preparing for the official launch of the Interledger Wallet.

It wasn’t all architecture diagrams and payment flows though. The week also included a few icebreaker sessions, including a surprisingly competitive “guess the desk” challenge, as well as a “guess it from emojis” game built around Interledger-related words, movies, and random references. We took it a step further with office finger food at the BreakPoint office and shared traditional food at a local restaurant.

Here’s a look at what we worked on throughout the week.

![wallet work week presentations.](/developers/img/blog/2026-06-02/www-presentation-1.webp)

---

## Aligning on Wallet Product Requirements

A large part of the week focused on refining wallet product requirements and aligning on how different parts of the platform should work together.

Alex, Gina, Raul, Timea and Vlad worked through **onboarding flows, payment experiences, operational responsibilities, and release priorities** to make sure the platform evolves in a way that supports both users and ecosystem partners.

A lot of the discussions centered around simplifying the onboarding experience while making sure operational and support requirements are considered early in the process. Having engineering, product, and operations groups in the same room made it much easier to quickly move from ideas to implementation details.

The conversations also helped clarify release priorities and identify areas where flows could be improved before launch.

By the end of the week, the team had a much clearer picture of ownership, timelines, and the overall direction for upcoming wallet features.

---

## Exploring the ZAR - EUR Corridor

Bogdan, Radu, Raul and Sorin spent part of the week exploring the operational and technical requirements for enabling a **South African Rand (ZAR) to Euro (EUR)** payment corridor.

A recurring topic throughout the conversations was how to make cross-border transfers feel less complicated for users while still handling the operational complexity underneath. The discussions covered everything from clearing and settlement flows to FX conversion handling and user experience considerations for cross-border transfers.

The group also explored **architectural improvements** and debated whether Kafka-based approaches could help support future scalability needs.

Improving corridor support remains an important step toward making interoperable global payments more accessible and reliable.

---

## Putting Cross-Border Flows to the Test

Another major focus area was validating cross-border payment flows using the [Bridge API](https://apidocs.bridge.xyz/).

Adi spent time testing **transfers from US-based accounts into Mexico through SPEI — Mexico’s real-time interbank payment network** — using CLABE account identifiers.

The sessions focused on validating end-to-end USD - MXN transfers, payout handling, settlement timing visibility, and operational monitoring. Beyond simply testing payment success cases, the team also looked at areas where transparency and reliability could be improved for international transfers.

The work helped validate interoperability between traditional banking infrastructure and payment systems while giving the team a better understanding of operational edge cases and settlement visibility challenges that only really appear once real payment flows start moving around.

By the end of the sessions, the core transfer flow had been successfully validated end-to-end, giving the group a stronger foundation for future corridor testing and operational improvements.

---

## Improving Fiant Onboarding with Plaid

Fiant onboarding was another important topic throughout the week.

Antoniu worked on advancing the [**Plaid integration for Fiant ACH transfers**](https://plaid.com/), with the goal of creating a safer and more seamless way for users to connect bank accounts and initiate ACH payments.

The work included integrating [Plaid Link flows](https://plaid.com/docs/link/), securely handling sensitive banking information, mapping linked accounts into ACH transfer flows, and improving the experience for users.

This integration lays important groundwork for a smoother onboarding experience across the wallet ecosystem.

---

![wallet work week presentations.](/developers/img/blog/2026-06-02/www-presentation-2.webp)

## GateHub Cards & Compliance Workflows

David and Radu focused on transaction handling and compliance workflows related to GateHub card integrations.

The sessions explored transaction lifecycle visibility, operational monitoring, compliance requirements, and support tooling needed to maintain stable and scalable card transaction flows without turning operations into a guessing game every time something unexpected happens.

As **additional payment methods** become integrated into the platform, maintaining strong operational visibility while keeping the user experience simple remains a key priority.

---

## Untangling the Release Process

As the platform grows, release coordination and operational maturity become increasingly important.

Stephan, Raul, and Gina spent time improving the **release process** to make deployments more predictable and easier to track across teams.

The work included improving deployment consistency, connecting release workflows to Linear, automating release notes, and identifying additional opportunities.

A surprising amount of time went into figuring out how to make releases easier to coordinate across multiple moving parts without losing visibility along the way. The improvements should help reduce deployment risk while making iteration and coordination significantly smoother.

---

## Reducing Friction in Signup & KYC

Iurie focused on reviewing support flows around signup, login, and KYC in order to identify friction points and operational bottlenecks.

Part of the work focused on untangling authentication recovery flows, KYC escalation handling, communication workflows, and **internal tooling improvements** that could help support groups respond more effectively to user issues.

A recurring theme throughout the discussions was finding ways to help users recover accounts or complete onboarding steps without accidentally creating frustrating support loops.

A major goal throughout these discussions was reducing onboarding friction while improving visibility for both users and operational teams.

---

## Designing Request Money & Split Bill Experiences

Arpi, Dragos and Serghei spent part of the week designing and validating Request Money and Split Bill experiences powered by [Open Payments](https://openpayments.dev/).

The discussions explored how collaborative payment experiences could work across wallets and external payment providers while still remaining intuitive for users.

The team explored different **split methods, participant tracking, reminders, payment states, settlement visibility**, and handling situations like failed or duplicate payments. There were also some fun early conversations around **AI-assisted bill splitting experiences** that could help simplify the eternal problem of figuring out who still hasn’t paid for dinner.

A lot of the work focused on understanding the real-world operational and UX considerations required to build reliable and transparent shared payment flows.

---

## Web Monetization Authorization on Mobile

Darian and Vlad focused on how Web Monetization authorization flows could work more smoothly on mobile devices.

As Web Monetization expands beyond desktop environments, enabling secure communication between browser extensions and wallet applications becomes increasingly important.

One of the key conclusions from the sessions was that **browser extensions will likely need to support secure inter-app communication** so authorization context can be safely passed to the wallet application without creating a clunky mobile experience. The wallet app can then complete the [Open Payments](https://openpayments.dev/) grant flow and securely return authorization details back to the extension.

This work helps establish a stronger foundation for mobile Web Monetization experiences moving forward.

---

![wallet work week group photo.](/developers/img/blog/2026-06-02/www-team-photo.webp)

## Looking Ahead

Wallet Work Week created dedicated time for collaboration across product, engineering, operations, compliance, and ecosystem initiatives.

Beyond the technical discussions and implementation planning, the work week helped **strengthen alignment around a shared vision** of interoperable, open, and user-friendly payment experiences powered by Interledger and [Open Payments](https://openpayments.dev/).

A lot of the ideas explored during the week are already making their way into upcoming releases and integrations, with several workflows, prototypes, and architecture discussions moving directly into implementation.

There’s still a lot to build, but the conversations, prototypes, and experiments from the week made one thing clear: the pieces are starting to come together.
