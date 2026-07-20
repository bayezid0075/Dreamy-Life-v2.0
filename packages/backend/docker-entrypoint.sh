#!/bin/sh
set -e

echo ">>> Starting Dreamy Life Backend..."
cd /app

echo ">>> Running database migrations (best-effort)..."
/app/node_modules/.bin/drizzle-kit migrate || echo ">>> Migration skipped (tables may already exist)"

echo ">>> Starting server..."
exec node dist/main
