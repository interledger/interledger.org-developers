// When --mode development is passed to astro build, Vite sets PROD to false.
// In all other contexts (production builds, Netlify Function runtimes where
// import.meta.env.PROD may be undefined) this defaults to true so that
// missing variables still throw rather than silently returning null.
const isProd = import.meta.env?.PROD !== false

function requireEnv(name: string): string | null {
  const value = process.env[name]
  if (!value && isProd) {
    throw new Error(`${name} is required in production`)
  }
  return value ?? null
}

// Required: Linear API key for fetching roadmap data
export const LINEAR_API_KEY = requireEnv('LINEAR_API_KEY')

// Required: Linear custom view ID containing the roadmap projects
export const LINEAR_CUSTOM_VIEW_ID = requireEnv('LINEAR_CUSTOM_VIEW_ID')

// Required: bearer token for POST /api/sync (manual sync trigger)
export const API_SECRET = requireEnv('API_SECRET')

// Optional: Netlify Personal Access Token for CDN cache purging after sync
export const NETLIFY_API_TOKEN = process.env.NETLIFY_API_TOKEN ?? null

// Optional: auto-injected by Netlify; set manually in .env for local netlify dev
export const NETLIFY_SITE_ID = process.env.NETLIFY_SITE_ID ?? null
