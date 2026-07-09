#!/usr/bin/env bash
# =============================================================================
# Dreamy Life — VPS Deploy Script
# Run manually on the VPS:  bash deploy.sh
# =============================================================================
set -euo pipefail

APP_DIR="/root/Dreamy-Life-v2.0"
COMPOSE_FILE="docker-compose.prod.yml"

cd "$APP_DIR"

echo "=== Pulling latest code ==="
git pull origin master

echo "=== Building (low-memory mode) ==="
COMPOSE_DOCKER_CLI_BUILD=1 DOCKER_BUILDKIT=1 \
  docker compose -f "$COMPOSE_FILE" build \
  --build-arg NODE_OPTIONS="--max-old-space-size=512"

echo "=== Restarting containers ==="
docker compose -f "$COMPOSE_FILE" up -d --remove-orphans

echo "=== Pruning old images ==="
docker image prune -f

echo "=== Waiting for health check ==="
sleep 10

if curl -sf http://localhost:4000/health > /dev/null 2>&1; then
  echo "Backend is healthy!"
else
  echo "WARNING: Backend health check failed. Checking logs..."
  docker compose -f "$COMPOSE_FILE" logs backend --tail=20
fi

echo "=== Done ==="
