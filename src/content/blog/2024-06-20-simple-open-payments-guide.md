---
layout: ../../layouts/BlogLayout.astro
title: " A Simple Guide to the Open Payments Standard"
description: Learn how the Open Payments standard makes online payments easier and more accessible for everyone.
slug: simple-open-payments-guide
author: Sarah Jones
author_url: https://www.linkedin.com/in/sarah-jones-ba6bb6b9
tags:
  - Interledger
  - Open Payments
---

# The Open Payments Standard: A Non-Technical Walkthrough

## The Current Digital Payments Landscape

Handling payments is a crucial part of many online applications. Digital payments are involved whether there’s an eCommerce site that sells shoes online, a fundraising platform that accepts donations, a streaming service that allows you to pay for the content you access, or a subscription service that requires a monthly fee.

A common solution for application developers is to use a third-party payment gateway. Companies like PayPal, Stripe, and Square offer services to process credit card payments on behalf of the application. In return for these services, the application may incur a combination of monthly fees, flat rates per transaction, or a percentage of the transaction amounts. However, this approach not only introduces additional expenses but also makes the application reliant on a third-party provider, potentially limiting control over the user experience. For instance, users must trust the third-party provider with sensitive information like credit card details, and developers have no control over any reliability issues that may arise with the provider.

Another option is for applications to integrate directly with their bank's payment processing services. This approach can offer lower transaction fees and greater control over the payment process. However, it requires significant development effort and is not always even possible. Additionally, once an application has invested considerable resources in integrating with a specific bank, switching to a different bank becomes very challenging due to the extensive setup work already completed.

This problem gets even more complicated when we consider situations where either the sender or the recipient of funds does not have a bank account. What if a payment has to take place between a bank and a mobile money provider? Now the application would have to also integrate with the mobile money provider. Custom integration becomes an expansive problem.

But what if there was a way for the application to access your account directly? Currently, even if I provide an application with my account details, they likely wouldn't be able to do much with it, even with my permission. As an account owner, shouldn't I have the power to decide who can access my account and what they can do with it?

## The Promise of the Open Payments Standard

Open Payments wants to change that by giving applications direct access into users accounts. Without the need for multiple custom integrations. Standardization is the key to eliminating custom integrations. With a single integration point, applications can access any account that implements the standard, whether it's a bank account, a digital wallet, or a mobile money account. The only requirement is that both the sender's and recipient's account providers support the Open Payments standard. You're probably already familiar with other standards, like those we have in place for email. If I have a Gmail account and you have an Outlook account, it doesn't matter because our email providers communicate using a shared, standardized language, allowing us to seamlessly send emails across providers. To send you an email, I don't need to know who your provider is; I just need your email address.

This is how the Open Payments standard works. Similar to an email address, if an account provider implements the Open Payments standard, they will provide you with a wallet address. Like an email address, this wallet address is human-readable (consisting of words instead of a long string of numbers) and is publicly shareable (unlike your credit card number).

When you want to make a payment online, you simply provide the application with your wallet address. This wallet address is also a URL, which means that an application can make queries directly to the wallet address. The application can then access information about where to contact your account holder. Using the Open Payments standard, the application can then send a request directly to your account, asking for the specified amount to be transferred from your account to the recipient's account.

As an open standard, Open Payments is free for anyone to use, ensuring seamless communication between applications and their user’s account providers, regardless of which financial institutions are involved. This direct communication means you’re not incurring additional fees or delays.

The Open Payments protocol also aims to make transactions more transparent so that before you commit to a payment you understand how much the recipient is receiving and how much this payment is costing you in transaction fees.

The Open Payments standard addresses key questions such as:

- **Where should the money be sent, exactly?** It provides a standardized way to identify and locate user accounts across different financial institutions.
- **Ensuring all parties agree on the final amount after any fees are added onto a transaction.**
- **Determining the best underlying method to use for the transaction.**

With the Open Payments standard, applications do not need to be registered financial service providers (FSPs) to facilitate transactions. Instead of moving or holding money, applications send payment obligations. This means they are not transferring money directly but are sending instructions to your financial institution to transfer the funds. This setup eliminates the need for the application to be a financial service provider itself, even though it has direct communication access to your account. This is great news for applications because they don’t need to contend with the legal and compliance hurdles that are required to be a financial services provider. But it’s also great news for you because now you don’t need to share sensitive information with online applications. You cannot always know for sure that an application will handle your financial information responsibly and even if they do have the best intentions when applications store information such as credit card numbers and CVV codes there is always a risk that they could be leaked or hacked.

Now you might think, well this sounds convenient for everyone, but is it secure? I don’t want just anyone pulling money out of my account!

## You Remain in Control

With the Open Payments standard, you remain in full control of your financial transactions. When an application uses Open Payments, it securely shares key information about itself with the financial institutions it interacts with. This verification ensures that the account provider knows the application is legitimate when making a payment request on your behalf.

Importantly, any withdrawal of money from your account requires your explicit consent. When you grant an application access to your account, you are not giving it unrestricted access. Instead, you specify the access rights: the exact amount, the time frame, and whether it can access your balance or move funds. Open Payments also supports recurring payments, allowing you to define how often, for how long, and up to what amount an application can access your account. This granular control ensures that you are always aware of and consenting to the transactions made from your account.

## There Are Some Catches

For this system to work, both the sender and the recipient must have Open Payments-enabled accounts. This requirement poses an adoption hurdle, which the Interledger Foundation is actively addressing. We are dedicated to making adoption as seamless as possible for financial service providers (FSPs) and applications by providing extensive support and resources.

It's important to note that integrating Open Payments does not guarantee a shared settlement layer, so payments can still fail. However, with widespread adoption, many of the payment rail issues are addressed within the Interledger Protocol (ILP) network. While some fees, such as currency conversion and bank transaction fees, may still apply, Open Payments aims to eliminate unnecessary middleman fees, reducing overall transaction costs.

Not all intermediaries are unnecessary; for example, currency conversion services are essential for international transactions. The goal is to traverse the network efficiently to find shared payment rails, minimizing costs and improving reliability. With broad adoption, Open Payments has the potential to solve many existing challenges in the digital payment landscape.

## Okay, But What Does This Mean Today?

- Is there anyone in the wild using OP now?
- Who can get an OP enabled account now (which countries and vendors) SA - Fynbos

**WIP**
- Wallets like Fynbos are still limited to interacting in the same country

## What Does It Mean for Tomorrow?

A world with direct access to accounts through the Open Payments standard fosters innovation and inclusion by reducing barriers to entry for developers, who can create payment solutions more quickly and at a lower cost without the need for custom integrations. This enables smaller companies and startups to compete and innovate. Users benefit from seamless transactions, transparency, and enhanced control over their financial data, improving trust and security. Financial inclusion is increased by enabling access for those without traditional bank accounts, and the ability to handle microtransactions opens up new business models. Standardized communication protocols facilitate interoperability and scalability, allowing developers to expand globally and create innovative financial products and services. Cost efficiency is achieved by reducing fees and cutting out unnecessary intermediaries, making financial services more affordable. Finally, users are empowered with control over their data, fostering trust and encouraging engagement with digital financial services, while applications can offer more personalized and tailored financial services. This transformative approach democratizes access to financial services and drives the creation of innovative solutions that benefit everyone.

## Conclusion

By leveraging standardized APIs, Open Payments Protocol simplifies the integration process for client applications, allowing them to connect with multiple Account Servicing Entities seamlessly. This standardization not only enhances interoperability but also reduces development effort and costs, providing a scalable and efficient solution for handling digital payments.

Users are empowered to give clients direct access to their accounts. Give access to who you want to do what you want.

The vision for an Open Payments (OP) world is transformative, promising significant improvements over the current digital payment landscape. By implementing a single, existing standard, developers can avoid the need for custom integrations, drastically reducing development costs. As more Account Servicing Entities (ASEs) adopt the Open Payments standard, client applications can easily expand their payment capabilities without major overhauls.

This approach reduces the reliance on unnecessary intermediaries, such as payment processors and card processors, effectively cutting out the middleman and minimizing transaction fees. Whether for small or large transactions, the overhead costs remain consistent, making microtransactions feasible and revolutionizing payment experiences.

Standardization simplifies interoperability, providing transparency about where costs go and enabling fine-grained user consent. Users retain control over their finances, deciding who can access their money, how much, and how often. They can view and revoke grants as needed, ensuring their privacy and security.

Open Payments enables applications to communicate directly with their customers' accounts, sending payment instructions rather than actual money, which means there is no need for the application to be a financial service provider. This creates a distributed, federated, and global payment ecosystem with no dependency on specific account types or settlement systems.

Developers can build payment functionality without relying on third-party payment processors or custom integrations, and in any programming language. By leveraging standardized APIs, the Open Payments Protocol simplifies the integration process, allowing client applications to connect seamlessly with multiple Account Servicing Entities. This standardization not only enhances interoperability but also reduces development effort and costs, providing a scalable and efficient solution for handling digital payments.

In this new world of Open Payments, users are empowered to give applications direct access to their accounts, with precise control over who can do what. This ensures that financial interactions are secure, transparent, and efficient, paving the way for a more inclusive and streamlined digital economy.

A world with direct access to accounts creates an environment for innovation and inclusion.
