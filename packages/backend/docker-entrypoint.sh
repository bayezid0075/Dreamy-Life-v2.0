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

echo ">>> Running database migrations..."
if npx drizzle-kit migrate 2>&1; then
  echo ">>> Migrations completed successfully."
else
  echo ">>> WARNING: Migrations failed (exit $?), continuing anyway..."
fi

echo ">>> Starting backend server..."
exec node dist/main
