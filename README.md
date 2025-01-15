# Interledger developer portal

Source code for the /developer-tools portion of [Interledger.org](https://interledger.org/). This site is separate from the headless Drupal-powered main site and is built with [Starlight](https://starlight.astro.build/), a documentation framework powered by [Astro](https://astro.build/).

## 🚀 Project Structure

Inside this project, you'll see the following folders and files:

```
.
├── public/
├── src/
│   ├── components/
│   ├── content/
│   │   ├── docs/
│   │   └── config.ts
│   ├── layouts/
│   ├── pages/
│   ├── styles/
│   └── env.d.ts
├── astro.config.mjs
├── package.json
└── tsconfig.json
```

Starlight looks for `.md` or `.mdx` files in the `src/content/docs/` directory. Each file is exposed as a route based on its file name.

Static assets, like favicons or images, can be placed in the `public/` directory. When referencing these assets in your markdown, you do not have to include `public/` in the file path, so an image would have a path like:

```md
![A lovely description of your beautiful image](/img/YOUR_BEAUTIFUL_IMAGE.png)
```

For more information about the way our documentation projects are set up, please refer to our [documentation style guide](https://interledger.tech/#docs-site-building).

## Local Development

We are using [Bun](https://bun.sh/) in this repository, but you could theoretically use the package manager of your choice. To install Bun, run

```sh
curl -fsSL https://bun.sh/install | bash
```

### 🧞 Commands

All commands are run from the root of the project, from a terminal:

| Command                   | Action                                           |
| :------------------------ | :----------------------------------------------- |
| `bun install`             | Installs dependencies                            |
| `bun run start`           | Starts local dev server at `localhost:1103`      |
| `bun run build`           | Build your production site to `./dist/`          |
| `bun run preview`         | Preview your build locally, before deploying     |
| `bun run astro ...`       | Run CLI commands like `astro add`, `astro check` |
| `bun run astro -- --help` | Get help using the Astro CLI                     |

You can substitute the `bun` commands with whatever package manager of your choice uses.

### 👀 Want to learn more?

Check out [Starlight’s docs](https://starlight.astro.build/), read [the Astro documentation](https://docs.astro.build), or jump into the [Astro Discord server](https://astro.build/chat).

Thank You for Contributing! We appreciate your effort to write a blog post and share your expertise with the community!

## Writing a blog post

**Goal:** Educate, drive adoption, and grow strategic influence.

**Typical Target Audience:**

* Technically-inclined users interested in Interledger development.
* Technically-inclined users interested in financial services technologies, innovations, or developments.
* Users keen on topics like APIs, data analytics, metrics, analysis, and quantitative assessment for digital networks.
* Users interested in privacy and related technologies.

**Possible Content Framework:**

If you're unsure how to structure your writing, you can use this as a guide.

* Introduction / main point
* Context - Interledger’s perspective / stance / commitment on the topic being written [broader categories like privacy, metrics for growth, Digital Financial Inclusion etc.]
* The Challenge (or) The Problem
* The Solution
* The How / implementation
* Roadmap - short-term / long-term
* Note: A call to action (CTA) will be included automatically at the bottom of every post.

Ideal Word Count: Between 1,000 and 2,500 words, with links to relevant documents/pages for a deeper understanding.

### Getting Started

Discuss Ideas: Before starting, share your blog post ideas with the tech team to ensure alignment and awareness.

Copy the Template: Begin your draft using [this Google Doc template](https://docs.google.com/document/d/1L7vzsYORg9xmf72ljTdmyekpq2vJ7eQZ9atM2uAXgUM/edit?usp=sharing) to maintain a consistent format.

Review Process## 

Initial Reviews:

* Once your draft is ready, request specific reviewers or ask for feedback on the #tech-team Slack channel.
* Incorporate feedback and refine the blog post.

Finalizing:

* When the draft is stable, create a pull request in the [interledger.org-developers](https://github.com/interledger/interledger.org-developers) GitHub repo.
* Please add links where appropriate so people can easily click to learn more about the concepts you reference.
* Include all images used in the post in the PR.
* No-one is expected to know the ins and outs of Astro (the framework that powers our site), so please tag Sarah as a reviewer to ensure everything Astro-related is in order.

### Working with Visuals 

* If you need an illustration, submit a design request in advance to Madalina via the #design Slack channel using the design request form.
* Before uploading images to GitHub, run them through an image optimizer such as [TinyPNG](https://tinypng.com/).
* Ensure images are appropriately sized; feel free to ask Madalina or Sarah for assistance.

### Publishing Your Blog Post

* Remember: merging the pull request will publish the blog post immediately.
* Ensure the publishing date in the blog post metadata matches the intended release date.
* Check with Ioana to confirm the publishing date and keep a consistent posting schedule. Ioana will also handle social media promotion.
