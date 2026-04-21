---
title: 'Simplifying Interledger: The Graveyard of Possible Protocol Features'
description: As the development of the Interledger Protocol (ILP) nears completion, I thought we should take a moment to remember some of the many core protocol features we’ve killed off along the way.
date: 2018-01-29
slug: simplifying-interledger-the-graveyard-of-possible-protocol-features
lang: en
authors:
  - Evan Schwartz
author_urls:
  - https://www.linkedin.com/in/evanmarkschwartz/
external_url: https://medium.com/interledger-blog/simplifying-interledger-the-graveyard-of-possible-protocol-features-b35bf67439be
tags:
  - Interledger Protocol
---

As the development of the [Interledger Protocol](https://interledger.org/) (ILP) nears completion, I thought we should take a moment to remember some of the many core protocol features we’ve killed off along the way.

<figure>
  <img src="/developers/img/blog/2018-01-29/tree.webp" alt="Lone tree on graveyard">
  <figcaption>Photo by&nbsp;<a href="https://unsplash.com/photos/WE8X1GPPJ4E?utm_source=unsplash&amp;utm_medium=referral&amp;utm_content=creditCopyText">Ashim D’Silva</a>&nbsp;on&nbsp;<a href="https://unsplash.com/search/photos/graveyard?utm_source=unsplash&amp;utm_medium=referral&amp;utm_content=creditCopyText">Unsplash</a></figcaption>
</figure>

These were 12 promising features, and countless hours were spent perfecting them. But they were sacrificed for simplicity’s sake. Rest in peace, old friends.

Getting people to agree on any standard is notoriously difficult, so we have worked to make Interledger [as simple as possible](https://medium.com/@justmoon/blockchain-advocates-must-learn-the-law-of-standards-8f3116ccdc5f). We have often repeated the mantra that the core protocol would only be finished when there was nothing more to take out — and little left to debate. Today, we celebrate the life and death of these features for bringing us closer to payments interoperability.

_(Curious which features are left? Look for upcoming posts on Interledger V4!)_

## 1\. The King: One Ledger to Rule Them All

Died: *November, 2014*. Age: *Timeless.*  
Cause of Death: *The world will never agree on a single ledger.*

Every payment network wants to be king. From traditional networks like Visa and SWIFT to blockchains like Bitcoin, Ripple, Stellar, and Cosmos, many have tried to enable payments “interoperability” by convincing others to connect through their network. But as long as each provider wants to own the network, we’ll end up with the fragmented payment landscape we see today.

The Interledger project began with the realization that the world will never agree to use a single payment network — whether centralized or decentralized, blockchain or traditional bank ledger. There will be a proliferation of networks. What we know now is there is a need to connect all of these payment networks with an [_internetworking_](https://en.wikipedia.org/wiki/Internetworking) protocol that is not tied to any one company, currency, or network.

## 2\. The Notary: Fully Atomic Payments

Died: [_June, 2016_](https://github.com/interledger/rfcs/issues/28). Age: *2 years*.  
Cause of Death: *Trust isn’t universal.*

If we could not agree to use a single ledger, maybe we could replicate the benefits of having all transactions within one system, but across multiple ledgers. The idea of “Atomic Mode,” as described in the [Interledger whitepaper](https://interledger.org/interledger.pdf), was to use a group of “notaries” or validators to ensure that transfers on multiple systems would be atomic, meaning they would be executed or rolled back together. Senders and intermediary connectors would first put funds on hold in the first part of a two-phase commit. Notaries would then decide whether the payment succeeded or failed, similar to blockchain validators or miners, but chosen on a per-transaction basis.

Atomic mode provides some important benefits, but it only works if all parties in a payment share a commonly-trusted set of notaries or blockchain. Unfortunately, finding overlapping trust amongst groups using different ledgers and spread across the entire internet just isn’t likely. Atomic Mode would work best in pre-defined groups with fixed notaries, rather than as a solution for general interoperability. We prioritized the other mode, called Universal. Intermediaries take some [manageable risk](https://github.com/interledger/rfcs/blob/master/0018-connector-risk-mitigations/0018-connector-risk-mitigations.md#fulfillment-failure) but, the protocol does not require agreement on who to trust, making it more… universal.

## 3\. The Cashier: Ledger-Generated Receipts

Died: *December 2014*. Age: *6 months*.  
Cause of Death: *Ledgers aren’t meant to understand one another.*

Without notaries, how would ledgers know when to execute or roll back their transfers? We wanted the connectors to get paid only once the receiver was paid. One idea was to make the transfers dependent on a receipt from the last ledger proving that the receiver was paid. However, this would mean that all ledgers would need to understand that receipt from the receiver’s ledger.

This idea died quickly. Building one ledger to understand another, as with [Sidechains](https://blockstream.com/sidechains.pdf) or [BTC Relay](http://btcrelay.org/), could work, or even building a group of ledgers to interoperate, such as with [Cosmos](http://cosmos.network/) and [Polkadot](https://polkadot.io/). However, we could not expect every ledger in the world to understand all other ledgers. Agreeing on how different systems would verify each other’s state would be a challenge and we could never expect all existing ledgers to be upgraded. The subtle realization was that a statement from the receiver that they were paid would be just as good as a proof from their ledger. For Interledger to achieve general interoperability it would be easier to standardize receiver behavior and we would need to minimize the requirements to integrate ledgers.

## 4\. The Director: Source Routing

Died: [_May, 2016_](https://github.com/interledgerjs/ilp-connector/pull/150). Age: *1 year*  
Cause of Death: *Decisions should be made where the knowledge is.*

A central question for an internetworking protocol like Interledger is how the paths for multi-hop payments are determined. Early versions of Interledger used source routing, in which senders would know the entire topology of the network and choose the payment path themselves. Connectors would broadcast routes and exchange rates and every participant would store a map of the network. Source routing may work for a limited number of nodes or for a single currency, but it does not scale for millions of nodes with fluctuating exchange rates.

Inspired by the Internet’s decision to separate [addressing from routing](https://www.rfc-editor.org/ien/ien19.txt), we came up with an [Interledger address](https://interledger.org/developers/rfcs/ilp-addresses/) format similar to IP addresses. Senders would specify *where* they wanted their money to go, but connectors would determine *how* to route payments. Connectors would use their local knowledge of routes and rates, rather than needing everyone to keep an up-to-date map of all connectors. (Note: one of the powerful benefits of the Internet’s separation of addressing and routing was that it enabled the routing protocol to be [upgraded numerous times](https://medium.com/@datapath_io/the-history-of-border-gateway-protocol-a212b7ee6208) without most users noticing, because the IP address stayed the same.)

## 5\. The Magician: Abstract Packet

Died: [_January, 2017_](https://github.com/interledger/rfcs/issues/146). Reborn and Died Again: [_December, 2017_](https://github.com/interledger/rfcs/pull/347).  
Cause of Death: *Having options isn’t always better.*

One of the most often debated aspects of Interledger has been the ILP packet format — not just the fields in the packet but the encoding as well. Should the packet be sent as text, JSON, Protocol Buffers, or a custom binary format? Having an abstract packet definition that could be encoded in different formats and translated by connectors seemed attractive, because it meant we would not need to agree on one encoding.

Leaving the encoding up to implementations would mean that every ledger protocol would need to send each of the fields from the packet individually. They would need to be careful to avoid subtle incompatibilities with other implementations. Furthermore, it would be nearly impossible to extend the ILP packet in the future, because it would be unlikely that every intermediary would correctly forward all extensions, including those they do not understand. Ultimately, we decided that picking a single format would provide greater consistency and extensibility than having multiple formats.

## 6\. The Cryptographer: Crypto Conditions

Died\*: [_February, 2017_](https://github.com/interledger/rfcs/issues/153). Age: *2 years*.  
Cause of Death: *The features supported will be the least common denominator.\* Crypto Conditions continue to be* [_developed at the IETF_](https://github.com/rfcs/crypto-conditions) *and used outside of ILP*

One of the most thoroughly designed features that was ultimately left out of ILP was the [Crypto Condition](https://github.com/rfcs/crypto-conditions): a standard for encoding different signature algorithms and ways to combine them. A central primitive in the original Interledger design were the conditions used to hold and execute payments. We spent months developing a standard for this more flexible type of multisig, [submitted it to the IETF](https://tools.ietf.org/html/draft-thomas-crypto-conditions-03), and then realized we did not need it.

The problem with having many condition types is that all intermediaries in a certain path would need to support the same algorithms in order for them to be usable. That meant that the only algorithms you could rely upon having support for would be the least common denominator. Most likely, this would come down to [simple SHA256 hash-locks](https://github.com/interledger/rfcs/issues/153). Less than 20% of the functionality could serve more than 80% of the use cases, and so the Interledger standard parted ways with Crypto Conditions.

## 7\. The Optimist: Condition-Less Transfers

Died: [_June, 2017_](https://lists.w3.org/Archives/Public/public-interledger/2017Jun/0033.html). Age: *2 years*.  
Cause of Death: *Anything that can be done at the edge of the network, should be.*

While most payments would likely use conditions for security, we always thought there could be some micropayment use cases where the sender would not care about securing their payments with a condition. Originally, conditions were considered optional and the reference ILP connector would forward “optimistic” payments in addition to those with conditions.

The idea of optimistic payments as a fully separate mode of ILP died when we realized this could be implemented [on top of ILP payments with conditions](https://lists.w3.org/Archives/Public/public-interledger/2017Jun/0033.html). Instead of requiring *all* connectors to have special functionality for forwarding condition-less payments, it could be made optional by using a well-known hash as the condition (such as the hash of 32 zero-bytes). Connectors that recognize optimistic payments could skip the hold step, while those that do not would get a valid fulfillment just like any other payment. The old [end-to-end principle](http://web.mit.edu/Saltzer/www/publications/endtoend/endtoend.pdf) won again, and the core ILP became one step simpler.

## 8\. The Geologist: Accommodating Slow Ledgers

Died: [_June, 2017_](https://www.coindesk.com/interoperability-boost-ripple-sends-blockchain-transaction-across-7-different-ledgers/). Age: *2 years*.  
Cause of Death: *Only the speediest survive.*

In June 2017, we excitedly sent a [single payment across seven different types of ledger integrations](https://www.coindesk.com/interoperability-boost-ripple-sends-blockchain-transaction-across-7-different-ledgers/), including payment channels, trustlines, and on-ledger escrow. We wrote up a spec for [Hashed Time-Lock Agreements (HTLAs)](https://interledger.org/developers/rfcs/hashed-timelock-agreements/) that described the array of options for integrating with ledgers. Having such a wide variety of integrations made Interledger more open and flexible. However, the “Seven Ledger Demo” showed that some integrations are superior to others. We spent minutes waiting for an on-ledger Ethereum transfer to execute, whereas the transfers via payment channels over Bitcoin and XRP went through instantaneously.

After the demo, we turned our attention to sending Interledger payments with real money and started focusing on the integration methods that would provide fast, cheap, and good user experiences. For cryptocurrencies, this would mean payment channels instead of on-ledger escrow. The shift to payment channels and sending smaller, fast payments would also mark the beginning of the end for the next couple of features.

## 9\. The Negotiator: Interledger Quoting Protocol

Died: [_September, 2017_](https://github.com/interledger/rfcs/pull/309). Age: *14 months*.  
Cause of Death: *The end-to-end principle struck again.*

Since the shift to non-source routing, there had been two protocols that all senders and connectors needed to support: Interledger payments and the Interledger Quoting Protocol (ILQP). ILQP allowed you to ask connectors up front how much a given payment would cost to send. You could specify a fixed source, or destination amount, or ask for a Liquidity Curve (see feature 11). It was non-binding, but we thought that surely you needed a way to determine the cost before sending a payment.

Similar to Optimistic Mode, ILQP was brought down by the realization that it could be implemented on top of normal Interledger payments. If payments were fast and cheap, what if you could just send a test payment and ask the receiver how much arrived? Using “end-to-end quoting,” senders could determine the rates without special functionality being built into the every connector. The end-to-end principle was victorious once again, and ILQP was removed from the core Interledger stack.

## 10\. The Postman: Destination Amount Delivery

Died: [_October, 2017_](https://github.com/interledger/rfcs/issues/312). Age: *14 months*.  
Cause of Death: *One behavior is better than two.*

Another feature that was introduced with the switch to non-source routing was the destination amount in the ILP packet. We thought that senders would want to indicate to the connectors exactly how much money should be delivered to the receiver. We debated what number format to use for the amounts, considered [various floating point encodings](https://github.com/interledger/rfcs/commit/9716fb7aa68a8770aee96413916e12edd69787fe#diff-42c9b615e907424c7cae3feb333d8b6fR36), and ultimately settled on unsigned 64-bit integers. Connectors would parse the ILP address to determine whether they should [“forward” the packet or “deliver” it](https://github.com/interledger/rfcs/issues/77) locally. This was considered so crucial that the destination amount was one of just three fields in the ILPv1 packet.

Once we started implementing [“end-to-end quoting”](https://github.com/interledger/rfcs/pull/309) to replace ILQP, it became clear that we needed a way to have connectors forward packets without trying to deliver a specific amount. How could senders use a test payment to determine the exchange rate if they needed to know the rate first to determine the destination amount to put in the packet? “Forwarded payments” became the norm in ILP versions 2–4. Connectors would simply look at the amount in the incoming transfer, apply their local rate, and pass on the payments. This simplified the connector behavior, as they no longer needed the “delivery” functionality, nor up-to-date exchange rate information for the entire network to determine the proper amount. This change also enabled us to build multiple types of functionality on top of one simple ILP primitive, from end-to-end quoting to streaming payments.

## 11\. The Surfer: Liquidity Curves and Large Packets

Died: [_September, 2017_](https://github.com/interledger/rfcs/pull/309). Age: *9 months*.  
Cause of Death: *Small is beautiful.*

Should Interledger be built for small packet amounts, large amounts, or both? Since the goal was to support nearly all use cases, and thus all possible amounts, we needed a way to express how the exchange rate would depend on the payment size. We designed the [Liquidity Curve](https://github.com/interledger/rfcs/blob/51e2ec229085ddef1606b2848953901c61d5ae2f/asn1/InterledgerTypes.asn#L44-L68), which used a series of points to represent the input and output amounts. Liquidity Curves were used in both the routing and quoting protocols to represent the potentially complex exchange rates.

For some time, there were discussions about killing Liquidity Curves because they were the most complicated feature in the core ILP. But they would ultimately be killed off by a more fundamental realization: that all Interledger payments would be small. Splitting larger payments down into smaller ones would make packets going over the network more homogenous. Exchange rates could be expressed as a single number and Interledger would actually use Internet-style packet switching.

## 12\. The Escrow Agent: Conditional Ledger Transfers

Died: [_December, 2017_](https://github.com/interledger/rfcs/issues/359). Age: *2 years, 6 months*.  
Cause of Death: *When it seems simple, there’s one thing left to take out.*

The most recent and surprising feature to pass away was the conditional transfer or “on-ledger escrow”, which had been with us since the white paper was written. Interledger payments were comprised of transfers on multiple ledgers and the ledgers would act as a kind of escrow agent. Certain varieties of [Hashed Time-Lock Agreements (HTLAs)](https://interledger.org/developers/rfcs/hashed-timelock-agreements/#htlas-without-ledger-supoprt) allowed for this behavior to be modeled by connectors for cases where ledgers did not natively support holds.

However, the shift to smaller, faster payments ultimately led to the [realization](https://github.com/interledger/rfcs/issues/359) that it would be *connectors*, rather than *ledgers,* that would implement the conditions. Connectors would forward Interledger packets, creating payment obligations, and users would settle with unconditional ledger transfers *out of the flow of the ILP payment.* The only requirement for ledgers to be used with ILP would be the ability to make simple transfers. The faster and cheaper a ledger is — or if it supports [simple payment channels](https://interledger.org/developers/rfcs/hashed-timelock-agreements/#simple-payment-channels) — the faster a connector and its users (or peers) can settle. But, the system works even with the slowest ledgers. The condition was moved from the ledger transfer into the ILP packet and ILPv4 was born.

Wondering what’s left in Interledger V4 if all of this has been taken out? Keep an eye out for upcoming posts that will explain it in detail!

Check out [Interledger.org](https://interledger.org/) and join the [community](https://community.interledger.org/) to learn more and get involved in the project!
