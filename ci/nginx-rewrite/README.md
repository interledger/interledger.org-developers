# Nginx Rewrite Service

Simple nginx-based static file server for the developers portal under the `/developers` path.

## Background

Previously, this content was served from an AWS S3 bucket through AWS CloudFront CDN. After migrating to GCS, we encountered a significant limitation: the GCS CDN lacks CloudFront's intelligent URL rewriting capabilities, and automatic `index.html` serving doesn't come out of the box. The simplest solution was to host the content through nginx and handle all rewrite rules at the server level.

## What it does

- Serves static files from the GCS bucket `gs://interledger-org-developers-portal/developers`
- Content is baked into the container image at build time (multi-stage Docker build)
- Handles index.html fallback for pretty URLs using `try_files`
- Redirects paths without trailing slash to the slash version for clean URLs
- Serves all content under `/developers/` path

## Building and deploying

Deployment happens automatically via GitHub Actions when changes are merged to `main`:

1. Site is built with Astro
2. Files are synced to `gs://interledger-org-developers-portal/developers`
3. Container is built (fetches content from GCS at build time)
4. New revision is deployed to Cloud Run

Manual deployment:

```bash
cd ci/nginx-rewrite

# Build the container (fetches from GCS during build)
gcloud builds submit --tag gcr.io/interledger-websites/nginx-rewrite:latest .

# Deploy to Cloud Run
gcloud run deploy nginx-rewrite \
  --image gcr.io/interledger-websites/nginx-rewrite:latest \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --port 8080 \
  --memory 512Mi \
  --cpu 1 \
  --min-instances 0 \
  --max-instances 10
```

## How it works

### Multi-stage Docker build

1. **Stage 1 (fetcher)**: Uses `google/cloud-sdk:alpine` to fetch content from GCS
   - Runs `gsutil rsync` to download `gs://interledger-org-developers-portal/developers/` to `/content/developers/`
2. **Stage 2 (nginx)**: Uses `nginx:alpine` to serve the content
   - Copies content from stage 1
   - Copies custom `nginx.conf`
   - Runs as non-root user (Cloud Run requirement)

### Nginx configuration

Simple configuration in `nginx.conf`:

- **Root**: `/usr/share/nginx/html` (contains the `developers/` folder)
- **Location `/developers/`**: Uses `try_files $uri $uri/ $uri/index.html =404` for index fallback
- **Location `= /developers`**: 301 redirect to `/developers/` for consistency
- **absolute_redirect off**: Ensures redirects use relative paths (important for load balancer)

## Architecture

```
GitHub Actions (on push to main)
  ↓
  1. Build Astro site
  2. Sync to GCS bucket
  3. Build container (fetches from GCS)
  4. Deploy to Cloud Run
  ↓
Load Balancer (staging.interledger.org)
  ↓
  /developers → nginx-rewrite Cloud Run service
  ↓
  Serves baked-in static files
```
