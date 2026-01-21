# GCP-Specific Image Optimization Configuration

Additional configuration for Google Cloud Platform (GCS + Cloud CDN).

## Overview

Your site is deployed to **Google Cloud Storage (GCS)** with these optimizations:
- Images cached for 1 year with `Cache-Control` headers
- Automatic WebP conversion via Strapi middleware
- Optimized deployment workflow using `gsutil`

---

## GCS Cache Configuration

### Setting Cache Headers on Upload

**GitHub Actions Workflow:** [.github/workflows/deploy.yml](.github/workflows/deploy.yml:40)

```yaml
- name: Deploy to GCS
  run: |
    # Sync main content (exclude uploads)
    gsutil -m rsync -r -d ./dist/ gs://${{ secrets.BUCKET_ID }}/developers \
      -x ".*uploads/.*"

    # Sync images with cache headers (1 year)
    gsutil -m -h "Cache-Control:public, max-age=31536000, immutable" \
      rsync -r ./dist/uploads/ gs://${{ secrets.BUCKET_ID }}/developers/uploads/

- name: Set cache metadata for images
  run: |
    # Ensure all uploaded images have correct cache headers
    gsutil -m setmeta -h "Cache-Control:public, max-age=31536000, immutable" \
      "gs://${{ secrets.BUCKET_ID }}/developers/uploads/**"
```

### What This Does:

1. **Main content sync** - Deploys HTML/JS/CSS without special cache headers
2. **Image sync** - Uploads images with 1-year cache headers
3. **Metadata update** - Ensures all existing images have correct headers

---

## Cloud Storage Bucket Configuration

### Required Bucket Settings

**Make bucket publicly accessible:**

```bash
# Set bucket to public read
gsutil iam ch allUsers:objectViewer gs://YOUR-BUCKET-NAME

# Set default cache control for new objects
gsutil setmeta -h "Cache-Control:public, max-age=31536000" \
  gs://YOUR-BUCKET-NAME/developers/uploads/**
```

### Bucket CORS Configuration

If serving images from a different domain, configure CORS:

```bash
# Create cors.json
cat > cors.json << 'EOF'
[
  {
    "origin": ["https://interledger.org", "https://developers.interledger.org"],
    "method": ["GET", "HEAD"],
    "responseHeader": ["Content-Type", "Cache-Control"],
    "maxAgeSeconds": 3600
  }
]
EOF

# Apply CORS configuration
gsutil cors set cors.json gs://YOUR-BUCKET-NAME
```

---

## Cloud CDN Integration (Optional)

### Enable Cloud CDN

**Benefits:**
- Global edge caching
- Reduced latency worldwide
- Lower egress costs from GCS
- Automatic HTTPS

### Setup Steps:

1. **Create a backend bucket:**
```bash
gcloud compute backend-buckets create BACKEND-NAME \
  --gcs-bucket-name=YOUR-BUCKET-NAME \
  --enable-cdn
```

2. **Configure cache mode:**
```bash
gcloud compute backend-buckets update BACKEND-NAME \
  --cache-mode=CACHE_ALL_STATIC \
  --default-ttl=31536000
```

3. **Create URL map and load balancer:**
```bash
# Create URL map
gcloud compute url-maps create URL-MAP-NAME \
  --default-backend-bucket=BACKEND-NAME

# Create target HTTP(S) proxy
gcloud compute target-https-proxies create HTTPS-PROXY-NAME \
  --url-map=URL-MAP-NAME \
  --ssl-certificates=YOUR-SSL-CERT

# Create forwarding rule
gcloud compute forwarding-rules create FORWARDING-RULE-NAME \
  --global \
  --target-https-proxy=HTTPS-PROXY-NAME \
  --ports=443
```

4. **Update DNS:**
Point your domain to the load balancer IP address.

### Cache Invalidation

If using Cloud CDN, invalidate cache after deployments:

```bash
# Invalidate specific paths
gcloud compute url-maps invalidate-cdn-cache URL-MAP-NAME \
  --path "/developers/*"

# Invalidate specific files
gcloud compute url-maps invalidate-cdn-cache URL-MAP-NAME \
  --path "/developers/uploads/image.jpg"
```

**Add to GitHub Actions:**
```yaml
- name: Invalidate Cloud CDN cache
  run: |
    gcloud compute url-maps invalidate-cdn-cache ${{ secrets.CDN_URL_MAP }} \
      --path "/developers/*" \
      --async
```

---

## GCS-Specific Optimizations

### Compression

**Enable gzip compression for text assets:**

```bash
# Upload with gzip encoding
gsutil -h "Content-Encoding:gzip" \
  -h "Cache-Control:public, max-age=31536000" \
  cp -Z file.js gs://YOUR-BUCKET-NAME/developers/
```

**For automatic compression, use Cloud CDN** - it compresses responses automatically.

### Content-Type Detection

GCS automatically detects content types, but you can override:

```bash
# Set specific content type for images
gsutil -m setmeta -h "Content-Type:image/webp" \
  "gs://YOUR-BUCKET-NAME/developers/uploads/*.webp"
```

### Vary Header for WebP

Serve different formats based on browser support:

```bash
# Set Vary header for content negotiation
gsutil -m setmeta -h "Vary:Accept" \
  "gs://YOUR-BUCKET-NAME/developers/uploads/**"
```

---

## GitHub Actions Secrets Required

### Set these in your repository secrets:

```bash
# Google Cloud service account JSON key
GCP_SA_KEY='{
  "type": "service_account",
  "project_id": "your-project-id",
  "private_key_id": "...",
  "private_key": "...",
  "client_email": "...",
  ...
}'

# GCS bucket name
BUCKET_ID="your-bucket-name"

# Optional: Cloud CDN URL map (if using CDN)
CDN_URL_MAP="your-url-map-name"
```

### Service Account Permissions

Your service account needs:
- `roles/storage.objectAdmin` - Upload/modify objects
- `roles/compute.loadBalancerAdmin` - Invalidate CDN cache (optional)

```bash
# Grant storage permissions
gcloud projects add-iam-policy-binding YOUR-PROJECT-ID \
  --member="serviceAccount:YOUR-SA-EMAIL" \
  --role="roles/storage.objectAdmin"
```

---

## Testing GCS Configuration

### 1. Check Object Metadata

```bash
gsutil stat gs://YOUR-BUCKET-NAME/developers/uploads/test-image.jpg
```

**Expected output:**
```
Cache-Control: public, max-age=31536000, immutable
Content-Type: image/jpeg
```

### 2. Test from Browser

```bash
curl -I https://storage.googleapis.com/YOUR-BUCKET-NAME/developers/uploads/test-image.jpg
```

**Expected headers:**
```
HTTP/2 200
cache-control: public, max-age=31536000, immutable
content-type: image/jpeg
vary: Accept
```

### 3. Verify CDN Caching (if enabled)

```bash
curl -I https://your-domain.com/developers/uploads/test-image.jpg
```

**Expected headers:**
```
HTTP/2 200
cache-control: public, max-age=31536000, immutable
x-goog-stored-content-length: 123456
x-cache: HIT  # Second request should show HIT
age: 300  # Age in seconds since cached
```

---

## Cost Optimization

### Estimate Savings

**Before optimization:**
- 100 requests/day × 800KB average image = 80MB/day
- 80MB × 30 days = 2.4GB/month egress from GCS

**After optimization with Cloud CDN:**
- 90% cache hit rate at edge
- Only 10% requests hit GCS origin
- 2.4GB × 0.1 = 240MB/month egress from GCS
- **Savings: ~90% on egress costs**

### GCS Pricing (as of 2024)

| Resource | Cost |
|----------|------|
| Storage (Standard) | $0.020 per GB/month |
| Class A Operations | $0.05 per 10k ops |
| Class B Operations | $0.004 per 10k ops |
| Egress (to internet) | $0.12 per GB |
| **Cloud CDN Cache Fill** | $0.04 per GB |
| **Cloud CDN Cache Hit** | $0.02 per GB |

**With WebP (60% reduction):**
- Storage: 100MB → 40MB = -60%
- Egress cost: 2.4GB → 960MB = -60%
- **Monthly savings: ~$0.17/GB egress**

---

## Monitoring

### Cloud Monitoring Metrics

Track image performance:

```bash
# Cache hit ratio (if using Cloud CDN)
gcloud monitoring dashboards create --config-from-file=- <<EOF
{
  "displayName": "Image Optimization Dashboard",
  "mosaicLayout": {
    "columns": 12,
    "tiles": [
      {
        "width": 6,
        "height": 4,
        "widget": {
          "title": "CDN Cache Hit Ratio",
          "xyChart": {
            "dataSets": [{
              "timeSeriesQuery": {
                "timeSeriesFilter": {
                  "filter": "metric.type=\"loadbalancing.googleapis.com/https/backend_request_count\"",
                  "aggregation": {
                    "alignmentPeriod": "60s",
                    "perSeriesAligner": "ALIGN_RATE"
                  }
                }
              }
            }]
          }
        }
      }
    ]
  }
}
EOF
```

### Logging

Enable access logs to track image requests:

```bash
# Enable logging on bucket
gsutil logging set on -b gs://LOG-BUCKET-NAME \
  -o AccessLog gs://YOUR-BUCKET-NAME
```

---

## Troubleshooting

### Issue: Images not cached

**Check:**
```bash
gsutil stat gs://YOUR-BUCKET/developers/uploads/image.jpg | grep Cache-Control
```

**Fix:**
```bash
gsutil setmeta -h "Cache-Control:public, max-age=31536000, immutable" \
  gs://YOUR-BUCKET/developers/uploads/image.jpg
```

### Issue: CORS errors

**Check CORS config:**
```bash
gsutil cors get gs://YOUR-BUCKET
```

**Fix:**
```bash
gsutil cors set cors.json gs://YOUR-BUCKET
```

### Issue: Images not publicly accessible

**Fix permissions:**
```bash
gsutil iam ch allUsers:objectViewer gs://YOUR-BUCKET
```

---

## Load Balancer Configuration (Advanced)

If you want WebP auto-negotiation via Cloud CDN:

### URL Rewrite Rule

```bash
# Create URL rewrite (requires Load Balancer + Cloud CDN)
gcloud compute url-rewrites create webp-rewrite \
  --host-rule="*" \
  --path-matcher="path-matcher-name" \
  --path-rule="/uploads/*.jpg" \
  --rewrite-substitution="/uploads/*.webp"
```

### Cloud Function for Dynamic Format Selection

Deploy a Cloud Function to serve optimal format:

```javascript
// index.js
exports.serveOptimalImage = async (req, res) => {
  const accept = req.headers.accept || '';
  const path = req.path;

  // Check if browser supports WebP
  if (accept.includes('image/webp')) {
    const webpPath = path.replace(/\.(jpg|png)$/, '.webp');
    return res.redirect(301, webpPath);
  }

  return res.redirect(301, path);
};
```

---

## Summary

### GCP-Specific Features Implemented:

✅ **gsutil deployment** with cache headers
✅ **GCS bucket configuration** for public access
✅ **Cache-Control headers** for 1-year caching
✅ **Metadata updates** for existing images
✅ **GitHub Actions workflow** for automated deployment

### Optional Enhancements:

- ☐ Cloud CDN integration for global caching
- ☐ Cache invalidation on deploy
- ☐ Load balancer with URL rewrites
- ☐ Monitoring dashboard
- ☐ Access logging

---

## References

- [GCS Documentation](https://cloud.google.com/storage/docs)
- [Cloud CDN Documentation](https://cloud.google.com/cdn/docs)
- [gsutil Cache-Control](https://cloud.google.com/storage/docs/gsutil/addlhelp/WorkingWithObjectMetadata)
- [Cloud Load Balancing](https://cloud.google.com/load-balancing/docs)

---

**Last Updated:** 2026-01-19
**Platform:** Google Cloud Platform (GCS + Cloud CDN)
