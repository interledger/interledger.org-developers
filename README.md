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
│   ├── overrides/
│   ├── styles/
│   └── env.d.ts
├── astro.config.mjs
├── package.json
└── tsconfig.json
```

Starlight looks for `.md` or `.mdx` files in the `src/content/docs/` directory. Each file is exposed as a route based on its file name.

Static assets, like favicons or images, can be placed in the `public/` directory.

The key component for this site is the `Spec` component (found in the `components/` directory), which is how we pull the specification content directly from https://github.com/interledger/rfcs.

Overrides are done using a custom plugin (source: https://gist.github.com/giuseppelt/7f918a3ac02a011d76811ae472f8bf09) until the Starlight maintainers are able to get to https://github.com/withastro/starlight/issues/415. We are currently overriding the default Starlight header to match the main site header.

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
