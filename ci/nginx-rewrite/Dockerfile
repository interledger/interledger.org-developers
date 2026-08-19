FROM nginx:alpine

# Install ca-certificates for SSL verification when proxying to Netlify
RUN apk add --no-cache ca-certificates

# Copy custom nginx configuration
COPY nginx.conf /etc/nginx/nginx.conf

# Ensure nginx runs as non-root (Cloud Run requirement)
RUN touch /var/run/nginx.pid && \
    chown -R nginx:nginx /var/run/nginx.pid && \
    chown -R nginx:nginx /var/cache/nginx && \
    chown -R nginx:nginx /var/log/nginx

USER nginx

EXPOSE 8080

CMD ["nginx", "-g", "daemon off;"]
