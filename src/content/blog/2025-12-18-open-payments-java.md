---
title: 'Getting Started with Open Payments Java SDK'
description: 'Discover the Open Payments Java SDK and master its usage for seamless integrations.'
date: 2025-12-18
slug: open-payments-java
authors:
  - Oana Lolea
author_urls:
  - https://github.com/oana-lolea
tags:
  - Releases
  - Open Payments
  - Updates
---

As adoption of Open Payments grows within the Interledger ecosystem, developers are building innovative solutions, enabling truly global, frictionless value transfer.

A significant portion of enterprise-grade backend services, financial platforms, and scalable applications are powered by Java. Developers in these environments have long sought a native, idiomatic way to integrate Open Payments without the overhead of language bridges or manual HTTP management.

## Introducing Java SDK for Open Payments

We're excited to announce the release of the [**Java SDK for Open Payments**](https://github.com/interledger/open-payments-java)\! This new SDK brings robust, type-safe support directly to the Java world, making it easier than ever for Java developers to harness the full potential of interoperable payments.

## Why We Built the Java SDK

We've heard from our community: Java remains a powerhouse for enterprise-grade applications, especially in the fintech space where reliability, scalability, and security are paramount. The new Java SDK addresses this by offering:

- **Native Java feel**: Fluent APIs, builders, and strong typing.
- **Simplified complexity**: Handles GNAP grant flows, HTTP signing (EdDSA), nonce management, and interactive continuations automatically.
- **Minimal boilerplate**: No more manual JSON handling or signature calculations for every request.

It lets you focus on building innovative payment features while writing clean, maintainable Java code.

## Open Payments and the Java Ecosystem

Java continues to power the majority of enterprise software, especially in sectors where reliability, security, and scalability are critical—such as banking, financial services, payment processing, and large-scale backend systems. The availability of a native Java SDK for Open Payments brings several important advantages:

- **Reduced integration costs**: Connect to a global, protocol-agnostic payment network without maintaining dozens of provider-specific integrations.
- **Improved resilience and reach**: Leverage Interledger's interoperability to access new markets and payment rails while avoiding single-provider risk.
- **Enterprise-ready tooling alignment**: Integrate seamlessly with familiar frameworks like Spring Boot, Quarkus, or Micronaut, and existing security/compliance workflows.
- **Faster innovation**: Enable use cases such as cross-border B2B transfers, automated treasury management, real-time reconciliations, and next-generation fintech products—all within established Java ecosystems.

This SDK makes it straightforward for Java teams to experiment with, prototype, and deploy Interledger-based payments in production.

## Key Features

The SDK supports core Open Payments functionality:

- Complete support for managing Open Payments operations (grants, incoming and outgoing payments, obtaining quotes and token).
- Full error handling and validation.
- Configurable HTTP clients.
- Examples for common flows.
- Comprehensive models and Javadoc.
- Unit tests for core logic and integration tests verifying end-to-end flows.

## Getting Started

The library is available on Maven Central and adding it to your project is straightforward:

```xml
<dependency>
    <groupId>org.interledger</groupId>
    <artifactId>open-payments</artifactId>
    <version>1.0.0</version>
</dependency>
```

And now let’s see an example of how to create an incoming payment:

```java
import org.interledger.openpayments.*;

// Create HTTP client
IOpenPaymentsClient client = OpenPaymentsHttpClient.defaultClient(
     "WalletAddress",
     "PrivateKeyPEM",
     "KeyId"
 );

// Retrieve the wallet:
var receiverWallet = client.getWalletAddress("https://cloudninebank.example.com/merchant");

// Create incoming payment:
var grantRequest = this.client.createGrantIncomingPayment(receiverWallet);
var incomingPayment = this.client.createIncomingPayment(receiverWallet, grantRequest, BigDecimal.valueOf(11.25));

```

## Packages Overview

The SDK is thoughtfully organized into packages for better modularity and maintainability. Here's an overview of the main packages based on the repository structure:

| Package       | Content                                                                         |
| ------------- | ------------------------------------------------------------------------------- |
| `exception/`  | Custom exceptions for both Open Payments API errors and client errors           |
| `httpclient/` | Client to interact with Open Payments API and its custom logger and options     |
| `mapper/`     | Custom object mapper for JSON and API error processing, plus useful serializers |
| `model/`      | Data modelling for Open Payments resources                                      |
| `signing/`    | Builder for signed HTTP requests to ensure Interledger API communication        |
| `util/`       | Utility methods for validations                                                 |

## Get Coding\!

Give the Java SDK a spin in your project. Try it out, break it, and let us know what you think via GitHub or the Interledger community channels. Your feedback will shape where this goes next!
