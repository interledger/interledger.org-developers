# Translation Scripts

This directory contains TypeScript scripts for managing blog post translations through a file-based workflow.

**Note:** The `exports/translations/` folder is `.gitignore`'d because it contains temporary work files for translation agencies. The final generated MDX files in `src/content/blog/` ARE committed.

## Testing Translation Flow

### Prerequisites

1. **Start Strapi Server**:

   ```bash
   cd cms
   npm run develop
   ```

2. **Generate an API Token**:
   - Go to http://localhost:1337/admin/settings/api-tokens
   - Click "Create new API Token"
   - Name: "Translation Scripts"
   - Token type: Full access (or configure specific permissions for blog-post)
   - Copy the generated token
   - Add to `cms/.env`:
     ```
     STRAPI_API_TOKEN=your_token_here
     STRAPI_URL=http://localhost:1337
     STRAPI_UPLOADS_BASE_URL=http://localhost:1337
     ```

### Test Flow

#### Step 1: Export a Blog Post

```bash
cd cms
npm run translations:export
```

This creates MDX files in `cms/exports/translations/` with the format:

- `YYYY-MM-DD-slug.mdx` (English posts)

**Note**: The export script automatically converts all image paths (both featured and body images) from `/uploads/xxx.jpg` to full URLs like `http://localhost:1337/uploads/xxx.jpg`. This ensures images work correctly when importing back.

#### Step 2: Create a Translated Version

Translate the content (title, description, body) while preserving the image URLs.

#### Step 3: Import the Translation

```bash
npm run translations:import
```

The script will:

- Create a new blog post entry in Strapi
- Set the `lang` field to "es"
- Use image URLs as-is
- Generate a unique slug by appending language code (e.g., `my-post-es`)
- Publish the post

After the import completes, the lifecycle hook will automatically generate the final MDX file in `src/content/blog/`:

- `YYYY-MM-DD-slug-es.es.mdx` (Spanish version)

#### Step 4: Verify the Generated File

Check that the translated MDX file was created with both featured image and body images:

```bash
cat src/content/blog/2025-01-22-my-post-es.es.mdx
```

**What to check in Strapi Admin:**

- Go to **Blog Posts** → Click on your imported post
- The featured image should appear in the **Featured Image** field
- Scroll to the **Content** editor - body images should render correctly
- If images don't appear, try clicking the "Refresh" button or re-saving the post

## How Images Work

### Featured Image

- **Export**: Converts `/uploads/image.jpg` to `http://localhost:1337/uploads/image.jpg`
- **Import**: Uses the full URL directly (no re-upload needed)
- **Result**: Featured image shows in Strapi admin and in the blog post

## Scripts

- `export-translations.ts` - Export all published blog posts to MDX with full image URLs
- `import-translations.ts` - Import translated MDX files to Strapi

## Filename Format

- **Original**: `YYYY-MM-DD-slug.mdx`
- **Translated**: `YYYY-MM-DD-slug.{lang}.mdx` (e.g., `post.es.mdx`, `post.fr.mdx`)

**Note**: The import script appends language code to slug to ensure uniqueness (e.g., `slug-es`), so the generated MDX filename will be `YYYY-MM-DD-slug-es.{lang}.mdx`. This is intentional to maintain slug uniqueness in Strapi.