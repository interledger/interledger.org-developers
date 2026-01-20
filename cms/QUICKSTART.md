# Quick Start Guide

## First Time Setup

### 1. Generate Secrets

Before running the CMS for the first time, you need to generate secure secrets. Run this command from the `cms` directory:

```bash
node -e "console.log('APP_KEYS=' + Array(4).fill(0).map(() => require('crypto').randomBytes(16).toString('base64')).join(','))"
node -e "console.log('API_TOKEN_SALT=' + require('crypto').randomBytes(16).toString('base64'))"
node -e "console.log('ADMIN_JWT_SECRET=' + require('crypto').randomBytes(16).toString('base64'))"
node -e "console.log('TRANSFER_TOKEN_SALT=' + require('crypto').randomBytes(16).toString('base64'))"
node -e "console.log('JWT_SECRET=' + require('crypto').randomBytes(16).toString('base64'))"
```

Copy the output and replace the values in your `.env` file.

### 2. Install Dependencies

```bash
npm install
```

### 3. Start the CMS

```bash
npm run develop
```

### 4. Create Admin User

On first run, navigate to http://localhost:1337/admin and create your admin account.

## Creating Your First Press Item

1. Log in to the admin panel at http://localhost:1337/admin
2. Click on "Press Items" in the left sidebar
3. Click "Create new entry"
4. Fill in the required fields:
   - **Title**: The headline
   - **Description**: A short excerpt (1-2 sentences)
   - **Publish Date**: When the item was published
   - **Slug**: Auto-generated from title, but can be customized
5. Optional fields:
   - **Publication**: Name of the publication (e.g., "TechCrunch")
   - **Publication Logo**: URL to publication's logo
   - **External URL**: Link to the external article
   - **Content**: Full article content (rich text)
   - **Featured**: Check to highlight this item
   - **Category**: Choose press-release, media-mention, or announcement
6. Click "Save" to create a draft
7. Click "Publish" to make it live

Once published, an MDX file will be automatically created in `../src/content/press/` and will appear on the `/developers/press` page.

## Viewing Your Content

1. Make sure the Astro dev server is running:

   ```bash
   cd ..  # Go back to root
   bun run start
   ```

2. Visit http://localhost:1103/developers/press to see your press items

## Editing Content

1. Find the press item in the Strapi admin
2. Make your changes
3. Click "Save" and "Publish"
4. The MDX file will be automatically updated

## Unpublishing Content

1. Find the press item in the Strapi admin
2. Click the "Unpublish" button
3. The MDX file will be automatically deleted

## Tips

- **Drafts**: Save items as drafts to work on them before publishing
- **Featured Items**: Use sparingly - featured items appear in a prominent card grid
- **External Links**: If you provide an External URL, the press item will link to that instead of showing local content
- **Publication Logos**: For best display, use square logos with transparent backgrounds
- **Rich Text**: The content field supports formatting, links, headings, etc.

## Troubleshooting

### Port Already in Use

If port 1337 is already in use, you can change it in `.env`:

```
PORT=1338
```

### MDX Files Not Generating

1. Ensure the item is **published** (not just saved)
2. Check the Strapi console for errors
3. Verify the `MDX_OUTPUT_PATH` in `.env` is correct
4. Check file permissions on `src/content/press/`

### Can't Access Admin Panel

1. Make sure the CMS is running (`npm run develop`)
2. Check that nothing else is using port 1337
3. Try accessing http://127.0.0.1:1337/admin instead

## Next Steps

- Customize the press item schema in `src/api/press-item/content-types/press-item/schema.json`
- Modify the MDX generation logic in `src/api/press-item/content-types/press-item/lifecycles.ts`
- Update the press page styling in `../src/pages/press.astro`
- Configure additional content types for other sections
