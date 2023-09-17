---
title: Libraries and Tools
description: Libraries and tools
prev: false
---

## Testnet Wallets

**Rafiki Money**

A user-facing demo wallet that can make Interledger payments to a variety of peers (supports USD, testnet only). Sign up at [https://rafiki.money](https://rafiki.money/).

## Rafiki

Open source software deployed by account servicing entities to enable Interledger functionality on its users accounts. [https://github.com/interledger/rafiki](https://github.com/interledger/rafiki)

## Connectors

**Javascript Connector**

An Interledger [Connector implemented in Javascript](https://github.com/interledgerjs/ilp-connector). This project has been battle-tested in various production deployments.

**Rust Connector**

An Interledger [Connector implemented in Rust](https://github.com/interledger-rs/interledger-rs). This project is not actively maintained, but has a robust feature-set and is easy to use.

## Libraries

**Interledger RS**

Build ILP applications that send and receive payments natively in Rust using [interledger.rs](http://interledger.rs/), which is a Rust implementation of Interledger.

**ILP-over-HTTP**

Implementations of [ILP-over-HTTP](https://github.com/interledger/rfcs/blob/master/0035-ilp-over-http/0035-ilp-over-http.md), which is a bilateral communications protocol for server-to-server ILP connections.

- **Rust**: [ILP-over-HTTP](https://github.com/interledger-rs/interledger-rs/tree/master/crates/interledger-http)
- **Javascript**: [ilp-plugin-http](https://github.com/interledgerjs/ilp-plugin-http)

**Interledger STREAM**

Reliably send packetized money and data over Interledger using [STREAM](https://github.com/interledger/rfcs/blob/master/0029-stream/0029-stream.md).

- **Rust**: [STREAM RS](https://github.com/interledger-rs/interledger-rs/tree/master/crates/interledger-stream)
- **Javascript**: [STREAM JS](https://github.com/interledgerjs/ilp-protocol-stream)
