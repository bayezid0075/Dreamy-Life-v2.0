#!/usr/bin/env bash
# =============================================================================
# Dreamy Life — PC Build & Push
# Run on PC after git push. Builds images and pushes to GHCR.
# Usage: bash build-and-push.sh
# =============================================================================
set -euo pipefail

COMPOSE="docker compose -f docker-compose.prod.yml"

echo "==========================================="
echo "  Dreamy Life — Build & Push to GHCR"
echo "==========================================="

# ── Step 1: Build all images ────────────────────────────────────────────
echo ">>> [1/2] Building images..."
COMPOSE_DOCKER_CLI_BUILD=1 DOCKER_BUILDKIT=1 \
  $COMPOSE build

# ── Step 2: Push to GHCR ───────────────────────────────────────────────
echo ">>> [2/2] Pushing to GHCR..."
$COMPOSE push

echo ""
echo "==========================================="
echo "  Build & Push complete!"
echo "==========================================="
echo ""
echo "  Images pushed:"
echo "    - ghcr.io/bayezid0075/dreamy-life-backend:latest"
echo "    - ghcr.io/bayezid0075/dreamy-life-web:latest"
echo "    - ghcr.io/bayezid0075/dreamy-life-admin:latest"
echo ""
echo "  Next: SSH into VPS and run:"
echo "    cd /root/Dreamy-Life-v2.0"
echo "    bash deploy.sh"
echo "==========================================="
