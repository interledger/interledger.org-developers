---
title: 'Open Payments meets .NET'
description: 'Moving money between two wallet providers from a C# backend, without writing the GNAP grant flow or RFC 9421 signing yourself.'
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

The [Open Payments .NET SDK](https://github.com/interledger/open-payments-dotnet) is out, on NuGet as [Interledger.OpenPayments](https://www.nuget.org/packages/Interledger.OpenPayments).

You run a C# backend and you need to move money to someone. Their account is with one provider, yours is with another, and neither of you wants to build a bilateral integration with the other. [Open Payments](https://openpayments.dev/) is the API standard that makes that work: banks, digital wallet providers and mobile money providers implement it, and two of them can set up a payment between them without either side knowing anything special about the other. Some of those backends are .NET. There wasn't a client for them, which left you with `HttpClient` and the spec.

A wallet address server publishes public information about an account. A resource server handles incoming payments, quotes and outgoing payments. Before you touch a resource server you need a grant from an authorisation server, which speaks [GNAP](https://datatracker.ietf.org/doc/html/draft-ietf-gnap-core-protocol). One payment touches all three, on both wallets:

```
1  GET  happylifebank.example/retailer            wallet address, public
2  POST auth.happylifebank.example                grant: create an incoming payment
3  POST happylifebank.example/incoming-payments   the incoming payment
4  POST auth.cloudninebank.example                grant: create a quote
5  POST cloudninebank.example/quotes              the quote, fees and rate
6  POST auth.cloudninebank.example                grant: outgoing payment, interactive
7       customer approves in their own wallet, redirect back to you
8  POST <continue uri>                            swap interact_ref for a token
9  POST cloudninebank.example/outgoing-payments   the payment
```

That's eight requests across four hosts. You don't know any of the hostnames until runtime.

## What you need

`Interledger.OpenPayments` targets net9.0. The signing package, `Interledger.OpenPayments.HttpSignatureUtils`, targets net8.0. On net8 LTS you can use the signing utilities today, but not the client.

JSON is Newtonsoft rather than System.Text.Json, which is deliberate and explained below. Ed25519 comes from NSec, and NSec brings native libsodium with it. Check that if you deploy to Alpine or publish AOT. Registration goes through `IHttpClientFactory`. Your own delegating handlers, Polly policies and timeouts all still apply.

## Getting started against the test network

You don't need a bank to try this. The [Test Wallet](https://wallet.interledger-test.dev/) gives you both sides of a payment in about ten minutes. Sign up and verify your email. You need a real address for that, but the KYC form after it takes whatever you like. Then create an account inside the wallet, deposit play money into it, and add a wallet address. Under Settings, Developer Keys, generate a key pair. A `private.key` file downloads and the key ID shows up on screen. You'll want to do that twice, once for the sender and once for the receiver.

```bash
dotnet add package Interledger.OpenPayments
```

```csharp
using Microsoft.Extensions.DependencyInjection;
using OpenPayments.Sdk.Clients;
using OpenPayments.Sdk.Extensions;
using OpenPayments.Sdk.HttpSignatureUtils;

var client = new ServiceCollection()
    .UseOpenPayments(opts =>
    {
        opts.UseAuthenticatedClient = true;
        opts.KeyId = "your-key-id";                          // from Developer Keys
        opts.PrivateKey = KeyUtils.LoadKey("private.key");   // the file it downloaded
        opts.ClientUrl = new Uri("https://ilp.interledger-test.dev/your-address");
    })
    .BuildServiceProvider()
    .GetRequiredService<IAuthenticatedClient>();
```

In an ASP.NET Core app you'd call `UseOpenPayments` on `builder.Services` and inject `IAuthenticatedClient` where you need it. `ClientUrl` is your own wallet address. The server fetches your public key from there to check the signatures against. Public reads need no key at all: set `UseUnauthenticatedClient` and take `IUnauthenticatedClient`.

## A payment, end to end

The repo has this flow as `Guides/1_OneTimePayment.cs`, built along with everything else.

Start with both wallet addresses. The response is the only place you learn which auth server and which resource server to talk to next.

```csharp
var customerWallet = await client.GetWalletAddressAsync("https://cloudninebank.example.com/customer");
var retailerWallet = await client.GetWalletAddressAsync("https://happylifebank.example.com/retailer");
```

The retailer's auth server has to grant permission before you can create an incoming payment. Each resource has its own access item type, and the constructor sets the GNAP discriminator.

```csharp
var incomingGrant = await client.RequestGrantAsync(
    new RequestArgs { Url = retailerWallet.AuthServer },
    new GrantCreateBody
    {
        AccessToken = new AccessToken
        {
            Access = [new IncomingAccess { Actions = [Actions.Create] }]
        }
    }
);

var incomingPayment = await client.CreateIncomingPaymentAsync(
    new AuthRequestArgs
    {
        Url = retailerWallet.ResourceServer,
        AccessToken = incomingGrant.AccessToken!.Value
    },
    new IncomingPaymentBody
    {
        WalletAddress = retailerWallet.Id,
        IncomingAmount = new Amount("140000", "MXN", 2)  // 1,400.00 MXN
    }
);
```

`incomingGrant.AccessToken` is populated because that grant is non-interactive: nobody has to approve a request to be paid. The quote grant behaves the same way. The outgoing payment grant doesn't, and the difference is easy to miss when you're reading the two blocks side by side.

Quote next, on the sender's side. You want the fees and the rate before committing to anything. It needs its own grant, from the customer's auth server this time, with `QuoteAccess` where the last one had `IncomingAccess`. That grant request has the same shape as the one above, so this is just the quote call:

```csharp
var quote = await client.CreateQuoteAsync(
    new AuthRequestArgs { Url = customerWallet.ResourceServer, AccessToken = quoteGrant.AccessToken!.Value },
    new QuoteBody
    {
        WalletAddress = customerWallet.Id,
        Receiver = incomingPayment.Id,
        Method = PaymentMethod.Ilp
    }
);
// quote.DebitAmount, quote.ReceiveAmount, quote.ExpiresAt
```

## The interactive grant

The account holder has to approve the outgoing payment grant in their own wallet. In a web app that means a round trip out through the browser and back into a callback you have to route yourself. The SDK can only get you as far as the redirect.

```csharp
var nonce = Guid.NewGuid().ToString();

var pending = await client.RequestGrantAsync(
    new RequestArgs { Url = customerWallet.AuthServer },
    new GrantCreateBodyWithInteract
    {
        AccessToken = new AccessToken
        {
            Access =
            [
                new OutgoingAccess
                {
                    Identifier = customerWallet.Id,
                    Actions = [Actions.Create],
                    Limits = new OutgoingAccessLimits
                    {
                        DebitAmount = new AuthAmount(
                            quote.DebitAmount.Value,
                            quote.DebitAmount.AssetCode,
                            quote.DebitAmount.AssetScale)
                    }
                }
            ]
        },
        Interact = new InteractRequest
        {
            Start = [Start.Redirect],
            Finish = new Finish
            {
                Method = FinishMethod.Redirect,
                Uri = new Uri("https://yourapp.example/payments/callback"),
                Nonce = nonce
            }
        }
    }
);
```

`pending.AccessToken` is null here, and that's correct. What you get instead is `pending.Interact.Redirect`, where you send the customer, and `pending.Continue`, which is how you pick the flow back up: a URI, an access token for that URI, and a `Wait` hint in seconds.

Before you redirect, persist `pending.Continue.Uri`, `pending.Continue.AccessToken.Value`, the nonce and the quote ID, keyed by something you can find again in the callback. Session state works, a row in your database works better, because the customer may well approve on their phone while your app runs behind a load balancer. The grant is only valid for the redirect URI you registered. A per-payment key in the query string is the usual way round that.

The customer comes back to your callback with `interact_ref` and `hash` on the query string:

```csharp
// GET /payments/callback?interact_ref=...&hash=...
var grant = await client.ContinueGrantAsync(
    new AuthRequestArgs
    {
        Url = pending.Continue.Uri,
        AccessToken = pending.Continue.AccessToken.Value
    },
    new GrantContinueBody { InteractRef = interactRef }
);

var payment = await client.CreateOutgoingPaymentAsync(
    new AuthRequestArgs { Url = customerWallet.ResourceServer, AccessToken = grant.AccessToken!.Value },
    new OutgoingPaymentBodyFromQuote
    {
        WalletAddress = customerWallet.Id,
        QuoteId = quote.Id
    }
);
```

The SDK doesn't verify the `hash` parameter against your nonce. GNAP says you should, so that's your code to write. Call continue too early and you get `too_fast` back instead of a token, which is what `Continue.Wait` is for.

The rest of GNAP is in there too: grant cancellation, token rotation and revocation.

## Design notes

NSwag gets you a client out of the specs. Everything below is what we had to add on top of it.

### Making illegal states unrepresentable

A quote is created with `debitAmount` xor `receiveAmount`, unless the receiver is an incoming payment that already carries an amount, in which case you send neither. In the specification that's one sentence of prose. The obvious C# translation is one class with two nullable properties and a runtime check. Then the first you hear about a mistake is a rejection from the auth server.

Instead there are three types, `QuoteBody`, `QuoteBodyWithDebitAmount` and `QuoteBodyWithReceiveAmount`, with an overload of `CreateQuoteAsync` for each. You can't construct an object carrying both, so the case never reaches a server. Outgoing payments got the same treatment with `OutgoingPaymentBodyFromQuote` and `OutgoingPaymentBodyFromIncomingPayment`, and GNAP access items got it too. `IncomingAccess`, `OutgoingAccess` and `QuoteAccess` each pin their own `type` and tighten what's required for that flavour. Which is why `OutgoingAccess` above demands an `Identifier` and the incoming one didn't.

We fix the naming here too. NSwag names types after the shape it finds in the spec and hands you `Body2`, `Response2` and `Anonymous`. A small `Types.cs` per namespace renames those and adds the docs the generator can't express. All of it is `partial` types and inheritance rather than a post-processing script. Regenerating against a new spec release leaves it alone.

### Where the spec and real servers disagree

The generator turns every `required` in the spec into `Required.Always`, and Newtonsoft then throws when a field is missing. Real wallets don't always send every field the spec marks required, and we'd rather not throw on a payment that already went through. A custom `ContractResolver` relaxes `Required.Always` to `Required.Default` and drops nulls on the way out. We stayed on Newtonsoft for that resolver: it's a small hook to write there, and a bigger one in System.Text.Json.

`metadata` has to be `object?` because the spec allows an arbitrary JSON object, and we re-declare it with `NullValueHandling.Ignore` on every type that carries it, to keep a create from shipping `"metadata": null`.

`Amount` is defined in both the auth spec and the resource spec, so it generates twice into two namespaces. The interactive grant snippet above copies three fields out of `quote.DebitAmount` into an `AuthAmount` instead of just passing it, and the guides carry a `using AuthAmount = OpenPayments.Sdk.Generated.Auth.Amount;` alias to keep the two straight. The seam is still visible and we don't love it, though the alias is cheaper than hand-mapping the type.

### There is no base URL

A generated client assumes a base address you configure at startup. Here, resources are identified by full URLs you only discover at runtime, and one payment touches two wallets on different hosts. The base address is whatever the last response handed you. So every method takes the URL it should hit as part of `RequestArgs`, and the SDK assigns it to the generated client's `BaseUrl` just before the call goes out.

### Signing

Every authenticated request carries an Ed25519 signature over an RFC 9421 signature base. For a POST with a body it looks like this:

```
"@method": POST
"@target-uri": https://auth.interledger-test.dev/
"content-digest": sha-512=:0Xq9J...==:
"content-length": 271
"content-type": application/json
"@signature-params": ("@method" "@target-uri" "content-digest" "content-length" "content-type");created=1745000000;keyid="my-key";alg="ed25519"
```

Add an `authorization` line after `@target-uri` when there's a token, and drop the three content lines for a request with no body. The signature covers every byte of that. Get one wrong and the server says 401 without telling you which.

If you're staring at one of those, check the digest algorithm (sha-512, not the sha-256 you'd guess), the method case, a `@target-uri` that dropped its query string, and a `content-length` that disagrees with the bytes you sent. Because signing happens in `PrepareRequest` on the generated client, a breakpoint there shows you the request as it goes out.

Computing that digest means reading the request body. That's async, while the generated pre-send hook is synchronous. Today we block on the async signer inside `PrepareRequest`, which is ugly. Moving it into a delegating `HttpMessageHandler` is on the list.

## Known limits

### Concurrent calls to different hosts can race

Of everything here, this is what we'd change first. `BaseUrl` is a mutable field on a generated client that lives inside a singleton, so two calls to two different resource servers can interleave between the assignment and the send, and one of them goes to the wrong host. It affects every resource call and grant creation, though not continue, cancel or rotate, which pass full URLs. Until it's fixed: if your app fans out across wallets concurrently, serialise the calls behind a semaphore, or build a separate `ServiceProvider` per host. The second one is more annoying than it should be, since `AuthenticatedClient` is internal and you can't just new one up.

### Your private key sits in process memory

`OpenPaymentsOptions.PrivateKey` takes an NSec `Key` and `HttpRequestSigner` is static, which leaves a KMS or an HSM nowhere to hook in. If your threat model needs the key never to be in the process, this SDK doesn't fit yet.

### No retry or idempotency helpers

Open Payments has no idempotency key, and the SDK adds nothing on top. A timed-out `CreateOutgoingPaymentAsync` is a judgement call you make. `GetOutgoingPaymentAsync` and `ListOutgoingPaymentsAsync` are there to reconcile with. There's no polling helper either, and nothing we've verified against a live wallet, so we're not going to invent a recipe.

### No auto-paging

`ListIncomingPaymentsAsync` hands back one cursor page. Write the loop yourself.

### `ApiException` is per namespace

Server errors surface as `ApiException<ErrorResponse>` carrying the status code, the raw response and the deserialised body. Auth failures come back with GNAP codes like `invalid_client`, `request_denied` and `too_fast`, so you can tell rate limiting from a rejected grant without matching on message strings. The catch is that the auth and resource variants are technically different types: one catch clause won't cover both.

### Inbound signature validation is unfinished

`Interledger.OpenPayments.HttpSignatureUtils` ships a validator for checking signatures on requests to your own server, and it has no tests. We've since found that it builds the signature base differently from the signer. Don't rely on it until that's fixed.

## What's solid

We care most about the wire format, and that's what the tests cover. Since there's no free-standing wallet to point a suite at, they mock `HttpMessageHandler` and assert on the exact request that would have gone out.

All eight guides on [openpayments.dev](https://openpayments.dev/) now have .NET examples, the one-time e-commerce checkout and the recurring remittances among them, and they live in the repo as compiled C# in `OpenPayments.Snippets`. They never touch a live server, but they do have to build, so if we rename a model or a method the build breaks before the docs do.

NSwag generates the models from the [official OpenAPI specifications](https://github.com/interledger/open-payments), with a git submodule pinning the version. The typed surface follows the spec itself rather than our reading of it.

## What's next

Roughly in the order we'd tackle them:

- Pass the base URI per call instead of assigning `BaseUrl` on a shared client. It means threading the URI through every generated method and writing a test that hammers one client across several hosts in parallel to prove where each request went. Without that test we'd just be moving the race somewhere we can't see it.

- Move signing into a delegating `HttpMessageHandler`. That kills the blocking `.Result` and gets the signing logic out of a generated file.

- Fix the validator, with round-trip tests against the signer.

- Unify `ApiException`, `Amount` and the contract resolvers at the SDK level rather than per namespace.

- Multi-target net8.0. Good first issue if you want one.

- Pick up spec releases deliberately. We regenerate models by hand today, so a release can drift silently until someone runs `make models`. A CI job that regenerates against the pinned spec and fails if the committed output differs would catch it.

- Auto-paging, as an `IAsyncEnumerable` wrapper over the cursor.

## Get involved

- `dotnet add package Interledger.OpenPayments`
- Source: [github.com/interledger/open-payments-dotnet](https://github.com/interledger/open-payments-dotnet)
- Docs: [openpayments.dev](https://openpayments.dev/), starting with [before you begin](https://openpayments.dev/sdk/before-you-begin/)
- Catchup calls: every other Wednesday at 13:00 GMT ([Google Meet](https://meet.google.com/htd-eefo-ovn))
- [Contribution guidelines](https://github.com/interledger/open-payments-dotnet/blob/main/.github/contributing.md)

It's v1, so there are rough edges we haven't listed. [Open an issue](https://github.com/interledger/open-payments-dotnet/issues) if you hit one.
