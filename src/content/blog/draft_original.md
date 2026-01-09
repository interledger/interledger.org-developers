# Card Payments Using Rafiki and ILP

At a high level, an ILP card transaction involves:
1.	Card (ICC) – EMV-compliant card with an ILP-linked wallet address
2.	POS Device – EMV kernel + ILP extensions
3.	Merchant ASE – Runs Rafiki and manages POS trust (RKI, IPEK lifecycle, compliance)
4.	Customer ASE – Runs Rafiki and manages the cardholder account
5.	Interledger Network – Routes value between ASEs




## Exploring a Path from EMV Cards to Interledger

Card payments are everywhere. They’re trusted, heavily regulated, and backed by decades of operational experience. At the same time, they’re often locked into closed networks and bespoke integrations.

What we’ve been exploring is a simple question:
- What if card payments could naturally flow into Interledger — without breaking EMV, without replacing kernels, and without weakening the security model everyone already relies on?
- This post is a walkthrough of that exploration. It’s not a final specification, but a journey through the design, the trade-offs, and the emerging shape of an ILP-enabled card flow built around Rafiki, existing EMV kernels, and a small set of new services.

## Starting Point: Should you build a a Kernel?

One of the earliest decisions came from conversations with our partner POS Manufacturer, who provide both the EMV kernel and much of the payment software stack on the POS.

Exploring was very clear:
- Use the C2 kernel (TODO backstory)
- Stay as close as possible to EMVCo documentation
- Avoid clever reinterpretations of kernel behavior

C2, while perhaps less feature-rich than newer kernels, is predictable, explicit, and specification-aligned. That predictability turned out to be far more valuable than flexibility.

The immediate consequence of this choice was important:
- ILF does not need to develop an EMV kernel.

Instead of re-implementing deeply complex, certification-heavy logic, we could focus on:
•	APIs
•	Cryptographic boundaries
•	ILP and Open Payments integration

That framing shaped everything that followed.

## 'Hello World' for POS : How Does a POS Become "Known"?

Before a POS can send payments into Interledger, it needs an identity. Not only a "vague" merchant identity, but a cryptographically verifiable device identity.
This led us to the first new building block: POS onboarding.

### POS Onboarding as a Trust Ceremony

Rather than treating onboarding as a provisioning script, we started thinking of it as a ceremony:
- The POS proves who it is (serial number, model)
- The ASE decides whether to trust it
- Cryptographic material is issued with clear ownership

The rough flow looks like this:
1.	The POS generates a key pair locally
2.	It sends a CSR, along with device metadata, to the ASE
3.	The ASE signs the CSR via its CA
4.	At the same time, the ASE creates an ILP terminal key
5.	Both are returned securely to the POS

From that point on:
•	The POS can authenticate itself
•	The ASE can verify which device is speaking
•	Every future request can be cryptographically tied back to onboarding

This turned out to be a crucial foundation — not just for transactions, but for everything else.

### Then Reality Kicks In: Keys Don’t Live Forever

Once we started thinking seriously about certification (for example MPOC), a practical requirement surfaced very quickly:

Encryption keys must be rotated regularly - often monthly.

This is where things get interesting.

The POS is already running:
- POS Manufacturer bespoke software (Andriod / Symbian / iOS  / Windows Phone)
- POS kernel
- POS WhiteBox secure storage

And the POS Manufacturer already has strong opinions (for good reasons) about:
- Where transaction keys live
- How PIN and PAN encryption happens
- What software is allowed to see those keys

So rather than fighting that model, we leaned into it.

A Crucial Piece Emerges: Remote Key Injection (RKI)!

Instead of pushing key management into the kernel or POS logic, we introduced a new ASE-side service whose sole responsibility is key lifecycle management.
Not payment processing. Not EMV logic. Just keys.

Key Rotation as a First-Class Flow

In this model:
- The POS periodically asks the ASE for a new key
- The request is authenticated using the POS identity established during onboarding
- The ASE derives a new IPEK inside an HSM
- The key is wrapped (TR-34) and sent back
- POS Manufacturer stores it inside the POS secure WhiteBox

A subtle but important decision here:
- POS TMK (Terminal Master Key) is generated and injected during POS manufacturing
- Transaction keys live inside the WhiteBox
- Network / ILP keys live outside the SDK, in the device keystore

This clean separation keeps:
- Payment cryptography in the kernel’s domain
- ILP signing firmly under ASE control

At this point, the architecture started to feel "right".

## Cards Enter the Picture
With POS EMV kernel, onboarding and key rotation in place, cards themselves become almost... boring. And that’s a good thing!

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
See ADPU: TODO

All sensitive operations happen:
- Inside the kernel
- Using session keys derived from the current IPEK
- With data protected by the WhiteBox

NB: Nothing ILP-specific leaks into this phase, by design.


### Crossing the Boundary: From EMV to ILP

Once the kernel has done its job, the POS shifts context. Now it’s no longer "doing EMV", it’s requesting a payment.
This is where the ILP terminal key issued during onboarding finally comes into play.

The POS:
- Assembles transaction data
- References the card's wallet address (Customer ASE)
- Signs the request with its ILP key (Merchant ASE)
- Sends it to the Customer and Merchant ASE

Importantly, we don't have the POS talk to Rafiki directly to authorize the transaction. Instead, we route everything through an ASE POS API:

Why?
- Authentication
- Policy enforcement
- Request normalization
- Future flexibility
- Certifications
- Key management

The ASE remains firmly in control. Rafiki Does What It Already Does Well. From here on, Rafiki is on familiar ground.

It:
- Creates incoming and outgoing payments
- Applies Open Payments semantics
- Tracks lifecycle state
- Emits events
The POS eventually gets a simple answer: `Approved`, `Declined` or `Failed`.

All the complexity stays on the backend, where it belongs.

### What We Learned Along the Way

A few themes kept repeating during this exploration:
- Don’t fight EMV — work with it
- Don’t overload the kernel — extend around it
- Keys define trust boundaries more than APIs do
- Small, focused services are easier to reason about than monoliths
- Interledger fits best when it’s complementary, not dominant

### Where This Leaves Us

What’s emerging isn’t a replacement for card payments, but an extension of them.

- Cards remain cards.
- Kernels remain kernels.
- ASEs remain accountable entities.

Interledger simply becomes the connective tissue that lets value move beyond traditional rails – securely, incrementally, and without forcing the ecosystem to start over.

