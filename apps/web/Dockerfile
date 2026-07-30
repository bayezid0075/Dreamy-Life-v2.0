# Builder stage for Web Frontend
FROM node:20-bookworm-slim AS builder
WORKDIR /app

# Install system build tools
RUN apt-get update && apt-get install -y python3 make g++ && rm -rf /var/lib/apt/lists/*

ENV NODE_OPTIONS="--dns-result-order=ipv4first"
ENV npm_config_node_linker=hoisted

# Copy workspace manifests
COPY package.json pnpm-workspace.yaml ./
COPY packages/shared-types/package.json ./packages/shared-types/package.json
COPY packages/api-client/package.json ./packages/api-client/package.json
COPY packages/utils/package.json ./packages/utils/package.json
COPY apps/web/package.json ./apps/web/package.json

# Install dependencies
RUN corepack enable && pnpm install --no-frozen-lockfile

# Copy source
COPY . .

# Build-time API URL for client-side requests
ARG NEXT_PUBLIC_API_URL=http://localhost:4000
ENV NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL}

# Build
RUN /app/node_modules/.bin/tsc -p /app/packages/shared-types/tsconfig.json && \
    /app/node_modules/.bin/tsc -p /app/packages/api-client/tsconfig.json && \
    cd /app/apps/web && /app/node_modules/.bin/next build

# Production stage
FROM node:20-bookworm-slim
WORKDIR /app

COPY --from=builder /app/apps/web/.next ./.next
COPY --from=builder /app/apps/web/public ./public
COPY --from=builder /app/apps/web/package.json ./package.json
COPY --from=builder /app/node_modules ./node_modules

EXPOSE 3000
CMD ["npm", "start"]
