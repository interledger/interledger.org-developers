# MDX to Strapi Sync

Simple proof-of-concept script that syncs MDX files to Strapi database.

## Features

- Scans MDX files in `src/content/blog` and `src/content/events`
- Creates new Strapi entries for new MDX files
- Updates existing entries when MDX content changes
- Deletes Strapi entries when MDX files are removed
- Supports dry-run mode to preview changes

## Setup

### 1. Create Strapi API Token

In Strapi admin (<http://localhost:1337/admin>):

1. Go to **Settings** → **API Tokens**
2. Click **Create new API Token**
3. Name: `MDX Sync Token`
4. Token type: **Full access** (required for create/update/delete operations)
5. Token duration: **Unlimited**
6. Copy the token

### 2. Configure Environment Variables

Add to `cms/.env`:

```env
STRAPI_PREVIEW_TOKEN=your-token-here
# or
STRAPI_API_TOKEN=your-token-here
```

## Usage

### From cms directory (recommended)

```bash
cd cms
npm run sync:mdx:dry-run  # Preview changes
npm run sync:mdx          # Actually sync
```

### From project root

```bash
npm run sync:mdx:dry-run  # Preview changes
npm run sync:mdx          # Actually sync
```

### Direct execution

```bash
# From project root
node cms/scripts/sync-mdx.cjs --dry-run
node cms/scripts/sync-mdx.cjs

# From cms directory
node scripts/sync-mdx.cjs --dry-run
node scripts/sync-mdx.cjs
```

## GitHub Actions

The workflow in `.github/workflows/sync-mdx-to-strapi.yml` automatically syncs MDX files to Strapi when changes are pushed to the `main` branch.

### Required GitHub Secrets

- `STRAPI_URL` - URL of your Strapi instance
- `STRAPI_API_TOKEN` - Full access API token from Strapi

## How It Works

1. **Scans MDX files**: Reads all `.mdx` files from content directories
2. **Parses frontmatter**: Extracts metadata (title, description, slug, etc.)
3. **Converts markdown**: Transforms markdown content to HTML
4. **Syncs to Strapi**:
   - Creates new entries if slug doesn't exist
   - Updates existing entries if slug matches
   - Deletes orphaned entries (in Strapi but not in MDX)

## Content Type Mappings

- `src/content/blog/*.mdx` → `blog-posts` (API ID)
- `src/content/events/*.mdx` → `news-events` (API ID)

## Troubleshooting

### 401 Unauthorized Error

Your API token doesn't have sufficient permissions. Make sure:

- Token type is "Full access" (not "Read-only" or "Custom")
- Token is not expired
- Token is correctly set in environment variables

### Cannot find module 'dotenv'

The script requires dotenv to load environment variables:

```bash
npm install dotenv
```
