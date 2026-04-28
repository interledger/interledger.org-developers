---
title: 'Open Payments meet .NET'
description: 'Integrate Open Payments into your stack with native DI, full type safety and automatic request signing.'
date: 2026-04-23
slug: open-payments-dotnet-sdk
authors:
  - Cozmin Ungureanu
author_urls:
  - https://github.com/cozminu
tags:
  - Releases
  - Open Payments
  - Updates
---

Building payment experiences in C# just got simpler. We’ve officially launched the [Open Payments .NET SDK](https://github.com/interledger/open-payments-dotnet), removing the friction of manual API wiring. It’s a production-ready library that gives .NET developers everything they need to integrate secure, interoperable finance into their applications.

## What is Open Payments?

[Open Payments](https://openpayments.dev/) is an API standard for banks, mobile money providers, and other account servicing entities. It allows developers to build payment capabilities into their apps without the need for custom integrations or third-party payment processors.

## Why a .NET SDK?

The .NET ecosystem powers a significant share of enterprise backends, fintech platforms and payment processors worldwide. With this SDK, the same developers who build these systems can now integrate Open Payments natively with the type safety, dependency injection support and async patterns they already know and love.

The SDK is generated from the [official Open Payments OpenAPI specifications](https://github.com/interledger/open-payments), then augmented with hand-crafted client interfaces, GNAP authentication, and automatic [HTTP Message Signatures](https://www.rfc-editor.org/rfc/rfc9421) (Ed25519). You get a clean, high-level API without sacrificing spec compliance.

## Getting Started

Install the NuGet package in your project:

```bash
dotnet add package Interledger.OpenPayments
```

Then set up the client in a few lines:

```csharp
using Microsoft.Extensions.DependencyInjection;
using OpenPayments.Sdk.Clients;
using OpenPayments.Sdk.Extensions;
using OpenPayments.Sdk.HttpSignatureUtils;

var client = new ServiceCollection()
    .UseOpenPayments(opts =>
    {
        opts.UseAuthenticatedClient = true;
        opts.KeyId = "your-key-id";
        opts.PrivateKey = KeyUtils.LoadPem(yourPrivateKeyPem);
        opts.ClientUrl = new Uri("https://wallet.example.com/your-account");
    })
    .BuildServiceProvider()
    .GetRequiredService<IAuthenticatedClient>();
```

The SDK plugs directly into `Microsoft.Extensions.DependencyInjection`, so it fits naturally into ASP.NET Core applications, background workers, or any DI-enabled host.

## What Can You Do With It?

The SDK covers the full Open Payments API surface:

**Wallet Addresses** - look up any Open Payments-enabled account:

```csharp
var walletAddress = await client.GetWalletAddressAsync(
    "https://wallet.example.com/alice"
);
// walletAddress.AuthServer, walletAddress.ResourceServer
```

**Incoming Payments** - create, retrieve, list, and complete incoming payment resources:

```csharp
var incomingPayment = await client.CreateIncomingPaymentAsync(
    new AuthRequestArgs { Url = walletAddress.ResourceServer, AccessToken = token },
    new IncomingPaymentBody
    {
        WalletAddress = walletAddress.Id,
        IncomingAmount = new Amount("10000", "USD", 2)  // $100.00
    }
);
```

**Quotes** - get exchange rates and fees before committing to a payment:

```csharp
var quote = await client.CreateQuoteAsync(
    new AuthRequestArgs { Url = senderWallet.ResourceServer, AccessToken = token },
    new QuoteBody
    {
        WalletAddress = senderWallet.Id,
        Receiver = receiverWallet.Id,
        Method = PaymentMethod.Ilp
    }
);
// quote.DebitAmount, quote.ReceiveAmount, quote.ExpiresAt
```

**Outgoing Payments** - execute payments based on quotes or direct to incoming payments:

```csharp
var payment = await client.CreateOutgoingPaymentAsync(
    new AuthRequestArgs { Url = senderWallet.ResourceServer, AccessToken = token },
    new OutgoingPaymentBodyFromQuote
    {
        WalletAddress = senderWallet.Id,
        QuoteId = quote.Id
    }
);
```

**Grants and Tokens** - full GNAP authorization flow, including interactive grants with user consent, token rotation, and revocation.

Check out [openpayments.dev](https://openpayments.dev/) for complete examples and guides.

## Security Built In

Every authenticated request is automatically signed using Ed25519 HTTP Message Signatures ([RFC 9421](https://www.rfc-editor.org/rfc/rfc9421)). The SDK handles this transparently - you never have to manually construct signature headers, compute content digests, or manage signing parameters. Just provide your private key at setup and make your API calls.

The `Interledger.OpenPayments.HttpSignatureUtils` package is also available separately if you need HTTP signature functionality in other contexts.

## Error Handling

The SDK provides structured error handling through typed exceptions. API errors are surfaced as `ApiException<ErrorResponse>`, giving you access to the HTTP status code, the raw response and a deserialized error model:

```csharp
try
{
    var payment = await client.CreateOutgoingPaymentAsync(requestArgs, body);
}
catch (ApiException<ErrorResponse> ex)
{
    // Typed error with structured details
    Console.WriteLine($"Error: {ex.Result.Error.Code}");        // e.g. "invalid_request"
    Console.WriteLine($"Description: {ex.Result.Error.Description}");
    Console.WriteLine($"HTTP Status: {ex.StatusCode}");          // e.g. 400, 403
}
catch (ApiException ex)
{
    // Unexpected error — no typed body
    Console.WriteLine($"Unexpected error ({ex.StatusCode}): {ex.Response}");
}
```

Auth server errors include specific GNAP error codes like `invalid_client`, `request_denied`, and `too_fast` (rate limiting), so you can handle each scenario appropriately.

## Real-World Payment Scenarios

We have updated the eight guides on [openpayments.dev](https://openpayments.dev/) to include detailed dotnet client usage & examples:

1. **One-time e-commerce payment** - retailer checkout with quote and interactive grant
2. **Fixed-debit remittance** - send fixed amount from your account
3. **Fixed-receive remittance** - ensure the recipient gets an exact amount
4. **Recurring payment setup** - monthly subscriptions with ISO 8601 intervals
5. **Recurring fixed-debit** payments
6. **Recurring fixed-receive** payments
7. **Split payments** - divide a payment between multiple recipients
8. **Pre-authorized future payments** - grant access for a service to initiate payments later

Each guide walks through the full payment lifecycle. You can find the full guides and documentation at [openpayments.dev](https://openpayments.dev/).

## What's Next

This is just the beginning. We're actively working on improving the SDK and would love your feedback. Here's how to get involved:

- **Try it out**: `dotnet add package Interledger.OpenPayments`
- **Browse the source**: [github.com/interledger/open-payments-dotnet](https://github.com/interledger/open-payments-dotnet)
- **Read the docs**: [openpayments.dev](https://openpayments.dev/)
- **Join the conversation**: Our community catchup calls happen every other Thursday at 12:00 UTC. [Join via Google Meet](https://meet.google.com/htd-eefo-ovn)
- **Contribute**: Check the [contribution guidelines](https://github.com/interledger/open-payments-dotnet/blob/main/.github/contributing.md) and jump in

If you run into issues or have feature requests, [open an issue](https://github.com/interledger/open-payments-dotnet/issues) on GitHub. We're building this for the community and your input matters.
