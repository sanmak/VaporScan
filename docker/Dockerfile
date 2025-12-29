# Stage 1: Builder
FROM node:24-alpine AS builder

# Set working directory
WORKDIR /app

# Set build-time environment
ENV NEXT_TELEMETRY_DISABLED=1
ENV ADAPTER_SKIP_PREPARE=1
ENV HUSKY=0

# Install build essentials for native modules (if any)
RUN apk add --no-cache python3 make g++

# Copy package files
COPY package*.json ./

# Install dependencies
# Using --legacy-peer-deps to handle conflicts between ESLint 9/React 19/Next 16
RUN npm install --no-audit --no-fund --legacy-peer-deps

# Copy source code
COPY . .

# Build the application (static export)
RUN npm run build

# Stage 2: Runtime with Nginx
FROM nginx:alpine AS runner

# Install dumb-init for proper signal handling
RUN apk add --no-cache dumb-init

# Copy nginx configuration
COPY docker/nginx.conf /etc/nginx/nginx.conf

# Copy static files from builder
COPY --from=builder /app/out /usr/share/nginx/html

# Set proper permissions for Nginx directories
RUN chown -R nginx:nginx /usr/share/nginx/html && \
    chown -R nginx:nginx /var/cache/nginx && \
    chown -R nginx:nginx /var/log/nginx && \
    chown -R nginx:nginx /etc/nginx/conf.d && \
    touch /var/run/nginx.pid && \
    chown -R nginx:nginx /var/run/nginx.pid

# Expose port
EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:8080/ || exit 1

# Use dumb-init
ENTRYPOINT ["dumb-init", "--"]

# Start nginx as root (required for binding to ports)
CMD ["nginx", "-g", "daemon off;"]
