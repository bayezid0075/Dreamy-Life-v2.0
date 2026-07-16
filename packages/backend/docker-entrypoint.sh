#!/bin/sh

echo "============================================="
echo "  Dreamy Life Backend — Starting..."
echo "============================================="
echo "NODE_ENV=$NODE_ENV"
echo "PORT=$PORT"
echo "DB_HOST=$DB_HOST"
echo "REDIS_HOST=$REDIS_HOST"
echo "DATABASE_URL=${DATABASE_URL:+<set>}"
echo "ERROR_LOG_DIR=$ERROR_LOG_DIR"

cd /app

echo ">>> Syncing database schema..."
if npx drizzle-kit push:pg 2>&1; then
  echo ">>> Schema sync completed successfully."
else
  echo ">>> WARNING: Schema sync failed (exit $?), trying migration fallback..."
  if npx drizzle-kit migrate 2>&1; then
    echo ">>> Migration fallback completed."
  else
    echo ">>> ERROR: Both push and migrate failed. Starting server anyway..."
  fi
fi

echo ">>> Starting backend server..."
exec node dist/main
