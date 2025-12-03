# Strapi → MDX pipeline

This repo now includes a Strapi admin app under `cms/`. Publishing Press entries
there writes MDX files into `src/content/press`, which the Astro `/press` page
renders.

## Quick start
- Install deps once: `cd cms && npm install` (already done).
- Run Strapi locally: `cd cms && npm run develop` then create your admin user.
- The **Press Item** collection type is pre-created with fields:
  `title` (Text), `slug` (UID), `summary` (Text), `url` (Text), `source` (Text),
  `date` (Date), `tags` (JSON array), `image` (Media), `body` (Rich Text),
  `featured` (Boolean).
- Create a webhook in Strapi:
  - URL: `http://localhost:4369/press`
  - Method: `POST`
  - Secret: set to `STRAPI_WEBHOOK_SECRET` (any value you choose)
  - Triggers: entry publish/update for the Press Item type.
- In this repo, run `npm run strapi:webhook` (optionally set
  `STRAPI_WEBHOOK_PORT` and `STRAPI_WEBHOOK_SECRET` in your shell).

## What the webhook listener does
- Accepts POST payloads from Strapi and validates `x-strapi-signature` when
  `STRAPI_WEBHOOK_SECRET` is set.
- Normalizes the payload into press frontmatter:
  `title`, `slug`, `summary`, `url`, `source`, `date`, `tags`, `image`, `featured`.
- Writes/overwrites `src/content/press/{slug}.mdx` with the frontmatter plus the
  `body` field as the MDX content.

## Payload shape
The listener handles Strapi v4 webhook defaults (`{ event, entry }`) as well as
raw attribute objects. Example:

```json
{
  "event": "entry.publish",
  "entry": {
    "title": "Example press item",
    "slug": "example-press-item",
    "summary": "Short dek shown on /press",
    "url": "https://example.com/story",
    "source": "Example Publication",
    "date": "2024-10-10",
    "tags": ["open-payments"],
    "featured": true,
    "body": "Long-form MDX body"
  }
}
```

## Notes
- Files are written locally; commit them to deploy the updated `/press` page.
- If you need additional fields, extend the press collection in
  `src/content.config.ts` and the serializer in `scripts/strapi-webhook.mjs`.
