#!/usr/bin/env bash
# =============================================================================
# Dreamy Life — View Error Logs
# Usage: bash view-errors.sh [dev|prod]
# =============================================================================
set -euo pipefail

MODE="${1:-prod}"
APP_DIR="/root/Dreamy-Life-v2.0"
COMPOSE="docker compose -f docker-compose.prod.yml"

echo "==========================================="
echo "  Dreamy Life — Error Logs ($MODE)"
echo "==========================================="

if [ "$MODE" = "dev" ]; then
  echo ""
  echo ">>> Development errors (local):"
  echo ""
  LOG_FILE="packages/backend/logs/dev-errors.json"
  if [ -f "$LOG_FILE" ]; then
    cat "$LOG_FILE"
  else
    echo "No dev error log found."
  fi

elif [ "$MODE" = "prod" ]; then
  echo ""
  echo ">>> Production errors (from Docker volume):"
  echo ""
  $COMPOSE exec -T backend cat /app/logs/errors.json 2>/dev/null || echo "No production error log found."

  echo ""
  echo ">>> Recent backend logs (last 50 lines):"
  echo ""
  $COMPOSE logs backend --tail=50

else
  echo "Usage: bash view-errors.sh [dev|prod]"
  exit 1
fi

echo ""
echo "==========================================="
