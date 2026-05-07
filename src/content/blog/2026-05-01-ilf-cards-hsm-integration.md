---
title: 'Double down on Security: What is mine is mine'
description: 'A Journey from POS Onboarding to Transaction Processing.'
date: 2026-05-01
slug: ilf-and-hsms
authors:
  - Jason Bruwer
author_urls:
  - https://github.com/koekiebox
  - https://www.linkedin.com/in/jason-bruwer-8110766/
tags:
  - Interledger Protocol
  - Card Payments
  - Rafiki
  - Updates
  - HSM
---

HSMs sit at the heart of modern payment security - trusted, hardened, and responsible for protecting the cryptographic keys that financial systems rely on. Our next exploration asks a pivotal question: how do HSMs fit into the world of payments, and how can they complement Rafiki and Interledger-based architectures without weakening the trust model that regulated financial infrastructure demands?

Please read the [Rafiki Card Integration BLOG](https://interledger.org/developers/blog/rafiki-card-integration/) for background on Rafiki Card Payments if you haven't already.

![ILF + Cards](/developers/img/blog/2026-05-01/hsm.png)

[Rafiki](https://rafiki.dev/) is an open-source platform that enables Account Servicing Entities (ASEs) like banks and digital wallet providers to integrate [Interledger Protocol](/developers/get-started) (ILP) functionality into their systems.


## Table of Contents

1. [Card Payments Using Rafiki and ILP](#card-payments-using-rafiki-and-ilp)
2. [Exploring a Path from EMV Cards to Interledger](#exploring-a-path-from-emv-cards-to-interledger)
3. [Starting Point: Should you build a Kernel](#starting-point-should-you-build-a-kernel)
4. ['Hello World' for POS (Point of Sale): How Does a POS device become "Known"?](#hello-world-for-pos-point-of-sale-how-does-a-pos-device-become-known)
5. [The Transaction Moment](#the-transaction-moment)
6. [Conclusion, Where This Leaves Us](#conclusion-where-this-leaves-us)
7. [What is next for ILF and Cards?](#what-is-next-for-ilf-and-cards)
8. [References](#references)
9. [Glossary of Terms](#glossary-of-terms)



## Why Hardware Security Modules Matter in Payments and How They Relate to Rafiki
Card payments, digital-wallets, and modern financial APIs all depend on one thing that users rarely see: **trust**. 
Not just trust in the institution, or the network, or the device - but trust in the cryptography that protects identities, keys, approvals, and movement of value.

That **trust** does not happen by accident. It is established through carefully managed cryptographic boundaries, clear ownership of keys, and systems that are designed to avoid exposing secrets where they do not belong. In payment environments especially, this becomes a foundational concern.
This is where Hardware Security Modules, or HSMs, come in.


In our earlier exploration of card payments and Rafiki, a recurring theme emerged: trust is defined as much by key management as by APIs. We looked at POS onboarding, remote key injection, device identity, and separation between payment cryptography and ILP-facing services. 
HSMs sit naturally inside that discussion because they are one of the primary ways financial systems generate, protect, and use sensitive cryptographic material securely.

This post explores what HSMs are, why they matter, why they are so important in payments, and how they can be relevant in architectures that use Rafiki and the Interledger Foundation's broader ecosystem.

## What Is an HSM?
An HSM is a specialized cryptographic device, or in some cases a tightly controlled managed service, designed to generate, store, protect, and use cryptographic keys without exposing those keys in clear form to general-purpose application environments.

At a high level, an HSM acts as a hardened trust anchor. Rather than allowing sensitive keys to live in application memory, configuration files, or developer-managed infrastructure, the HSM keeps those keys within a controlled boundary and performs sensitive operations on behalf of other systems.

In practical terms, this means an application might ask an HSM to do things like:

* Generate a symmetric or asymmetric key
* Encrypt or decrypt data
* Sign or verify a message
* Wrap one key under another
* Derive transaction keys
* Rotate or retire cryptographic material

The important detail is that the application may use the key, but it should not need to "see" the key in the clear. **That distinction matters enormously**.

If a normal server is compromised, secrets stored in memory or on disk are often at risk. An HSM is specifically designed to reduce that risk by creating a separate, hardened environment for cryptographic operations. 
In regulated environments, it also helps enforce policies around who can perform which operations, how keys are imported or exported, and what kinds of usage are allowed.

So while it is tempting to think of an HSM as "just a box that stores keys", that is too narrow. An HSM is better understood as a controlled boundary for trust.

## Why Do We Need an HSM?
If all we needed was encryption, software libraries would often be enough. 
Modern cryptographic libraries are powerful, well-tested, and widely available. 
But in financial systems, the question is not only whether encryption is possible. 
The question is whether sensitive keys can be protected, governed, audited, and used in a way that satisfies both operational reality and security expectations.

**THAT!** is why HSMs exist.

### Protecting the most sensitive secrets
Some keys are simply too important to leave lying around in ordinary infrastructure. Master keys, signing keys, derivation keys, CA keys, and keys used to protect customer or transaction data are often considered "crown jewel material". 
If they are exposed, the damage is not limited to one request or one environment. Entire trust chains can be broken.

An HSM reduces that exposure by ensuring such keys are generated and used within a much more controlled environment.

### Separating duties and trust boundaries
In real systems, not every service should have equal access to secrets. A payment API may need to request an operation, but it should not be free to extract every key. 
An operations team may need to deploy services, but they should not automatically gain access to master key material. Security teams may need oversight without manually touching every transaction.

HSMs help enforce these boundaries by moving sensitive operations into a dedicated trust domain.

### Supporting auditability and compliance
In financial environments, "secure enough" is rarely a vague engineering judgment. There are standards, audits, certifications, and contractual expectations. 
Institutions need to show not just that encryption exists, but that key handling follows controlled processes. HSMs support this by providing stronger operational controls, usage policies, dual-control workflows in some deployments, and audit trails around key management.

### Reducing blast radius
Even strong applications can have bugs. Even well-managed servers can be compromised. One of the key advantages of an HSM is that it reduces the blast radius when other parts of the environment go wrong. A service might be able to submit a signing request, but not exfiltrate the long-term signing key. A workflow might be able to request a wrapped transaction key, but not obtain the master key used to derive it.

That difference can be the line between an incident that is contained and one that becomes systemic.

## Why Are HSMs Critical in Payments?
HSMs are relevant in many industries, but payments are one of the clearest examples of where they become indispensable.

This is because payment systems are full of high-value cryptographic operations. They do not just protect data at rest or in transit. 
They establish trust between issuers, acquirers, terminals, processors, payment applications, cards, and backend services.

### Payments are built on key hierarchies
Card payments rely on structured key hierarchies and tightly defined cryptographic processes. 
There are issuer-side keys, terminal-side keys, transport keys, PIN-related keys, transaction keys, derivation keys, and keys used for encryption, MACing, or signing.

These are not casual secrets. They define whether one party can trust the output of another.

A terminal proving it is authorized, a backend validating a secure request, a system rotating injected keys, or an institution protecting card-related cryptographic material - *all of these depend on keys being handled properly*.

### Sensitive operations must happen in controlled boundaries
In payment environments, certain operations are expected to take place inside hardened cryptographic boundaries. That can include:

* Generating and protecting master keys
* Deriving transaction keys
* Wrapping keys for injection into devices
* Encrypting or translating PIN-related material
* Supporting issuer or acquirer cryptographic functions
* Protecting certificate authority or signing keys used in trust establishment

The point is not that every payment message touches an HSM directly. The point is that the security of the ecosystem depends on HSM-protected trust anchors somewhere in the chain.

### Compliance and ecosystem expectations
Payments are also heavily shaped by ecosystem expectations. Networks, processors, regulators, and security frameworks often assume or require strong controls around key management. 
In practice, that makes HSMs a natural fit wherever high-value payment cryptography is involved.

Even when a modern architecture is API-driven, cloud-native, or ILP-enabled, it does not escape the basic rule: **if sensitive payment keys are involved, they need strong controls**.

### HSMs help payments scale without weakening trust
A small prototype can often get away with simpler assumptions. Real payment systems cannot. Once you have many merchants, devices, cards, key versions, rotation schedules, signing flows, and operational teams, trust has to scale. HSMs help make that possible because they allow large systems to centralize sensitive cryptographic control without pushing raw secrets into every application or device.

## How Could the ILF Make Use of HSMs?
The Interledger Foundation is not trying to turn Rafiki into a traditional card switch or an EMV kernel. 
That was already an important conclusion in the earlier card-payment exploration: do not rebuild the kernel, and do not fight the established trust model of payments. 
Instead, build around it with clear interfaces, focused services, and sound cryptographic boundaries.

That makes HSMs highly relevant, not because Rafiki itself must become an HSM-centric product, but because HSMs can support the secure boundaries around systems that integrate payment-originated trust flows with ILP-based infrastructure.

### 1. POS onboarding and device trust
One of the clearest areas is device onboarding.

In the earlier architecture discussion, the POS becomes "known" through a trust ceremony: it generates a key pair, sends a CSR with metadata, and the ASE signs it through its CA while also issuing device-related cryptographic material. 
That onboarding process is fundamentally about establishing trusted identity.

An HSM can play a central role here by protecting the CA or signing keys used for device certificates, terminal identities, or platform-issued credentials. 
That means:
* The signing keys remain inside a hardened boundary
* Certificate issuance is controlled and auditable
* Compromise of a general-purpose backend does not automatically expose long-term identity keys

If a future ILF-enabled deployment wants to onboard terminals, edge devices, or institution-controlled connectors with stronger assurance, HSM-backed signing is a natural design choice.

### 2. Key lifecycle management and remote key injection
Another strong fit is key lifecycle management. The earlier draft highlighted an ASE-side service dedicated to key lifecycle management rather than payment processing or EMV logic. 
That service authenticates requests from the POS, derives new keys, wraps them, and sends them back securely for storage in the appropriate secure domain.

That kind of model fits extremely well with HSM-backed operations. An HSM can be used to:
* Generate or derive terminal-related keys
* Protect the master material used in derivation
* Wrap keys for secure transport
* Support controlled rotation schedules
* Ensure the clear key is never exposed to the surrounding service

**This is especially relevant when remote key injection or key rotation must happen regularly and consistently across many devices.**

### 3. Protecting ASE-side ILP signing keys
The earlier architecture also described a separation between transaction keys used in the payment domain and network or ILP-facing keys used outside the kernel's SDK. 
That separation is important because it keeps payment cryptography and network-facing trust from becoming blurred together.

**HSMs can reinforce that boundary.** If an ASE is using Rafiki and also signing sensitive backend requests, authorizations, platform credentials, or high-assurance service-to-service messages, 
those signing keys do not need to live in ordinary software keystores. They can be generated and used through an HSM-backed service.

That provides stronger control over:

* Which services may request signing
* How key usage is restricted
* How rotations are managed
* How audit evidence is produced


### 4. Supporting trust in regulated financial environments
Rafiki is powerful because it enables interoperable value movement through open standards. 
But when Rafiki is deployed inside real financial institutions, it often has to coexist with regulated infrastructure, institutional controls, and long-established payment trust models.

In those environments, HSMs act as a bridge between modern API platforms and traditional financial security expectations.

That does not mean Rafiki itself becomes "a payment HSM system." It means Rafiki can exist alongside HSM-backed services that protect the trust anchors around it. For example:

* A bank or wallet provider may use HSM-backed key management for onboarding devices
* A payment-adjacent flow may use HSM-backed signing or encryption for high-value requests
* A backend integrating card-originated trust flows into ILP may rely on HSM-controlled issuance and lifecycle operations

In that sense, HSMs are relevant not only to payments in general, but to the practical adoption of interoperable platforms like Rafiki within mature financial ecosystems.

### 5. Preserving architectural clarity
One of the most useful lessons from the earlier card-payment exploration was that small, focused services are easier to reason about than monoliths, and that trust boundaries matter at least as much as application features.
**HSMs fit that lesson well.**

Used properly, they help keep responsibilities clear:
* 
* The kernel performs payment cryptography in its own domain
* The secure device boundary protects local transaction keys
* The ASE controls identity, onboarding, and lifecycle policies
* HSM-backed services protect long-term high-value keys
* Rafiki focuses on payment orchestration, Open Payments semantics, and lifecycle management

That division is healthy. It keeps each layer understandable and reduces the temptation to push too much trust into the wrong place.

### 6. HSMs Are Not the Whole Story
It is worth stating clearly that HSMs are not magic. They do not automatically make an architecture secure. Poor policies, weak service design, bad access control, and confused trust boundaries can still undermine a system even if an HSM is present.

But in serious financial systems, HSMs often represent the difference between "we do cryptography" and "we operate a defensible cryptographic trust model."
That distinction becomes increasingly important as systems connect more parties, more devices, and more forms of value movement.

For ILF-related architectures, especially where Rafiki meets regulated institutions, cards, secure devices, or payment-adjacent flows, HSMs provide a practical way to anchor trust without forcing the whole system to become a legacy payments stack.
They let the ecosystem evolve without abandoning the controls that financial infrastructure depends on.

## Conclusion
HSMs matter because keys matter. They protect the most sensitive cryptographic material in a system, provide controlled boundaries for critical operations, 
support auditability and compliance, and help financial architectures scale without scattering secrets across application layers.

In payments, their role is even more pronounced. Payment ecosystems are built on trust chains, key hierarchies, and tightly controlled cryptographic processes. 
HSMs help enforce those foundations.


And in architectures involving Rafiki and the broader work of the Interledger Foundation, HSMs can play an important supporting role. 
Not by replacing what Rafiki already does well, but by strengthening the trust boundaries around onboarding, signing, key lifecycle management, and institutional integration.
**That is perhaps the most important takeaway.**

Rafiki enables interoperability. HSMs protect trust. In financial systems, those two concerns are not separate - they are complementary.














`--------------------------------------------------------------------------------`



## Card Payments Using Rafiki and ILP

At a high level, an ILP card transaction involves:

1. Card (ICC) - EMV-compliant card with an [Open Payments](https://openpayments.dev/) enabled wallet address
2. POS Device - EMV kernel + ILP extensions
3. Merchant ASE - Runs Rafiki and manages POS trust (RKI, IPEK lifecycle, compliance)
4. Customer ASE - Runs Rafiki and manages the cardholder account
5. Interledger Network - Routes value between ASEs

## Exploring a Path from EMV Cards to Interledger

Card payments are everywhere. They are trusted, heavily regulated, and backed by decades of operational experience. At the same time, they are often locked into closed networks and bespoke integrations.

What we have been exploring is a simple question:
_What if card payments could naturally flow into Interledger without breaking EMV_, without replacing kernels, and without weakening the security model everyone already relies on?
This post is a walkthrough of that exploration - not a final specification, but a journey through the design decisions, trade-offs, and the emerging shape of an ILP-enabled card flow built around Rafiki, existing EMV kernels, and a small set of new supporting services.

## Starting Point: Should you build a Kernel?

In the world of card payments, a **kernel** is the core software component within a POS terminal that manages the complex interaction between the payment card (the chip) and the terminal. It handles the EMV protocol logic, data-exchange, and cryptographic processing required to authorize a transaction.
Essentially, it is the "brain" that knows how to speak "chip card" securely and according to global standards.

With the kernel being the “brain” of the POS, it quickly became clear that our first major design decision would revolve around which kernel approach to build on.
The earliest and most important decisions came out of conversations with our first POS (Point of Sale) manufacturing partner, who provides both the EMV kernel and a significant portion of the overall payment software stack running on the device.
Because ILF's first objective is to enable SoftPOS, we needed to choose between two approaches:

- developing a completely new EMV kernel based on the latest EMVCo C8 specifications,
- or leveraging the existing certified kernel already embedded in the payment stack (C2).

After evaluating the options, it became clear that reusing the existing kernel was the most practical and lowest-risk path to delivering SoftPOS quickly and reliably.

#### The C8 certification path would have meant

- Brand new certification cycles
- Repeated scheme testing (Visa/Mastercard/etc.)
- Long iteration loops with labs
- Reviewing of the hardware and software stack

#### The C2 path means

- Existing correct EMV processing
- Secure PIN entry / PAN handling out-of-the box
- Already scheme compliant

Exploring was very clear:

- Use the C2 kernel
- Stay as close as possible to EMVCo documentation
- Avoid clever reinterpretations of kernel behavior

C2, while perhaps less feature-rich than newer kernels, is predictable, explicit, and specification-aligned. That predictability turned out to be far more valuable than flexibility.

The immediate consequence of this choice was important: ILF does not need to develop an EMV kernel.

Instead of re-implementing deeply complex, certification-heavy logic, we could focus on:

- APIs
- Cryptographic boundaries
- ILP and Open Payments integration
- Device onboarding
- Merchant management
- Remote key injection (RKI) and key rotation

That framing shaped everything that followed.

## 'Hello World' for POS (Point of Sale): How Does a POS device become "Known"?

Before a POS can send payments into Interledger, it needs an identity. Not only a "vague" merchant identity, but a cryptographically verifiable device identity.
This led us to the first building block: POS onboarding.

### POS Onboarding as a Trust Ceremony

Rather than treating onboarding as a provisioning script, we started thinking of it as a ceremony:

- The POS proves who it is (serial number, model)
- The ASE decides whether to trust it
- Cryptographic material is issued with clear ownership

#### Onboarding

The rough onboarding flow regarding keys looks like this:

1. The POS generates a key pair locally and sends a CSR, along with device metadata, to the ASE
2. The ASE signs the CSR via its CA
3. The ASE generates the IPEK (Initial PIN Encryption Key) for SRED/PIN (Secure Reading and Exchange of Data / Personal Identification Number)
4. The ASE updates the terminal information to its database
5. The ASE returns the signed certificate and IPEKs (TR-34) to the POS
6. All keys are returned securely to the POS for storage

![ILP Cards, POS Key Onboarding](/developers/img/blog/2025-12-31/onboarding.png)

##### From this point on:

- The POS can authenticate itself
- The ASE can verify which device is speaking
- Every future request can be cryptographically tied back to onboarding

This turned out to be a crucial foundation, not just for transactions, but for everything else.

### Then Reality Kicks In: Keys Don't Live Forever

Once we started thinking seriously about certification (for example, MPOC), a practical requirement surfaced very quickly: _Encryption keys must be rotated regularly (at least monthly)!_ This is where things get interesting.

The POS is already running:

- POS Manufacturer bespoke software (Android / Symbian / iOS / Windows Phone)
- POS kernel
- POS WhiteBox (secure software-based storage and execution environment for a POS device)

And the POS Manufacturer already has strong opinions (for good reasons) about:

- Where transaction keys live
- How PIN and PAN encryption happens
- What software is allowed to see those keys

So rather than fighting that model, we leaned into it. A Crucial Piece Emerges: _Remote Key Injection (RKI) and Key Rotation!_ Instead of pushing key management into the kernel or POS logic, we introduced a new ASE-side service whose sole responsibility is key lifecycle management.
Not payment processing. Not EMV logic. Just keys.

#### Key Rotation as a First-Class Flow

The key rotation (IPEK) flow looks like this:

1. The POS requests a new set of IPEK keys from the ASE (via the POS API)
2. The POS is cryptographically verified to ensure the request can be trusted
3. A new IPEK is generated and stored at the ASE
4. The new keys are securely returned to the POS (TR-34)
5. The POS replaces the old keys in its secure storage with the new ones

![ILP Cards, POS Key Rotation](/developers/img/blog/2025-12-31/rotation.png)

##### In this model:

- The POS periodically asks the ASE for a new key
- The request is authenticated using the POS identity established during onboarding
- The ASE derives a new IPEK inside an HSM
- The key is wrapped (TR-34) and sent back
- POS Manufacturer stores it inside the POS secure WhiteBox

A subtle but important decision here:

- POS TMK (Terminal Master Key) is generated and injected during POS manufacturing
- Transaction keys live inside the WhiteBox
- Network / ILP keys live outside the POS SDK, in the device keystore

This clean separation keeps:

- Payment cryptography in the kernels domain
- ILP signing firmly under ASE control

At this point, the architecture started to feel "right".

## Cards Enter the Picture

With POS EMV kernel, onboarding, and key rotation in place, cards themselves become almost... boring. And that is a good thing!

Card personalization follows standard EMV practice:

- Card keys are generated by the issuer (Customer ASE)
- A wallet address is bound to the card
- The private key lives securely on the chip

From an ILP perspective, the card is simply:

- A secure signing device
- A holder of a wallet address
- A producer of cryptographic proof during transactions

No special casing. No new assumptions.

## The Transaction Moment

When a card is presented, everything up to this point has been preparation.

Now the familiar EMV flow kicks in:

```
SELECT AID
GET PROCESSING OPTIONS
READ RECORD
GENERATE AC
Optional PIN verification (Online)
```

All sensitive operations happen:

- Inside the kernel
- Using session keys derived from the current IPEK
- With data protected by the WhiteBox

NB: Nothing ILP-specific leaks into this phase, by design.

### Crossing the Boundary: From EMV to ILP

Once the kernel has done its job, the POS shifts context. Now it is no longer "doing EMV", it is requesting a payment.
This is where the ILP terminal key issued during onboarding finally comes into play.

The POS:

1. Assembles transaction data
2. References the cards wallet address (Customer ASE)
3. Signs the request with its ILP key (Merchant ASE)
4. Sends it to the Customer and Merchant ASE

Importantly, we don't have the POS talk to Rafiki directly to authorize the transaction. Instead, we route everything through an ASE POS API:

Why?

- Authentication
- Policy enforcement
- Request normalization
- Future flexibility
- Certifications
- Key management

The ASE remains firmly in control. Rafiki does what it already does well. From here on, Rafiki is on familiar ground.

It:

- Creates incoming and outgoing payments (as well as processing the ILP payments)
- Applies Open Payments semantics
- Tracks lifecycle state
- Emits events
  The POS eventually gets a simple answer: `Approved`, `Declined` or `Failed`.

All the complexity stays on the backend, where it belongs.

### What We Learned Along the Way

A few themes kept repeating during this exploration:

- Do not fight EMV, work with it
- Do not overload the kernel, extend around it
- Keys define trust boundaries more than APIs do
- Small, focused services are easier to reason about than monoliths
- Interledger fits best when it is complementary, not dominant

## Conclusion, Where This Leaves Us

What is emerging is not a replacement for card payments, but an extension of them.

- Cards remain cards.
- Kernels remain kernels.
- ASEs remain accountable entities.

Interledger simply becomes the connective tissue that lets value move beyond traditional rails, securely, incrementally, and without forcing the ecosystem to start over.

## What is next for ILF and Cards?

- Further development of the Card applet for `C2` kernel support
- Further development of the Rafiki APIs to support the new POS/Card services
- New Merchant-API service to support ASEs with regards to:
    - Merchant onboarding
    - Terminal configuration and onboarding
    - Merchant management
    - Remote key injection (RKI)

## References

- _ADPU:_ https://en.wikipedia.org/wiki/Smart_card_application_protocol_data_unit
- _EMV C2 Specification:_ https://www.emvco.com/specifications/?search_bar_keywords=c-2
- _EMV C8 Specification:_ https://www.emvco.com/specifications/?search_bar_keywords=c-8
- _EMV C8 Specification:_ https://www.emvco.com/specifications/?search_bar_keywords=c-8

## Glossary of Terms

| Term          | Description                                                                                                                                                                                                   |
| ------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `AC`          | Application Cryptogram (generated during EMV processing, e.g., via "GENERATE AC")                                                                                                                             |
| `ADPU / APDU` | Application Protocol Data Unit (smart card command/response format; commonly spelled APDU)                                                                                                                    |
| `AID`         | Application Identifier (identifies an EMV application on a card; used in "SELECT AID")                                                                                                                        |
| `API`         | Application Programming Interface                                                                                                                                                                             |
| `ASE`         | Account Servicing Entity (e.g., a bank or wallet provider running/operating accounts and services)                                                                                                            |
| `CA`          | Certificate Authority (signs certificates/CSRs)                                                                                                                                                               |
| `CI`          | Continuous Integration (automated build/test pipeline)                                                                                                                                                        |
| `CSR`         | Certificate Signing Request                                                                                                                                                                                   |
| `C2 / C8`     | EMVCo kernel/specification “level” referenced in the article (e.g., choosing an existing certified kernel vs. a newer certification path). These refer specifically to EMV Contactless Kernel specifications. |
| `EMV`         | Card payment standard originally from Europay, Mastercard, Visa                                                                                                                                               |
| `EMVCo`       | The organization that maintains and publishes EMV specifications (EMV Cooperation)                                                                                                                            |
| `HMAC`        | Hash-based Message Authentication Code                                                                                                                                                                        |
| `HSM`         | Hardware Security Module (secure key generation/storage/crypto operations)                                                                                                                                    |
| `ICC`         | Integrated Circuit Card (chip card; in EMV contexts, the card itself)                                                                                                                                         |
| `ILP`         | Interledger Protocol                                                                                                                                                                                          |
| `IPEK`        | Initial PIN Encryption Key                                                                                                                                                                                    |
| `JSON`        | JavaScript Object Notation                                                                                                                                                                                    |
| `MPOC`        | Mobile Payments on COTS (COTS = Commercial Off-The-Shelf; a payments/security certification context)                                                                                                          |
| `PAN`         | Primary Account Number (card number)                                                                                                                                                                          |
| `PIN`         | Personal Identification Number                                                                                                                                                                                |
| `POS`         | Point of Sale                                                                                                                                                                                                 |
| `RKI`         | Remote Key Injection                                                                                                                                                                                          |
| `SDK`         | Software Development Kit                                                                                                                                                                                      |
| `SoftPOS`     | Software Point of Sale (POS implemented primarily in software)                                                                                                                                                |
| `SRED`        | Secure Reading and Exchange of Data                                                                                                                                                                           |
| `TMK`         | Terminal Master Key                                                                                                                                                                                           |
| `TR-34`       | ANSI TR-34 key exchange / key block standard used for secure key distribution (often referenced in payments key injection)                                                                                    |
| `URL`         | Uniform Resource Locator                                                                                                                                                                                      |
