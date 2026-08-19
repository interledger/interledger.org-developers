# GitHub Copilot Instructions for Interledger Developers Portal

## Project Overview

This is the Interledger Developers Portal, a documentation site built with [Astro](https://astro.build/) and [Starlight](https://starlight.astro.build/). It serves as the `/developers` section of [interledger.org](https://interledger.org/).

**⚠️ Important**: When a deployment configuration, build process, or new gotcha is discovered, please update this file to keep it accurate. This helps AI agents and future contributors understand the project correctly.

## Architecture

- **Framework**: Astro with Starlight documentation framework
- **Package Manager**: Bun (not npm/yarn)
- **Build Output**: `dist/` directory
- **Base Path**: `/developers` (configured in `astro.config.mjs`)

## Deployment

### Preview (Netlify)
- Every PR generates an automatic preview at `https://deploy-preview-{PR}--developers-preview.netlify.app/developers/`
- Configured via `netlify.toml`
- Build command: `npm install -g bun && bun install && bun run build`
- **Important**: Build output is copied to `_netlify/builders/developers/` to serve at `/developers/` path
- Redirect rules route `/developers/*` to `/developers/index.html` for client-side routing

### Production (Netlify, fronted by GCP)
- Built and hosted by Netlify at `https://interledger-org-developers.netlify.app/developers/`
- Users reach it at `https://interledger.org/developers/` via the GCP load balancer, which proxies `/developers/*` through a Cloud Run nginx service (`nginx-rewrite`) to Netlify
- The address bar stays on `interledger.org` — it is **not** a redirect
- GCP Cloud CDN sits in front of the proxy (default TTL 1 hour)
- **After a content deploy**, if you need changes live immediately, manually run the **Invalidate CDN** workflow in the Actions tab
- The `Deploy nginx proxy to Cloud Run` workflow (`.github/workflows/deploy_gcs.yml`) only rebuilds the proxy container and triggers on changes under `ci/nginx-rewrite/**`
- The nginx config itself lives in `ci/nginx-rewrite/` (Dockerfile + nginx.conf)

## Key Development Notes

### Configuration
- **`astro.config.mjs`**: Defines site structure, integrations, and plugins. Base path is hardcoded to `/developers`
- **`netlify.toml`**: Handles Netlify-specific build and deployment configuration with path rewrites
- Keep both Astro config and Netlify config in sync when changing base paths or build output

### Static Assets
- Public files go in `public/` directory
- Images should reference paths like `/developers/img/filename.png` (includes the base path)
- Scripts in `public/scripts/` are referenced with full `/developers/scripts/` path

### Content
- Blog posts: `src/content/blog/`
- Documentation: `src/content/docs/`
- Components: `src/components/`
- Layouts: `src/layouts/`
- Starlight documentation framework handles sidebar, search, and routing automatically

### Common Commands
- `bun run start` - Local dev server at `localhost:1103`
- `bun run build` - Build to `dist/`
- `bun run format` - Fix code formatting and linting
- `bun run lint` - Check code formatting and linting

## Development Philosophy

- Keep the `/developers` base path consistent across all configurations
- Netlify preview should match production behavior exactly - both serve at `/developers/`
- Always test builds locally before pushing: `bun run build && bun run preview`
- Use Bun for all package management - don't mix with npm/yarn
- Link validation is enabled locally but disabled on Netlify (see `astro.config.mjs`)

## Common Pitfalls

1. **Asset paths**: Don't forget the `/developers` prefix in asset URLs
2. **Base path changes**: If modifying base path, update both `astro.config.mjs` AND the Netlify build output path logic
3. **Package manager**: Use `bun install`, not `npm install`
4. **Netlify preview**: Output must be nested under `/developers` in publish directory - this is why we copy to `_netlify/builders/developers/`
