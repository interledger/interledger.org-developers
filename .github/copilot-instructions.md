# GitHub Copilot Instructions for Interledger Developers Portal

## Project Overview

This is the Interledger Developers Portal, a documentation site built with [Astro](https://astro.build/) and [Starlight](https://starlight.astro.build/). It serves as the `/developers` section of [interledger.org](https://interledger.org/).

**⚠️ Important**: When deployment configuration, build processes, or new gotchas are discovered, please update this file to keep it accurate. This helps AI agents and future contributors understand the project correctly.

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

### Production (Google Cloud)
- Deployed to `https://interledger.org/developers/` via Google Cloud Storage
- Triggered automatically on merge to `main` by `.github/workflows/deploy_gcs.yml`
- Process: Build → Deploy to GCS → Rebuild nginx-rewrite Cloud Run service → Invalidate CDN
- **Legacy**: `deploy.yml` exists but is deprecated - use `deploy_gcs.yml`

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
