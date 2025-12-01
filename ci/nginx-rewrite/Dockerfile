FROM google/cloud-sdk:alpine AS fetcher

# Fetch the developers content from GCS
RUN mkdir -p /content/developers && \
    gsutil -m rsync -r gs://interledger-org-developers-portal/developers/ /content/developers/

FROM nginx:alpine

# Copy the fetched content
COPY --from=fetcher /content /usr/share/nginx/html

# Copy custom nginx configuration
COPY nginx.conf /etc/nginx/nginx.conf

# Ensure nginx runs as non-root (Cloud Run requirement)
RUN touch /var/run/nginx.pid && \
    chown -R nginx:nginx /var/run/nginx.pid && \
    chown -R nginx:nginx /var/cache/nginx && \
    chown -R nginx:nginx /var/log/nginx && \
    chown -R nginx:nginx /usr/share/nginx/html

USER nginx

EXPOSE 8080

CMD ["nginx", "-g", "daemon off;"]
