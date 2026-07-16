#!/usr/bin/env bash
# =============================================================================
# Dreamy Life — VPS Deploy
# Run on VPS: bash deploy.sh
# Flow: pull → build → migrate → restart → health check
# =============================================================================
set -euo pipefail

APP_DIR="/root/Dreamy-Life-v2.0"
COMPOSE="docker compose -f docker-compose.prod.yml"

cd "$APP_DIR"

echo "==========================================="
echo "  Dreamy Life Deploy"
echo "==========================================="

# ── Step 0: Ensure swap exists (critical for 1-core / 2GB VPS) ──────────
if [ ! -f /swapfile ]; then
  echo ">>> No swap found. Creating 2GB swap (one-time setup)..."
  fallocate -l 2G /swapfile
  chmod 600 /swapfile
  mkswap /swapfile
  swapon /swapfile
  echo '/swapfile none swap sw 0 0' >> /etc/fstab
  echo ">>> Swap created."
  free -h
fi

# ── Step 1: Pull latest code ────────────────────────────────────────────
echo ">>> [1/5] Pulling latest code..."
git pull origin master

# ── Step 2: Build images ───────────────────────────────────────────────
echo ">>> [2/5] Building images (5-10 min on 1-core VPS)..."
COMPOSE_DOCKER_CLI_BUILD=1 DOCKER_BUILDKIT=1 \
  $COMPOSE build --build-arg NODE_OPTIONS="--max-old-space-size=512"

# ── Step 3: Restart containers ──────────────────────────────────────────
echo ">>> [3/5] Restarting containers..."
$COMPOSE up -d --remove-orphans

# ── Step 4: Health check (backend runs migrations on startup) ───────────
echo ">>> [4/5] Waiting for backend (migrations running inside container)..."
for i in $(seq 1 12); do
  sleep 10
  if curl -sf http://localhost:4000/ > /dev/null 2>&1; then
    echo ">>> Backend is healthy!"
    break
  fi
  if [ "$i" -eq 12 ]; then
    echo ">>> WARNING: Backend not responding after 2 minutes."
    echo ">>> Last 30 lines of backend logs:"
    $COMPOSE logs backend --tail=30
  else
    echo ">>> Attempt $i/12..."
  fi
done

# ── Step 5: Cleanup ─────────────────────────────────────────────────────
echo ">>> [5/5] Cleaning up old Docker images..."
docker image prune -f

echo ""
echo "==========================================="
echo "  Deploy complete!"
echo "==========================================="
$COMPOSE ps
echo ""
echo "  Web:   http://bayezid.dreamy-life.com:3000"
echo "  Admin: http://bayezid.dreamy-life.com:3001"
echo "  API:   http://bayezid.dreamy-life.com:4000"
echo "==========================================="
