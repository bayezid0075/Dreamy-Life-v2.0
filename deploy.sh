#!/usr/bin/env bash
# =============================================================================
# Dreamy Life — VPS Deploy (Fast Mode)
# Build on PC, pull on VPS. Total VPS time: ~2 minutes.
# Usage: bash deploy.sh
# =============================================================================
set -euo pipefail

APP_DIR="/root/Dreamy-Life-v2.0"
COMPOSE="docker compose -p prod -f docker-compose.prod.yml"

cd "$APP_DIR"

echo "==========================================="
echo "  Dreamy Life Deploy (Fast Mode)"
echo "==========================================="

# ── Step 0: Ensure swap (one-time, critical for 2GB VPS) ────────────────
if [ ! -f /swapfile ]; then
  echo ">>> Creating 2GB swap (one-time)..."
  fallocate -l 2G /swapfile
  chmod 600 /swapfile
  mkswap /swapfile
  swapon /swapfile
  echo '/swapfile none swap sw 0 0' >> /etc/fstab
  free -h
fi

# ── Step 1: Pre-flight checks + stop conflicting containers ─────────────
echo ">>> [1/6] Pre-flight checks..."

# Stop dev containers if running (prevents network conflicts)
echo ">>> Stopping dev containers (if any)..."
docker compose -f docker-compose.yml down 2>/dev/null || true

# Stop old prod containers without -p flag (from previous deploys)
docker compose -f docker-compose.prod.yml down 2>/dev/null || true

# Disk space check
DISK_FREE=$(df -BG / | awk 'NR==2 {print $4}' | tr -d 'G')
if [ "$DISK_FREE" -lt 2 ]; then
  echo ">>> WARNING: Only ${DISK_FREE}GB disk free. Cleaning up..."
  docker system prune -f
  docker builder prune -f
fi

# Memory check
MEM_AVAIL=$(free -m | awk '/Mem:/ {print $7}')
if [ "$MEM_AVAIL" -lt 200 ]; then
  echo ">>> WARNING: Only ${MEM_AVAIL}MB memory available."
fi

echo ">>> Disk: ${DISK_FREE}GB free | Memory: ${MEM_AVAIL}MB available"

# ── Step 2: Pull latest code ────────────────────────────────────────────
echo ">>> [2/6] Pulling latest code..."
git pull origin master

# ── Step 3: Pull pre-built images from GHCR ─────────────────────────────
echo ">>> [3/6] Pulling images from GHCR..."
$COMPOSE pull migrate backend web admin

# ── Step 4: Start postgres + redis first, then run migrations ───────────
echo ">>> [4/6] Starting database and running migrations..."
$COMPOSE up -d postgres redis
sleep 10

# Verify postgres accepts our password — if not, volume has stale creds
echo ">>> Verifying database connection..."
if ! docker run --rm --network "prod_default" postgres:15-alpine \
  psql "postgresql://postgres:2516@postgres:5432/dreamy_life" -c "SELECT 1;" >/dev/null 2>&1; then
  echo ">>> Postgres rejected password. Volume has stale credentials."
  echo ">>> Recreating database volume (no real data yet)..."
  $COMPOSE down -v
  $COMPOSE up -d postgres redis
  sleep 15
fi

$COMPOSE run --rm migrate

# ── Step 5: Restart all services ────────────────────────────────────────
echo ">>> [5/6] Restarting all services..."
$COMPOSE up -d --remove-orphans

# ── Step 6: Health check ────────────────────────────────────────────────
echo ">>> [6/6] Health check..."
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

# ── Cleanup ─────────────────────────────────────────────────────────────
echo ">>> Cleaning up..."
docker image prune -f
docker builder prune -f 2>/dev/null || true

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
