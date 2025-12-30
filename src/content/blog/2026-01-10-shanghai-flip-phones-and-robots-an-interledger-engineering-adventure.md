---
title: 'Shanghai, Flip Phones, and Robots: An Interledger Engineering Adventure'
description: ''
date: 2026-01-03
slug: shanghai-flip-phones-and-robots-an-interledger-enginering-adventure
authors:
  - Timea Nagy
author_urls:
  - https://interledger.org/team/timea-nagy
tags:
  - Interledger Wallet
  - POS
---

December is usually a month for family gatherings, holidays, Christmas, and New Year’s resolutions we’ll forget by February. For part of the Interledger engineering team, however, it also meant boarding a plane to Shanghai to spend a week collaborating with our partners at [KaiOS](https://www.kaiostech.com). Festive sweaters were temporarily replaced with laptops, flip phones, and, unexpectedly, robots.

In early December, members of the **Interledger Wallet team** and the **POS / Cards team** visited the KaiOS offices in Shanghai for several days of technical discussions, planning sessions, and most importantly, getting to know the people we’ll be building with as we head into our next technical chapter together.

![Text reading “Interledger Engineers with KaiOS CEO and CTO at the Shanghai KaiOS office group picture”.](/developers/img/blog/2026-01-03/img3-960px.jpeg)

## A Quick Interledger Demo Lab Flashback

Before we dive back into Shanghai, a short reminder of where all this excitement started. If you need a refresher on what the Interledger Wallet team is all about, we highly recommend [rewatching the team’s presentation](https://youtu.be/SiibfMNcHsg?si=MFZQTqu0Kx1A8W4-&t=4392) from the [Mexico City Summit](https://interledger.org/summit) **Demo Lab**, still a fan favorite.

And while you’re at it, don’t skip the equally impressive [POS team demo](https://youtu.be/SiibfMNcHsg?si=BV93O08T3z3Of-z5&t=5823) from the same summit.

Actually, just rewatch the entire Demo Lab, [day 1](https://www.youtube.com/watch?v=SiibfMNcHsg) and [day 2](https://www.youtube.com/watch?v=vF0C1cwcyBw&t=2s). Totally unbiased opinion, of course, but it *was* the place to be 😎.


## Day One: Suits, Smiles, and Serious Tech Talk

We arrived in Shanghai on day one dressed in our finest business attire (yes, engineers do own suits, or they buy new ones when the chat thread starts discussing "Shanghai trip dress code"), ready to make a good impression. Were we overdressed? Maybe. Did we have fun with it? Yes. The first day focused on meeting the KaiOS team, learning more about their organization, and setting the tone for the days ahead.

The following days were packed with meetings, whiteboard sessions, and deep technical dives. Some key outcomes from the week:

![Text reading “Interledger Engineers in their best suits preparing for KaiOS visit”.](/developers/img/blog/2026-01-03/img2-960px.jpg)

## Kernel Strategy: Less Reinventing, More Building

Before the trip, the team had already identified an opportunity to simplify the original plan. Instead of building a new **C8 kernel** for card communication, we explored using existing kernels and extending them where needed.

Discussions with KaiOS and their payment software provider confirmed this direction. The current plan is to use the **EMV Kernel C-2**, which aligns closely with EMVCo documentation, and build APIs that POS devices can call for onboarding, key issuance, and other required functionality. Less reinvention, more using the things we already have available to us.


## POS Registration & Flip Phone Nostalgia

We collaborated on a new flow for **POS device registration** and how it integrates with KaiOS’s existing systems. We also received several KaiOS devices for testing and development. Some of them were the classic flip phones, and sure enough, they were an instant hit.

Oldies but goldies. Am I right, or am I right? ✨
 
We clarified device capabilities and discussed how best to leverage them for our use cases, proving once again that great things can come in very compact form as well.


## KaiOS + Interledger Wallet = Work in Progress

The Wallet team focused on laying the groundwork for KaiOS support by:

- Setting up a dedicated repository  
- Taking ownership of test devices  
- Configuring development environments
- Aligning on design patterns suited to KaiOS’s platform constraints  
- Establishing ongoing collaboration channels with the KaiOS team  

This foundational work sets us up for smooth development and deeper integration going forward.


## Gratitude, Candy, and Robots 🤖

Beyond the technical wins, the visit gave us invaluable insight into KaiOS as a platform and, more importantly, the people behind it. Their expertise helped us align quickly, unblock decisions, answer all of our questions and validate our technical direction.

A huge thank-you to **Sébastien Codeville**, CEO and Founder, **Qingzhong Guo**, CTO, and the broader KaiOS engineering and office teams who made us feel welcome every step of the way.

We were even sent off with **White Rabbit candy**, a nostalgic symbol of sweetness, prosperity, and a reminder that partnerships are built on people, not just protocols.

And then there were the robots.  
We also had the chance to visit [AgiBot Robotics](https://www.agibot.com/), where we played with many robots, or did they play with us? The jury is still out.

![Text reading “AgiBot robot at the entrance of the AgiBot headquarters”.](/developers/img/blog/2026-01-03/img4-800px.jpeg)

## Team Reflections

So, how was Shanghai from the team’s perspective?

> **“Great to meet the KaiOS team and create a strong connection. They were so welcoming, and experiencing Chinese culture and food was a highlight for me.”**  
> — *Antoniu*

> **“The KaiOS team made sure we always had everything we needed. After some language bumps on day one, we were all speaking the same language: tech.”**  
> — *Cozmin*

> **“The workweek was exciting. We set up environments, explored KaiOS APIs, started experimenting with wallet integrations, and got answers to every question we had. Also: amazing food, god-tier bubble tea, and robots. Kudos KaiOS team!”**  
> — a great summary from *Radu*

> **“This was a key milestone for the Interledger card initiative. We confirmed that EMV Kernel C-2 works seamlessly on MPOC-certified KaiOS POS devices and aligns fully with our custom Interledger card chip design. Confident, standards-aligned, and ready for the next phase.”**  
> — *Tadej* looks back (He is all business here, but he also discovered a deep love for bubble tea. IYKYK.)


## Until Next Time, Shanghai

Between the technical progress, strong partnerships, incredible food, and bubble tea consumption across the board, Shanghai exceeded expectations. It was an outstanding experience—building new business connections, strengthening collaboration, and discovering a new culture along the way.

**Thank you, Shanghai. Thank you, KaiOS.**  
We can’t wait to be back. 🚀

![Text reading “Interledger Engineers at the Shanghai Bund”.](/developers/img/blog/2026-01-03/img1-960px.jpeg)