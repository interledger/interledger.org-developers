# Interledger Developers Portal - Strapi CMS

This is the Strapi CMS for managing content that will be rendered on the Interledger Developers Portal. The CMS automatically generates MDX files that are read by the Astro site.

## Features

- **Press Management**: Create and manage press releases, media mentions, and announcements
- **Automatic MDX Generation**: Content is automatically written to MDX files when published
- **Draft & Publish Workflow**: Content can be drafted and published when ready
- **SQLite Database**: Lightweight database for easy development and deployment

## Getting Started

### Prerequisites

- Node.js >= 18.0.0 <= 22.x.x
- npm >= 6.0.0

### Installation

The dependencies should already be installed. If not, run:

```bash
cd cms
npm install
```

### Configuration

The CMS is configured via environment variables in `.env`. Key settings:

- `PORT`: CMS runs on port 1337 (default)
- `DATABASE_CLIENT`: Using better-sqlite3
- `MDX_OUTPUT_PATH`: Where MDX files are written (`../src/content/press`)

### Running the CMS

Start the development server:

```bash
cd cms
npm run develop
```

The Strapi admin panel will be available at: http://localhost:1337/admin

On first run, you'll be prompted to create an admin user.

### Production Build

To build for production:

```bash
cd cms
npm run build
npm run start
```

## Content Types

### Press Item

The Press Item content type includes the following fields:

- **Title** (required): Headline of the press item
- **Description** (required): Short description or excerpt
- **Publish Date** (required): When the item was published
- **Slug** (required, auto-generated): URL-friendly identifier
- **Publication** (optional): Name of the publication (e.g., "TechCrunch")
- **Publication Logo** (optional): URL to the publication's logo image
- **External URL** (optional): Link to the external article
- **Content** (optional): Full article content (rich text)
- **Featured** (boolean): Whether to feature this item prominently
- **Category** (enum): Type of press item
  - `press-release`: Official press releases
  - `media-mention`: Coverage by external media
  - `announcement`: General announcements

## How It Works

### MDX File Generation

When you publish or update a Press Item in Strapi:

1. The lifecycle hooks in `src/api/press-item/content-types/press-item/lifecycles.ts` are triggered
2. The content is converted to MDX format with frontmatter
3. An MDX file is created/updated in `../src/content/press/` with the slug as the filename
4. The Astro site automatically picks up the new content

### File Naming

MDX files are named using the slug: `{slug}.mdx`

Example: If slug is `interledger-launches-new-platform`, the file will be `interledger-launches-new-platform.mdx`

### Unpublishing Content

When you unpublish a Press Item in Strapi, the corresponding MDX file is automatically deleted.

## Astro Integration

The generated MDX files are consumed by the Astro site at `/press`. The press page:

- Displays all published press items sorted by date
- Shows featured items in a prominent card grid
- Lists regular items in a clean timeline format
- Includes a "Featured In" section with publication logos

## Development Workflow

1. **Start the CMS**: `cd cms && npm run develop`
2. **Access Admin Panel**: http://localhost:1337/admin
3. **Create Content**: Add new Press Items through the UI
4. **Publish**: When ready, publish the content
5. **View on Site**: The content automatically appears at `/developers/press`

## File Structure

```
cms/
├── config/              # Strapi configuration files
│   ├── admin.ts
│   ├── database.ts
│   ├── middlewares.ts
│   └── server.ts
├── src/
│   ├── api/
│   │   └── press-item/  # Press Item API
│   │       ├── content-types/
│   │       │   └── press-item/
│   │       │       ├── schema.json
│   │       │       └── lifecycles.ts  # MDX generation logic
│   │       ├── controllers/
│   │       ├── routes/
│   │       └── services/
│   └── index.ts
├── .env                 # Environment variables
├── .gitignore
├── package.json
├── tsconfig.json
└── README.md
```

## Tips

- **Rich Text Content**: The content field supports rich text. It will be converted to markdown when generating MDX files.
- **External Links**: If you provide an `externalUrl`, the press item will link to the external article instead of a local page.
- **Featured Items**: Use the featured flag to highlight important press coverage.
- **Publication Logos**: For best results, use square logos with transparent backgrounds.
- **Slugs**: Slugs are auto-generated from the title but can be customized. Ensure they're unique.

## Troubleshooting

### MDX files not generating

1. Check that the Press Item is **published** (not just saved as draft)
2. Verify the `MDX_OUTPUT_PATH` in `.env` points to the correct directory
3. Check file permissions on the `src/content/press` directory
4. Look for errors in the Strapi console output

### Database issues

The SQLite database is stored in `.tmp/data.db`. To reset:

```bash
rm -rf cms/.tmp
```

Then restart Strapi. You'll need to create a new admin user.

## Security Notes

- The `.env` file contains secrets - never commit it to version control
- Change the default secrets in `.env` before deploying to production
- The CMS is configured to allow CORS from `localhost:1103` (the Astro dev server)
- Update `FRONTEND_ORIGINS` in `.env` and `config/middlewares.ts` for production

## Support

For issues related to:

- **Strapi CMS**: Check [Strapi Documentation](https://docs.strapi.io/)
- **Content Issues**: Check the Strapi console logs
- **Astro Integration**: Check the main README in the repository root
