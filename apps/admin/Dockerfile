# Builder stage for Admin Panel
FROM node:20-bookworm-slim AS builder
WORKDIR /app

# Install system build tools (needed for native modules)
RUN apt-get update && apt-get install -y python3 make g++ && rm -rf /var/lib/apt/lists/*

# Avoid IPv6 resolution issues in Docker
ENV NODE_OPTIONS="--dns-result-order=ipv4first"

# Use hoisted linker to create flat node_modules (avoids symlink issues in Docker overlayfs)
ENV npm_config_node_linker=hoisted

# Copy workspace manifests for layer caching
COPY package.json pnpm-workspace.yaml ./
COPY packages/shared-types/package.json ./packages/shared-types/package.json
COPY packages/api-client/package.json ./packages/api-client/package.json
COPY apps/admin/package.json ./apps/admin/package.json

# Install ALL dependencies (hoisted linker creates flat node_modules at root level)
RUN corepack enable && pnpm install --no-frozen-lockfile

# Copy the rest of the source code (node_modules excluded via .dockerignore)
COPY . .

# Build: invoke binaries directly from root node_modules to avoid pnpm/turbo
# workspace binary resolution issues in Docker overlayfs
RUN /app/node_modules/.bin/tsc -p /app/packages/shared-types/tsconfig.json && \
    /app/node_modules/.bin/tsc -p /app/packages/api-client/tsconfig.json && \
    cd /app/apps/admin && /app/node_modules/.bin/next build

# Production stage
FROM node:20-bookworm-slim
WORKDIR /app

# Copy built admin app and production dependencies
COPY --from=builder /app/apps/admin/.next ./.next
COPY --from=builder /app/apps/admin/public ./public
COPY --from=builder /app/apps/admin/package.json ./package.json
COPY --from=builder /app/node_modules ./node_modules

EXPOSE 3001
CMD ["npm", "start"]
