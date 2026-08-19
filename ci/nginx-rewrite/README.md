# Nginx Rewrite Service

Reverse-proxy running on Cloud Run that forwards `/developers/*` requests from the Interledger load balancer to the Netlify-hosted developers portal, while keeping the user's browser URL on `interledger.org` / `staging.interledger.org`.

## Background

Historical progression:

1. **AWS S3 + CloudFront** — original setup.
2. **GCS + Cloud CDN** — after migrating to GCP. The GCS CDN lacked CloudFront-style URL rewriting and automatic `index.html` serving, so we introduced an nginx layer on Cloud Run to handle rewrite rules and serve baked-in static files.
3. **Netlify + Cloud Run nginx proxy (current)** — for project-management reasons the site is now built and hosted on Netlify. The same nginx service was repurposed as a thin reverse proxy so users still see `interledger.org/developers/...` in their address bar instead of a `netlify.app` URL.

## What it does

- Receives `/developers/*` traffic from the GCP HTTPS load balancer (`nginx-rewrite-backend`).
- Proxies those requests to `https://interledger-org-developers.netlify.app`.
- Rewrites any absolute `Location` headers Netlify sends so redirects stay relative.
- Uses `absolute_redirect off` so nginx-issued redirects (e.g. `/developers` → `/developers/`) don't leak the internal `:8080` scheme/port.
- Exposes a `/health` endpoint for Cloud Run health checks.

The container contains **no site content** — everything is proxied live from Netlify.

## Building and deploying

Deployment happens automatically via GitHub Actions when files under `ci/nginx-rewrite/**` change on `main`. It can also be triggered manually from the Actions tab (`Deploy nginx proxy to Cloud Run` workflow).

Manual deployment from a workstation:

```bash
cd ci/nginx-rewrite

# Build the container
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

## CDN cache invalidation

The GCP load balancer in front of this service has Cloud CDN enabled on `nginx-rewrite-backend` (default TTL 1 hour). After a Netlify deploy, cached HTML may take up to an hour to refresh. To flush it immediately, run the `Invalidate CDN` workflow in the developers repo (or run `gcloud compute url-maps invalidate-cdn-cache interledger-org --path "/developers/*" --async`).

## How it works

### Dockerfile

Single-stage `nginx:alpine` image with a custom `nginx.conf`. Runs as the non-root `nginx` user (Cloud Run requirement).

### Nginx configuration

- **`location /developers/`**: `proxy_pass` to Netlify with `Host` header override and `proxy_ssl_server_name on` for correct SNI.
- **`location = /developers`**: 301 redirect to `/developers/`.
- **`absolute_redirect off`**: makes redirects relative so the public hostname/scheme from the load balancer is preserved.
- **`proxy_redirect`**: rewrites any absolute Netlify URLs in response `Location` headers back to relative paths.
- **`/health`**: 200 OK for Cloud Run.

## Architecture

```
User browser
  ↓
GCP Load Balancer (34.111.215.251)
  ↓  /developers/* → nginx-rewrite-backend (Cloud CDN enabled)
  ↓
Cloud Run (nginx-rewrite)
  ↓  proxy_pass
  ↓
Netlify (interledger-org-developers.netlify.app)
  ↓
Static site built by Netlify from interledger.org-developers repo
```

The user's address bar stays on `interledger.org` or `staging.interledger.org` throughout.
