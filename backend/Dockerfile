# Production Dockerfile for System Design Intelligence Platform
# Build Stage
FROM node:20-alpine AS builder

# Set build environment
ENV NODE_ENV=development

WORKDIR /app

# Install build dependencies
# Note: Adding openssl for Prisma support on Alpine
RUN apk add --no-cache openssl

# Copy package files first for better caching
COPY package*.json ./
COPY prisma ./prisma/

# Install ALL dependencies (including devDependencies for build)
RUN npm ci

# Copy source code
COPY . .

# Generate Prisma client
RUN npm run db:generate

# Build TypeScript
RUN npm run build

# Production Stage
FROM node:20-alpine AS runner

# Set production environment
ENV NODE_ENV=production
ENV PORT=3000

WORKDIR /app

# Install runtime dependencies
# Note: tini for signal handling, openssl for Prisma
RUN apk add --no-cache tini openssl

# Security: Use non-root user
# The 'node' user is provided by the base alpine image
RUN chown node:node /app

# Copy production dependencies only
COPY --from=builder /app/package*.json ./
RUN npm ci --only=production

# Copy built artifacts and Prisma files
COPY --from=builder --chown=node:node /app/dist ./dist
COPY --from=builder --chown=node:node /app/prisma ./prisma
COPY --from=builder --chown=node:node /app/node_modules/.prisma ./node_modules/.prisma

# Set user
USER node

# Expose application port
EXPOSE 3000

# Metadata
LABEL maintainer="System Design Intelligence Team"
LABEL version="1.0.0"
LABEL description="Production-grade System Design Intelligence Platform Backend"

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=30s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Use tini as entrypoint to handle signals correctly
ENTRYPOINT ["/sbin/tini", "--"]

# Start application
CMD ["node", "dist/index.js"]

