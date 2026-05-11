---
title: 'Signed, Sealed, Hardware Enforced: HSMs for Payment Trust'
description: 'How HSMs protect keys, enforce trust boundaries, and secure card payment flows with Rafiki and Interledger.'
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

HSMs sit at the heart of modern payment security. Trusted, hardened, and responsible for protecting the cryptographic keys that financial systems rely on. Our next exploration asks a pivotal question: how do HSMs fit into the world of payments, and how can they complement Rafiki and Interledger-based architectures without weakening the trust model that regulated financial infrastructure demands?

Please read the [Rafiki Card Integration BLOG](https://interledger.org/developers/blog/rafiki-card-integration/) for background on Rafiki Card Payments if you haven't already.

![ILF + Cards](/developers/img/blog/2026-05-01/hsm.png)

[Rafiki](https://rafiki.dev/) is an open-source platform that enables Account Servicing Entities (ASEs) like banks and digital wallet providers to integrate [Interledger Protocol](/developers/get-started) (ILP) functionality into their systems.


## Table of Contents

1. [Why Hardware Security Modules Matter in Payments and How They Relate to Rafiki](#why-hardware-security-modules-matter-in-payments-and-how-they-relate-to-rafiki)
2. [What Is an HSM?](#what-is-an-hsm)
3. [Why Do We Need an HSM?](#why-do-we-need-an-hsm)
4. [Why Are HSMs Critical in Payments?](#why-are-hsms-critical-in-payments)
5. [How Could the ILF Make Use of HSMs?](#how-could-the-ilf-make-use-of-hsms)
6. [Conclusion](#conclusion)
7. [References](#references)
8. [Glossary of Terms](#glossary-of-terms)



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

![Rafiki and HSM Key Protection Architecture](/developers/img/blog/2026-05-01/hsm-architecture.svg)

The Interledger Foundation is not trying to turn Rafiki into a traditional card switch or an EMV kernel.
That was already an important conclusion in the earlier card-payment exploration: do not rebuild the kernel, and do not fight the established trust model of payments.
Instead, build around it with clear interfaces, focused services, and sound cryptographic boundaries.

That makes HSMs highly relevant, not because Rafiki itself must become an HSM-centric product, but because HSMs can support the secure boundaries around systems that integrate payment-originated trust flows with ILP-based infrastructure.

### 1. POS onboarding and device trust
One of the clearest areas is device onboarding. In the earlier architecture discussion, the POS becomes "known" through a trust ceremony: it generates a key pair, sends a CSR with metadata, and the ASE signs it through its CA while also issuing device-related cryptographic material. 
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

That does not mean Rafiki itself becomes "a payment HSM system". It means Rafiki can exist alongside HSM-backed services that protect the trust anchors around it. For example:

* A bank or wallet provider may use HSM-backed key management for onboarding devices
* A payment-adjacent flow may use HSM-backed signing or encryption for high-value requests
* A backend integrating card-originated trust flows into ILP may rely on HSM-controlled issuance and lifecycle operations

In that sense, HSMs are relevant not only to payments in general, but to the practical adoption of interoperable platforms like Rafiki within mature financial ecosystems.

### 5. Preserving architectural clarity
One of the most useful lessons from the earlier card-payment exploration was that small, focused services are easier to reason about than monoliths, and that trust boundaries matter at least as much as application features.
**HSMs fit that lesson well.**

Used properly, they help keep responsibilities clear:

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

## References

- _Hardware Security Module (Wikipedia):_ https://en.wikipedia.org/wiki/Hardware_security_module
- _PCI PTS HSM Security Requirements v4.0 (PCI SSC):_ https://listings.pcisecuritystandards.org/documents/PCI_HSM_Security_Requirements_v4.pdf
- _FIPS 140-3 - Security Requirements for Cryptographic Modules (NIST):_ https://csrc.nist.gov/pubs/fips/140-3/final
- _ASC X9 TR 34-2019 - Symmetric Key Distribution Using Asymmetric Techniques (ANSI):_ https://webstore.ansi.org/standards/ascx9/ascx9tr342019
- _PKCS #11 Specification Version 3.1 (OASIS):_ https://www.oasis-open.org/standard/pkcs-11-specification-version-3-1/

## Glossary of Terms

| Term           | Description                                                                                                                                 |
|----------------|---------------------------------------------------------------------------------------------------------------------------------------------|
| `API`          | Application Programming Interface                                                                                                           |
| `ASE`          | Account Servicing Entity (e.g., a bank or wallet provider running/operating accounts and services)                                          |
| `CA`           | Certificate Authority (issues and signs certificates/CSRs to establish identity trust)                                                      |
| `CSR`          | Certificate Signing Request (sent to a CA to obtain a signed certificate)                                                                   |
| `Dual Control` | A security practice requiring two or more authorized individuals to perform a sensitive operation (e.g., key ceremony, master key loading)  |
| `EMV`          | Card payment standard originally from Europay, Mastercard, Visa                                                                             |
| `FIPS 140`     | U.S. federal standard defining cryptographic module security requirements; HSMs are commonly certified at FIPS 140-2 or 140-3 Level 3/4     |
| `HMAC`         | Hash-based Message Authentication Code (used to verify message integrity and authenticity)                                                  |
| `HSM`          | A hardened physical or managed-service device that generates, stores, and uses cryptographic keys without exposing them in the clear        |
| `ILP`          | Interledger Protocol                                                                                                                        |
| `IPEK`         | Initial PIN Encryption Key (a derived key injected into a terminal to protect PIN entry)                                                    |
| `Key Ceremony` | A formal, audited procedure for generating, loading, or retiring high-value cryptographic keys inside an HSM                                |
| `Key Wrapping` | Encrypting one key with another (the “wrapping key”) so it can be transported or stored without being exposed in the clear                  |
| `MAC`          | Message Authentication Code (a short value used to confirm data integrity and authenticity between parties)                                 |
| `PCI HSM`      | Payment Card Industry HSM Security Requirements, the standard governing HSMs used in payment environments                                   |
| `PIN`          | Personal Identification Number                                                                                                              |
| `PKCS#11`      | A platform-independent API standard (Cryptoki) used to communicate with cryptographic tokens and HSMs                                       |
| `POS`          | Point of Sale                                                                                                                               |
| `RKI`          | Remote Key Injection, the process of securely delivering cryptographic keys to a terminal over a network rather than physically             |
| `SDK`          | Software Development Kit                                                                                                                    |
| `TMK`          | Terminal Master Key (a key loaded into a POS terminal, often via RKI, used to derive session or transaction keys)                           |
| `TR-34`        | ANSI TR-34, a key block standard used for secure asymmetric key distribution in payment environments, commonly used in remote key injection |
| `Trust-Anchor` | A trusted key or certificate that forms the root of a trust chain; other certificates or identities derive their validity from it           |
