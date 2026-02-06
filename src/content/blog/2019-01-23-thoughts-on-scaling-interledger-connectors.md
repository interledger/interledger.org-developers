---
title: Thoughts on Scaling Interledger Connectors
description: Streaming payments mean that Interledger connectors need to process huge volumes of Interledger packets, but the current reference implementation is hard to run at scale.
date: 2019-01-23
slug: thoughts-on-scaling-interledger-connectors
lang: en
authors:
  - Evan Schwartz
author_urls:
  - https://www.linkedin.com/in/evanmarkschwartz/
external_url: https://medium.com/interledger-blog/thoughts-on-scaling-interledger-connectors-7e3cad0dab7f
tags:
  - Interledger Protocol
---

Streaming payments mean that Interledger connectors need to process huge volumes of Interledger packets, but the current reference implementation is hard to run at scale. My hypothesis is that we should make the connector completely stateless using an HTTP-based bilateral communication protocol.

This post describes ongoing work and neither the design nor the protocol are settled. Comments and alternative suggestions are welcome! You can find a basic prototype of the proposed design implemented [here](https://github.com/emschwartz/interledger-rs/commit/af795bc03a236ee39798e6dc76524afd49cef876).

## Bilateral Communication in Interledger

[Interledger.js](https://github.com/interledgerjs) uses a [plugin architecture](https://github.com/interledger/rfcs/blob/main/deprecated/0024-ledger-plugin-interface-2/0024-ledger-plugin-interface-2.md) to abstract away different possible bilateral messaging protocols, but today all of the plugins are built on the [Bilateral Transfer Protocol (BTP)](https://interledger.org/developers/rfcs/bilateral-transfer-protocol/). BTP is a binary request/response protocol implemented over [WebSockets](https://en.wikipedia.org/wiki/WebSocket). It originally included message types for Prepare, Fulfill, Reject and Transfer, but [BTP 2.0](https://github.com/interledger/rfcs/pull/383), which is used today, stripped out nearly everything except request/response semantics, authentication, and “sub-protocol” naming.

Why did we use WebSockets? Over the years of working on Interledger, we have had [countless](https://github.com/interledger/rfcs/pull/125) [discussions](https://github.com/interledger/rfcs/pull/251) about the optimal “ledger layer” or bilateral messaging protocol to use for communicating Interledger details. At various points, we considered HTTP, GRPC, WebRTC, MQTT, and UDP, among others.

WebSockets were chosen for their mix of:

- Available implementations in nearly all programming languages
- Relatively low overhead on the wire
- Bidirectional messaging (without requiring both parties to have publicly accessible endpoints)
- Server and browser support

This set of features meant that we could support a single protocol for both client-to-server relationships and peering relationships between connectors. However, as the Interledger network has grown, we are seeing the limits of using BTP for server-to-server communication.

## Challenges Scaling WebSocket Peering

Interledger Service Providers (ILSPs) need to run multiple instances of the connector in order to process large volumes of Interledger packets. Unfortunately, this is difficult to do today, arguably because of BTP and its use of WebSockets.

Current ILSPs that run multiple connectors configure different WebSocket URLs and ILP addresses for each instance. As a result, peering with another ILSP requires configuring each connector with *all* of the URLs and ILP addresses of the peer’s connectors (n² connections). This complicates configuring connectors, exposes an ILSP’s internal network configuration to their peers (a potential security concern), and prevents “autoscaling” connectors (having a cloud provider automatically deploy new instances to handle additional demand). Furthermore, if a single connector instance crashes, any applications that are in the process of sending packets to or from that ILP address (for example, using [STREAM](https://medium.com/interledger-blog/streaming-money-and-data-over-ilp-fabd76fc991e)) will need to re-establish their connection with a new ILP address.

## Stateless, HTTP-Based Connectors

An alternative to our current architecture is to switch the bilateral communication to HTTP(S) and make the connector completely stateless.

As illustrated below, each incoming ILP Prepare packet would be its own HTTP POST request, and the ILP Fulfill or Reject would come back on the HTTP response. An ILSP would run a standard HTTP load balancer in front of an autoscaling cluster of connectors. Connectors would look up the next hop in their routing table and send an outgoing HTTP POST request to the peer’s endpoint, which would likely correspond to their load balancer. As a result, each ILSP could use a single ILP address and HTTPS URL for peering and the internal configuration of their network would be kept private.

<figure>
  <img src="/developers/img/blog/2019-01-23/ilsp-architecture.webp" alt="Proposed ILSP architecture">
  <figcaption>Proposed ILSP architecture</figcaption>
</figure>

## Balance Logic In the Database

In order to keep the connector stateless, all balance logic would need to be performed in a database. This could be done using a fast, in-memory system like [Redis](https://redis.io/) while the authoritative ledger could be persisted by writing all packets to an on-disk SQL or NoSQL store. The advantage of offloading balance-related transactions to a database is that that is exactly what databases are designed for. If there is even a slight possibility that multiple connectors could process transactions for the same account, a single system will need to ensure that transactions are applied atomically. Since we need the database to be the ultimate arbiter, we should offload all of the related logic to it. (Note that we may eventually surpass the performance of available databases, but we are many orders of magnitude of transactions away from that.)

## Connection Overhead?

What about the overhead of establishing HTTPS connections? Each client or peer could keep a TLS/TCP socket open with the load balancer using HTTP2 or HTTP 1.1 with Keep-Alive. The load balancer would similarly maintain open sockets with the internal connector instances. At worst, each connector might have an open socket with each peer’s load balancer for outgoing packets.

Even if outgoing connections are a concern or performance issue, most load balancers’ strategies can be configured to prioritize sending certain traffic to particular instances. For example, Google Cloud’s load balancer supports [Session Affinity](https://cloud.google.com/load-balancing/docs/backend-service#session_affinity) that can route requests based on parameters such as client IP address. This would boost the performance in cases where the same HTTP client is sending many packets to the same destinations. Alternatively, the sender of the HTTP-based protocol could include the destination ILP address in an HTTP header (or even the URL path) so that the load balancer could route based on the final destination, which is a reasonably proxy for the next hop the packet will be forwarded to. (Note that because of HTTP2 header compression, adding the destination ILP address in a header would add incur [1–2 bytes](https://blog.cloudflare.com/hpack-the-silent-killer-feature-of-http-2/) per request on the wire if many packets are sent to the same destination.)

## Separating Clearing and Settlement

Another change that would help scale (and simplify) the connector would be to completely separate the forwarding of Interledger packets from settlement-related behavior. The Interledger.js plugin architecture assumes that a plugin will handle both. However, as soon as companies started running connectors and working to scale their throughput, they immediately switched to an out-of-stream settlement process. If a connector has enough volume, performing and verifying a cryptographic signature for each packet quickly becomes an issue for CPU usage and latency. Furthermore, if you use payment channels for settlement, you need a process that is constantly monitoring the blockchain for close transactions anyway, so that same system might as well handle updating the channels too.

Part of the original motivation for combining clearing and settlement in the plugin was due to the use of WebSockets for bilateral communication. If you already have a communication channel with a peer for sending ILP packets, you might as well use the same channel to send settlement-related messages. Switching to HTTP can help us decouple this.

A separate settlement engine could trivially make outgoing HTTP requests to send payment channel updates or other details to its peers. Incoming requests could be routed by the same externally-facing load balancer using URL path-based routing (for example, XRP Payment Channel updates would be POSTed to provider.example/xrp). The settlement engine would also connect to the same database as the connectors to atomically adjust the balance based on incoming settlements. A final benefit of this separation is that the settlement engine would be a standalone service, so it would not need to be reimplemented in every programming language as the plugins must be today.

## HTTP(S) Everywhere

One of the earlier arguments for WebSockets was being able to support clients that do not have publicly accessible endpoints, such as browser clients or mobile apps. However, the most widely used Interledger Application Layer Protocol, the [Simple Payment Setup Protocol (SPSP)](https://interledger.org/developers/rfcs/simple-payment-setup-protocol/), requires a public HTTPS endpoint. Thus, in order to receive money via Interledger right now, an application already needs a public endpoint.

Until the end of last year, I had thought that we would eventually replace SPSP with another protocol that would not require a public endpoint to receive payments. It felt a bit silly to pull in heavy dependencies including HTTP, TLS, DNS, and the whole (flawed) Certificate Authority system for the [single HTTPS request](https://interledger.org/developers/rfcs/simple-payment-setup-protocol/#query-get-spsp-endpoint) SPSP uses. However, the alternatives leave much to be desired. Few people outside of the cryptocurrency world want cryptographic keys as identifiers and, as of today, there is no alternative for establishing an encrypted connection from a human-readable identifier that is anywhere nearly as widely supported as DNS and TLS.

This was how I learned to stop worrying and love HTTP(S). If receiving money already requires a publicly accessible HTTPS server, then why not just use another HTTPS endpoint to receive ILP packets? Making connectors stateless should help us scale to handle greater volumes of ILP packets and enable groundbreaking use cases with efficient streaming payments.

If you’re interested in helping to scale Interledger infrastructure, get in touch because companies in the Interledger community are hiring and looking for people with your skills! You can also join the [Interledger Community Group calls](https://interledger.org/events), where we’ll be discussing this topic and many others.
