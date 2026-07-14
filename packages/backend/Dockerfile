# Build stage
FROM node:20-bookworm-slim AS builder
WORKDIR /app

# Install system build tools
RUN apt-get update && apt-get install -y python3 make g++ && rm -rf /var/lib/apt/lists/*

# Avoid IPv6 resolution issues
ENV NODE_OPTIONS="--dns-result-order=ipv4first"

# Use hoisted linker to create flat node_modules (avoids symlink issues in Docker overlayfs)
ENV npm_config_node_linker=hoisted

# Copy only workspace and package files first to leverage Docker cache
COPY package.json pnpm-workspace.yaml ./
COPY packages/backend/package.json ./packages/backend/package.json
COPY packages/shared-types/package.json ./packages/shared-types/package.json
COPY packages/api-client/package.json ./packages/api-client/package.json

# Restore pnpm via Corepack and install dependencies
RUN corepack enable && pnpm install --no-frozen-lockfile

# Now copy the rest of the source code
COPY . .

# Build the backend and its dependencies using tsc directly
RUN /app/node_modules/.bin/tsc -p /app/packages/shared-types/tsconfig.json && \
    /app/node_modules/.bin/tsc -p /app/packages/api-client/tsconfig.json && \
    /app/node_modules/.bin/tsc -p /app/packages/backend/tsconfig.build.json

# Production stage
FROM node:20-bookworm-slim
WORKDIR /app

# Copy built assets and node_modules from builder
COPY --from=builder /app/packages/backend/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/packages/backend/package.json ./package.json

# Copy Drizzle migration files and config (needed for automated migrations)
COPY --from=builder /app/packages/backend/drizzle.config.ts ./drizzle.config.ts
COPY --from=builder /app/packages/backend/drizzle ./drizzle
COPY --from=builder /app/packages/backend/src/infrastructure/database/schema.ts ./src/infrastructure/database/schema.ts

# Copy entrypoint script (runs migrations then starts server)
COPY --from=builder /app/packages/backend/docker-entrypoint.sh ./docker-entrypoint.sh
RUN chmod +x ./docker-entrypoint.sh

EXPOSE 4000
CMD ["./docker-entrypoint.sh"]
