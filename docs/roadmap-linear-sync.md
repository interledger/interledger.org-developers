# Roadmap — Linear Sync Architecture

The `/developers/roadmap` page is powered by a set of Netlify serverless functions that sync data from Linear and cache it in Netlify Blobs.

## How it works

```
Linear API (GraphQL)
      │
      ▼
netlify/functions/sync.mts          ← runs every 12h via cron (schedule: "0 */12 * * *")
netlify/functions/sync-now.mts      ← manual trigger via POST /api/sync (prod/preview)
                                       or POST /.netlify/functions/sync-now (local dev)
      │
      ▼  builds RoadmapSnapshot JSON
Netlify Blobs  ("roadmap-snapshot") ← one key, overwritten on each sync
      │
      └── Netlify Cache Purge API   ← invalidates /developers/roadmap CDN cache
                    │
                    ▼  on next request after purge
      src/pages/roadmap.astro       ← SSR: reads blob at request time
                    │
                    ▼  sets Netlify-CDN-Cache-Control: max-age=43200
      Netlify CDN caches rendered HTML for 12h
```

The roadmap page is **server-side rendered** (`export const prerender = false`) but effectively behaves like a static page — the CDN caches the rendered HTML for 12 hours. The sync function purges that cache after each update, so the next user request re-renders with fresh data.

---

## Environment variables

| Variable                | Required | Notes                                                                                                                                                          |
| ----------------------- | -------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `LINEAR_API_KEY`        | Yes      | Linear API token (`lin_api_...`). Get from: Linear → Settings → API → Personal API keys. Read-only scope is sufficient.                                        |
| `API_SECRET`            | Yes      | Bearer token for `POST /api/sync`. Generate any strong secret 32`                                                                                              |
| `NETLIFY_API_TOKEN`     | No       | Only needed for CDN cache purging after sync. Get from: Netlify UI → User Settings → Applications → Personal access tokens. Safe to leave blank for local dev. |
| `LINEAR_CUSTOM_VIEW_ID` | No       | Overrides the default view ID hardcoded in `build-snapshot.ts`. Set in `netlify.toml` (non-secret)                                                             |
| `NETLIFY_SITE_ID`       | Auto     | Injected by Netlify in all build/function contexts. Inject manually for local dev (see below)                                                                  |
| `NETLIFY_TOKEN`         | Auto     | Injected by `netlify dev` — required for Netlify Blobs to work outside a function                                                                              |

Copy `.env.example` to `.env` and fill in the values. `.env` is gitignored.

---

## Local development

### One-time setup

```bash
npm install -g netlify-cli
netlify login
netlify link        # Link this repo to the Netlify site
```

After `netlify link`, the CLI writes `NETLIFY_SITE_ID` to `.netlify/state.json` and auto-injects `NETLIFY_SITE_ID` + `NETLIFY_TOKEN` at runtime. Both are needed for Netlify Blobs to connect to the cloud store.

### Daily workflow

```bash
netlify dev         # http://localhost:8888
```

**Do not use `bun dev` or `astro dev`** for the roadmap page. Without the Netlify CLI, the function runtime context is missing and `getStore()` will throw — the roadmap page will show an error state.

#### Troubleshooting: `netlify dev` fails with a Neon extension error

If `netlify dev` exits immediately with a network timeout while installing the "neon" extension, the Neon integration is enabled on the Netlify site but can't install its plugin in your environment. The work around:

```bash
netlify dev --offline
```

`--offline` skips remote plugin installation. Netlify Blobs will still work.

### First-time blob population

This step is only needed if you want to view the `/developers/roadmap` page locally. For all other development work, you can skip it.

The blob store starts empty locally. Before the roadmap page can render, you need to run a sync. Do this **after** `netlify dev` is running.

Locally, the `netlify dev` proxy does **not** forward `/.netlify/functions/*` URLs through the redirect rules, so you must call the function URL directly — bypassing the `/api/sync` shortcut that only works in deployed environments:

```bash
curl -X POST http://localhost:8888/.netlify/functions/sync-now \
  -H "Authorization: Bearer <your API_SECRET>"
```

**Why the different URL locally?**  
In deployed environments (production and Deploy Previews), `netlify.toml` has no redirect rule for `/api/sync` in non-dev contexts, so the function registers itself at `/api/sync` via
`export const config = { path: '/api/sync' }`.  
In local `netlify dev`, existing redirect rules take precedence, so `netlify.toml` adds a dev-only redirect:

```toml
# Route /api/sync to the sync-now function (dev only)
[[context.dev.redirects]]
  from = "/api/sync"
  to = "/.netlify/functions/sync-now"
  status = 200
  force = true
```

Both `/api/sync` and `/.netlify/functions/sync-now` therefore work locally, but only `/.netlify/functions/sync-now` is guaranteed to work in all environments.

This fetches live data from Linear and writes the snapshot to Netlify Blobs. Because `netlify dev` connects to the linked site's blob store, this writes to the **production blob** — the
same data production serves.

After syncing, visit the roadmap at:

```
http://localhost:1103/developers/roadmap
```

**Why port 1103 and not 8888?**  
`netlify.toml` has a redirect that routes `/developers/roadmap` to `/.netlify/functions/ssr` — a function that only exists in production builds. In dev, Astro handles SSR pages directly. Accessing port 1103 (the raw Astro dev server) bypasses the Netlify proxy and hits Astro directly, which works correctly.

### What runs locally

| Feature            | Local (`netlify dev`)                                                                      |
| ------------------ | ------------------------------------------------------------------------------------------ |
| Roadmap page (SSR) | ✓ Works — visit `http://localhost:1103/developers/roadmap` (not port 8888, see note above) |
| `POST /api/sync`   | ✓ Works — fetches Linear, updates blob                                                     |
| Scheduled sync     | ✗ Does not auto-run locally — trigger manually via `/api/sync`                             |
| CDN cache purge    | ✓ Fires if `NETLIFY_API_TOKEN` + `NETLIFY_SITE_ID` are set (purges production cache)       |

---

## Pull requests and Deploy Previews

Netlify automatically builds a Deploy Preview for every PR. The functions (`sync.mts`, `sync-now.mts`) are deployed alongside the preview site.

### What works in a Deploy Preview

| Feature            | Deploy Preview                                       |
| ------------------ | ---------------------------------------------------- |
| Roadmap page (SSR) | ✓ Renders — reads from the **shared** blob store     |
| `POST /api/sync`   | ✓ Works — call `https://<preview-url>/api/sync`      |
| Scheduled sync     | ✗ Does not run on previews — only runs on production |
| CDN cache purge    | ✓ Purges the production `/developers/roadmap` path   |

Example for a deploy preview:

```bash
curl -X POST https://deploy-preview-215--interledger-org-developers.netlify.app/api/sync \
  -H "Authorization: Bearer <your API_SECRET>"
```

### Shared blob store

`getStore('roadmap')` uses the **site-scoped** Netlify Blobs store. All Deploy Previews share the same store as production. This means:

- A preview will show real, up-to-date roadmap data (same as production).
- Running `POST /api/sync` from a preview URL updates the data for everyone, including production.
- There is no per-PR data isolation. This is intentional — previews are for testing the UI, not isolated data environments.

### Secrets in previews

`LINEAR_API_KEY`, `API_SECRET`, and `NETLIFY_API_TOKEN` must be set in **Netlify UI → Site Settings → Environment Variables** and scoped to the relevant contexts (production + previews). They are not available in previews by default unless explicitly configured.

If `API_SECRET` is not set in the preview context, `POST /api/sync` will return `401`.

---

## Production

In production, the flow is fully automated:

1. **Every 12 hours** — `netlify/functions/sync.mts` wakes up, fetches fresh data from Linear, stores it in Netlify Blobs, and purges the CDN cache for `/developers/roadmap`.
2. **Next user request** — The SSR function renders `roadmap.astro`, reads the updated blob, and sets `Netlify-CDN-Cache-Control: public, max-age=43200`.
3. **Subsequent requests for the next 12h** — Served directly from Netlify's CDN. The SSR function is not called.
4. **Manual sync** — `POST /api/sync` with the `API_SECRET` bearer token triggers an immediate out-of-cycle sync.

### Monitoring

- Scheduled function logs: Netlify UI → Functions → `sync` → Logs
- Manual sync logs: Netlify UI → Functions → `sync-now` → Logs
- To check the current snapshot age, look for `generatedAt` in the function logs or inspect the blob directly via Netlify CLI:

```bash
netlify blobs:get roadmap roadmap-snapshot | jq '.generatedAt'
```

---

## Key files

| File                                              | Purpose                                                                                      |
| ------------------------------------------------- | -------------------------------------------------------------------------------------------- |
| `netlify/functions/sync.mts`                      | Scheduled sync — runs every 12h via cron (`0 */12 * * *`), no auth required                  |
| `netlify/functions/sync-now.mts`                  | Manual sync — `POST /api/sync` (deployed) or `POST /.netlify/functions/sync-now` (local dev) |
| `netlify/functions/utils/purge-roadmap-cache.mts` | Calls Netlify Cache Purge API after each sync                                                |
| `src/linear/client.ts`                            | Linear GraphQL client singleton                                                              |
| `src/linear/build-snapshot.ts`                    | Fetches teams + projects from Linear, returns `RoadmapSnapshot`                              |
| `src/pages/roadmap.astro`                         | SSR roadmap page — reads blob, sets CDN cache headers                                        |
| `src/types/roadmap.ts`                            | `RoadmapSnapshot`, `RoadmapProject`, `RoadmapTeam` interfaces                                |
| `src/config.ts`                                   | Shared config — exports `isProd`, `isDev` (set via `NETLIFY_DEV`), and env vars              |
| `netlify.toml`                                    | Build config, non-secret env vars, and dev-only `/api/sync` redirect                         |
| `.env.example`                                    | Template for local `.env` (committed)                                                        |
| `.env`                                            | Local secrets (gitignored)                                                                   |
