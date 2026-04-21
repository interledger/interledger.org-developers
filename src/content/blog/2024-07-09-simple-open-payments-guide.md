---
title: 'A Simple Guide to the Open Payments Standard'
description: Learn how the Open Payments standard makes online payments easier and more accessible for everyone.
date: 2024-07-09
slug: simple-open-payments-guide
lang: en
authors:
  - Sarah Jones
author_urls:
  - https://www.linkedin.com/in/sarah-jones-ba6bb6b9
tags:
  - Open Payments
---

## The Current Digital Payments Landscape

Handling payments is a crucial part of many online applications. Whether it's an eCommerce site selling products, a fundraising platform accepting donations, a streaming service charging for content, or a subscription service with monthly fees, digital payments are central to their operations.

Many application developers rely on third-party payment gateways to handle these transactions. Companies like PayPal, Stripe, and Square offer services to process credit card payments on behalf of the application. In return for these services, applications incur various fees, which can include monthly fees, flat rates per transaction, or a percentage of the transaction amounts. This approach, while convenient, introduces additional expenses and makes the application reliant on a third-party provider. This reliance can limit control over the user experience, such as forcing users to trust third-party providers with sensitive information like credit card details.

![Most applications' payment implementation today](/developers/img/blog/2024-06-20/credit-cards.png)

An alternative is for applications to integrate directly with their bank's payment processing services. This method can offer lower transaction fees and increase control over the payment process. However, it requires significant development effort and is not always possible. Additionally, switching to a different bank becomes very challenging due to the extensive integration work that was already completed.

This problem gets even more complicated when we consider situations where either the sender or the recipient of funds does not have a bank account. What if a payment has to take place between a bank and a mobile money provider? Now the application would have to also integrate with the mobile money provider. Custom integration becomes an expansive problem.

![Custom integrations are not scaleable](/developers/img/blog/2024-06-20/custom-integration.png)

What if there was a way for an application to access your account directly, and securely? Currently, even if you provide an application with your account details, it likely wouldn't be able to do much with them, even with your permission. As an account owner, shouldn't you have the power to decide who can access your account and what they can do with it?

## The Promise of the Open Payments Standard

Open Payments aims to change that by enabling applications to access users' accounts directly without needing multiple custom integrations. Standardization is key to eliminating these custom integrations. With a single integration point, applications can access any account that implements the standard, whether it's a bank account, a digital wallet, or a mobile money account. The only requirement is that both the sender's and recipient's account providers support the Open Payments standard.

![Open Payments allow applications to talk to accounting service entities directly](/developers/img/blog/2024-06-20/open-payments.png)

Consider how email works: if you have a Gmail account and someone else has an Outlook account, it doesn't matter because our email providers communicate using a shared, standardized language, allowing us to send emails seamlessly across providers. To send an email, you don't need to know the other person's email provider; you just need their email address.

This is how the Open Payments standard operates. Similar to an email address, if an account provider implements the Open Payments standard, they will provide you with a wallet address. This wallet address is human-readable (consisting of words instead of a long string of numbers) and publicly shareable (unlike your credit card number).

When you want to make a payment online, you simply provide the application with your wallet address. This wallet address is also a URL, allowing the application to make queries directly to the wallet address. The application can then access information about where to contact your account provider. Using the Open Payments standard, the application can send a request directly to your account, asking for the specified amount to be transferred from your account to the recipient's account.

As an open standard, Open Payments is free for anyone to use, ensuring seamless communication between applications and their user’s account providers, regardless of which financial institutions are involved. This direct communication means you're not incurring additional fees or delays.

The Open Payments protocol also aims to make transactions more transparent. Before committing to a payment, you understand how much the recipient is receiving and how much this payment costs you in transaction fees.

The Open Payments standard addresses key questions such as:

- Where should the money be sent, exactly? It provides a standardized way to identify and locate user accounts across different financial institutions.
- Do all all parties agree on the final amount after any fees are added to a transaction?
- What is the best underlying method to use for the transaction?

With the Open Payments standard, applications do not need to be registered financial service providers (FSPs) to facilitate transactions. Instead of moving or holding money, applications send payment obligations. This means they are not transferring money directly but are sending instructions to your financial institution to transfer the funds on your behalf. This setup eliminates the need for the application to be a financial service provider itself, even though it has direct communication access to your account. This is beneficial for applications because they don’t need to contend with the legal and compliance hurdles required to be a financial services provider. But it’s also advantageous for you because you don't need to share sensitive information with online applications. Applications storing information like credit card numbers and CVV codes always pose a risk of data leaks or hacking, even with the best intentions.

You might think, this sounds convenient, but is it secure? I don’t want just anyone pulling money out of my account!

## You Remain in Control

With the Open Payments standard, you remain in full control of your financial transactions. When an application uses Open Payments, it securely and cryptographically shares important information about itself with the financial institutions it interacts with. This verification ensures that the account provider knows the application is legitimate when making a payment request on your behalf.

Importantly, any withdrawal of money from your account requires your explicit consent. When you grant an application access to your account, you are not giving it unrestricted access. Instead, you control the access rights: the exact amount, the time frame, and whether it can access your transaction history or move funds. Open Payments also supports recurring payments, allowing you to define how often, for how long, and up to what amount an application can access your account. This granular control ensures that you are always aware of and consenting to the transactions made from your account.

## There Are Some Catches

For this system to work, both the sender and the recipient must have Open Payments-enabled accounts. This requirement poses an adoption hurdle, which the Interledger Foundation is actively addressing. We are dedicated to making adoption as seamless as possible for financial service providers (FSPs) and applications by providing extensive support and resources.

It's important to note that integrating Open Payments does not guarantee a shared settlement layer. A settlement layer in a payment system refers to the infrastructure and processes used to actually transfer the funds between parties to finalize transactions. This includes the mechanisms that ensure that money moves from the sender to the recipient and that all parties' accounts are accurately updated. It is the actual movement of your money out of your account and into someone else's. Open Payments is designed to enable different payment systems to communicate and transact with each other. However, at the end of the day, those systems also need to be connected in such a way that they can settle the movement of funds between accounts as well.

Many financial institutions already have established pathways and processes for moving money between accounts. The [Interledger Protocol](https://interledger.org/interledger) automates and optimizes how these institutions navigate this network. If you think of Open Payments as a way of sending payment obligations directly to the relevant account provider, then Interledger is about finding the best route through that exisiting network that allows funds to be transferred and payments to be completed. While Open Payments simplifies the initiation of payments, it doesn't guarantee that a route for completing those payments will always be found, potentially leading to failed transactions. However, as adoption of the standard grows, more people will gain access to an expanding and interconnected payments network, reducing the likelihood of payment failures.

While some fees, such as currency conversion and bank transaction fees, may still apply, Open Payments aims to eliminate unnecessary middleman fees, reducing overall transaction costs. However, it’s important to recognize that not all intermediaries are unnecessary. For example, currency conversion services are essential for transactions involving different currencies. Suppose your account provider only deals in Euros and mine only in Dollars. In that case, we might rely on an intermediary that handles both currencies to facilitate the transaction effectively.

Another scenario arises when the sender's and recipient's account providers are not directly connected by a shared settlement layer. In such cases, as long as there are one or more intermediaries that share a common settlement system with each institution, settlement can still occur via these intermediaries. For instance, if my bank deals in Dollars and cannot settle directly with your cryptocurrency wallet, there might be a digital wallet intermediary capable of settling between fiat and cryptocurrency. Thus, a shared settlement layer exists indirectly through intermediaries. The goal of the Interledger Protocol is to navigate the network of financial institutions and settlement systems to find the most efficient and cost-effective settlement paths. By leveraging these interconnected networks, Interledger aims to minimize costs and enhance reliability.

## What's Happening in the Open Payments Space Today?

Currently, the adoption of the Open Payments standard is still in progress. Some innovative institutions and services have begun to integrate this standard, but widespread use is still developing.

[GateHub](https://gatehub.net/) is a digital wallet provider working with the Open Payments standard globally. They facilitate some cross-currency transactions, although regulatory limitations may apply depending on the user's country of residence. [Chimoney](https://chimoney.io/) and [Fynbos](https://wallet.fynbos.app) digital wallets have also implemented Open Payments capabilities. Chimoney enables Open Payments transfers between Chimoney accounts, and Fynbos supports payments between Fynbos accounts. Fynbos is operational in America, Europe, and South Africa. However, their transactions are currently limited to wallets in the same region due to regulatory and technical constraints. Plans are underway to establish payment channels between Fynbos and GateHub users, beginning with Europe soon.

As well as having the first digital wallet providers that are Open Payments-enabled, we also have an application that runs Open Payments. [Interledger Pay](https://interledgerpay.com/) is a simplified payment platform that allows you to easily send or request money using your wallet address.

For most people, accessing an Open Payments-enabled account depends on their financial institutions adopting the standard. As more banks, digital wallets, and mobile money providers incorporate Open Payments, the benefits will become more widely accessible.

## What Are the Possibilities for Tomorrow?

A world with direct access to accounts through the Open Payments standard fosters innovation and inclusion by reducing barriers to entry for developers, who can create direct payment solutions more quickly and at a lower cost without the need for custom integrations. This democratization of development enables smaller companies and startups to compete and innovate.

Users are empowered to give applications direct access to their accounts. They can give access to who they want, to do what they want within set limits. Users also benefit from seamless transactions, transparency with regards to what fees they incur, and enhanced control over their financial data, improving trust and security. Financial inclusion is significantly increased by enabling access for those without traditional bank accounts, as well as cutting down on the costs of making payments by removing unnecessary intermediaries, and reducing the development effort of payment integrations.

## Try Open Payments Yourself

If you're curious about how the Open Payments standard works in practice, you can explore it by creating an account on the [Interledger Test Wallet](https://rafiki.money/). Upon account creation you'll be given a wallet address. This enables you to get hands on experience of simulating transactions using Open Payments. Once you're set up with your account, and have given yourself a generous amount of fictional money, you can embark on a shopping spree at the [Interledger Boutique](https://rafiki.boutique) and buy some delightful products ranging from luck to kindness.

## Key Takeaways

Standardization enhances interoperability by reducing the development effort required for each integration. This alone brings down costs while providing a scalable and efficient solution for handling digital payments. When interoperability is easy, there is no need for unnecessary middlemen and the fees they add to the cost of transactions.

With Open Payments, users are empowered to give applications direct access to their accounts, deciding who can access their money, how much, and how often. Users only share public information (in the form of wallet addresses) with applications when making payments, keeping their sensitive financial data private.

Applications can handle payments without needing to be registered financial service providers or navigating the risks involved in handling sensitive information like credit card numbers.
