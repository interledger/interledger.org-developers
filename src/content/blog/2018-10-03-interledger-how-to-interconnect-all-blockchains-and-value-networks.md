---
title: 'Interledger: How to Interconnect All Blockchains and Value Networks'
description: 'Interledger was born out of a project to build a blockchain-agnostic smart contracts platform. A key challenge was neutrality: how could a decentralized app buy resources like storage and computing, without being tied to a specific blockchain?'
date: 2018-10-03
slug: interledger-how-to-interconnect-all-blockchains-and-value-networks
lang: en
authors:
  - Evan Schwartz
author_urls:
  - https://www.linkedin.com/in/evanmarkschwartz/
external_url: https://medium.com/xpring/interledger-how-to-interconnect-all-blockchains-and-value-networks-74f432e64543
tags:
  - Interledger Protocol
---

*By* [_Evan Schwartz_](https://www.linkedin.com/in/evanmarkschwartz/) *and* [_Vanessa Pestritto_](https://www.linkedin.com/in/vanessaalexandra/)

Interledger was born out of a project to build a [blockchain-agnostic smart contracts](https://medium.com/coil/codius-smart-contracts-made-from-containers-b3b16c3e3890) platform. A key challenge was neutrality: how could a decentralized app buy resources like storage and computing, without being tied to a specific blockchain? Across the internet, apps and services face a similar issue of how to directly monetize without relying on a single cryptocurrency, a proprietary network like Visa or PayPal, or a monolithic platform like Apple. Interledger was designed to answer the question:

> What would a universal network for sending value, independent of any company or currency, look like?

Interledger is now live and the core protocol was finalized in late 2017. The network’s early use cases include trustlessly exchanging cryptocurrencies and enabling new business models with streaming micropayments. And that’s just the beginning. This post gives an overview of the Interledger network and highlights key features of the protocol that help connect vastly different blockchains and value systems.

## A Network of Decentralized Exchanges

Interledger is made up of a network of [connectors](https://interledger.org/developers/rfcs/interledger-architecture/#sender-receiver-connectors), independent operators that act as decentralized exchanges or market makers for cryptocurrencies, fiat currencies, and other tokenized assets. The protocol allows users to transact natively on the network of their choice, without needing to move assets to a centralized exchange or to a specific blockchain for trading.

The Interledger network has no central authority or company and the protocol is not tied to any currency, token or blockchain.

### Paying from One Currency to Another

With Interledger, a user can send BTC and the recipient will automatically receive ETH, or whatever their preferred currency happens to be. The assets are exchanged in the flow of the transfer without either party needing to think about how this happens.

Behind the scenes, Interledger routes packets of money across value networks like the internet routes packets of data between Internet Service Providers (ISPs). When the user sends BTC, the user’s wallet sends Interledger packets denominated in BTC to a connector. The connector applies their exchange rate and forwards ETH-denominated packets on to the receiver.

![Diagram showing how the connector forwards packets to the receiver](/developers/img/blog/2018-10-03/connector.webp)

For more obscure assets, Interledger packets are automatically routed across multiple connectors and each one is incentivized to help find the best paths through the network. Importantly, all of this happens without the sender needing to trust the connectors, as the protocol guarantees that the sender’s money cannot be lost or stolen in transit (see Trustless Sending below).

## Key Features of the Open Protocol

Interledger is a pure protocol and simplicity was one of the primary design principles. The simpler the protocol, the more networks it can connect. In this way, we drew much of our inspiration from the Internet. **An open network of networks is more resilient, scalable, and feature-rich than any independent network on its own.**

The key features of the Interledger Protocol are:

- Simple Packet Format
- Trustless Sending
- Packetizing Value

### Simple Packet Format

The core of the Interledger Protocol (ILP) is the ILP packet, the messaging standard used between senders, connectors, and receivers. The packet is inspired by Internet Protocol (IP) packets and addresses, which are the core of the Internet.

[ILPv4](https://interledger.org/developers/rfcs/interledger-protocol/) has three packet types: Prepare, Fulfill, and Reject; which correspond to request, response, and error messages. Connectors forward Prepare packets from senders to receivers and the connectors relay the Fulfill or Reject packets back from the receivers to the senders.

Prepare packets have only five fields: a destination address, amount, end-to-end data, and a “condition” and expiration that enable the trustless sending. The packet format is network-agnostic and the universal [ILP address](https://interledger.org/developers/rfcs/ilp-addresses/) scheme helps connectors route packets to the correct receiver.

### Trustless Sending

The second key feature of Interledger is that it enables users to send money through the network of connectors without needing to trust them. ILP guarantees that the sender’s money cannot be lost or stolen in flight, which is critical for creating an open and competitive network.

Interledger uses a [“forward-and-backward” packet flow](https://interledger.org/developers/rfcs/interledger-protocol/#ilp-packet-lifecycle), or incentivized two-phase commit, in which the recipient gets paid before the money ever leaves the sender’s account.

![Diagram showing the “forward-and-backward” packet flow](/developers/img/blog/2018-10-03/packet-flow.webp)

- Prepare packets travel from the sender to the receiver (the “forward” part) and represent a commitment to pay, *if and only if* the connector presents proof that the receiver was paid.
- Fulfill packets include proof that the receiver was paid and are relayed by connectors back to the sender (the “backward” part). Only the receiver could generate the correct proof, which is a simple preimage of a hash. The sender knows with certainty when the money has arrived, no matter what path the packet has taken through the network of connectors. If a packet is misrouted or dropped, the sender will never get the Fulfill and the money will never leave their account.
- Reject packets are returned by the receiver if they do not want the Prepare packet or the packet does not pass one of the receiver’s checks. Connectors may also return Reject packets if the Prepare expires before the Fulfill is returned. Note that the sender can retry rejected packets, because they haven’t sent the money yet, and [higher-level protocols](https://medium.com/interledger-blog/streaming-money-and-data-over-ilp-fabd76fc991e) built on top of Interledger handle retries automatically.

### Packetizing Value

Interledger’s third key feature (and the [biggest difference between ILPv1 and ILPv4](https://interledger.org/developers/rfcs/interledger-protocol/#differences-from-previous-versions-of-ilp)) is packetizing value, or splitting up larger transfers into many lower-value packets. This is very similar to how big files sent over the internet are sent as many small packets. The benefits are surprisingly analogous to the internet itself, as homogeneous packets increase the network’s efficiency, security, and interoperability

Connectors process Interledger packets using limited pools of capital or liquidity, and using this efficiently is central to keeping costs low. Each Prepare packet requires connectors to hold the specified amount of money until the transaction is fulfilled or rejected. Smaller packet amounts help connectors avoid reserving large amounts of money for each transaction before knowing if it will be fulfilled. Connectors can operate with smaller pools of liquidity and increase the velocity and utilization of their money.

Packetized payments also increase the security and resilience of the network. Connectors can allocate their liquidity like Internet bandwidth (“payment bandwidth”) to prevent users from interfering with others’ connections. Additionally, smaller packets enable the use of shorter Prepare packet timeouts, which is critical for mitigating the [“free option problem”](https://altheamesh.com/blog/the-free-option-problem/) (locking in an exchange rate that attackers could exploit). At the same time, lower-value packets reduce the [risk](https://github.com/interledger/rfcs/blob/main/0018-connector-risk-mitigations/0018-connector-risk-mitigations.md) to a connector posed by failing to deliver the Fulfill packet in time.

Finally, packetized payments help Interledger connect more disparate types of ledgers and facilitate a broader array of use cases. Smaller packets can be cleared through ILP without ledger-provided escrow, which was needed for [ILPv1](https://github.com/interledger/rfcs/blob/main/deprecated/0003-interledger-protocol/0003-interledger-protocol.md#model-of-operation). This reduces the requirements for integrating a ledger down to just having the ability to transfer value (though simple payment channels are nice to have to increase speed and lower costs).

Connectors can optimize for speed and throughput, because every transaction— from large purchases to streams of micropayments — turns into similarly-sized ILP packets.\`

## The Interledger Network Today

The early Interledger network is optimized for micropayment use cases and trustlessly trading cryptocurrencies natively across blockchains. Here are some of the infrastructure and application companies building with ILP (and yes, they’re hiring!):

- [Coil](https://coil.com/) is a subscription service for supporting web content creators underpinned by Interledger micropayments and the proposed [Web Monetization standard](https://webmonetization.org/). Link to [demo](https://www.youtube.com/watch?v=q6sXGdQ_knE).
- [StrataLabs](https://web.archive.org/web/20201113153526/https://www.stratalabs.io/) is the first commercial Interledger connector company, enabling micropayment services like Coil.
- [Kava](https://kava.io/) runs an Interledger connector and is developing technology for the ILP ecosystem including new cross-currency integrations and a [Cosmos](https://cosmos.network/)\-based blockchain optimized for ILP.
- [The Bill & Melinda Gates Foundation](https://www.gatesfoundation.org/What-We-Do/Global-Growth-and-Opportunity/Financial-Services-for-the-Poor) developed [Mojaloop](http://mojaloop.io/), an open source payment system for emerging markets, using Interledger to increase financial inclusion through interoperability.
- Ilp.ix, an [mlab](https://mlab.company/) project, is an XRP peering exchange that helps connectors find and connect to one another.
- [XRP Tip Bot](https://www.xrptipbot.com/) enables Twitter, Reddit, and Discord users to tip one another using XRP and ILP.
- More are in stealth mode and coming soon!

## Build on Interledger

- Interested in running an Interledger connector? Check out [this guide](https://medium.com/interledger-blog/running-your-own-ilp-connector-c296a6dcf39a).
- Want to start building apps with Interledger? Download [moneyd](https://medium.com/interledger-blog/using-moneyd-to-join-the-ilp-testnet-ba64bd42bb14) and check out the [tutorials](https://medium.com/interledger-blog) to connect to Interledger in just a few minutes.
- If you’re interested in getting involved in the project, join the bi-weekly [community calls](https://interledger.org/events) and come chat with us on [Gitter](https://gitter.im/interledger/Lobby).

At Xpring, Ripple’s ecosystem initiative, we’re focused on supporting developers and projects building both infrastructure and applications in the Interledger ecosystem. We’re specifically interested in new connectors and wallets as well as micropayment services and decentralized exchange applications. If you’re building in these areas, please get in touch at [xpring@ripple.com](mailto:xpring@ripple.com).

Disclosure: Xpring is an investor in Coil and StrataLabs.

## About Interledger

Interledger is an open source protocol developed by the [W3C Interledger Community Group](https://www.w3.org/community/interledger/). There is no Interledger company, currency, or blockchain.

_Thanks to Danny Aranda, Brandon Curtis, Kevin Davis, Meredith Finkelstein, Jamie Goldstein, Brian Kerr, Akash Khosla, Austin King, Zaki Manian, Cristina Nita-Rotaru, Teemu Paivinen, Sid Ramesh, Rome Reginelli, Dan Robinson, Dino Rodriguez, and Scott Stuart for their feedback on this post!_
