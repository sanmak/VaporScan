# Stage 1: Builder
FROM node:24-alpine AS builder

# Set working directory
WORKDIR /app

# Set build-time environment
# We don't set NODE_ENV=production here to ensure devDependencies are installed correctly for the build
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

# Build the application
RUN npm run build

# Stage 2: Runtime
FROM node:24-alpine AS runner

WORKDIR /app

# Set production environment
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Install dumb-init for proper signal handling
RUN apk add --no-cache dumb-init

# Copy only necessary files from builder
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/next.config.js ./

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nextjs -u 1001 && \
    chown -R nextjs:nodejs /app

# Switch to non-root user
USER nextjs

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000', (r) => {if (r.statusCode !== 200) throw new Error(r.statusCode)})"

# Use dumb-init
ENTRYPOINT ["dumb-init", "--"]

# Start the application
CMD ["node_modules/.bin/next", "start"]
