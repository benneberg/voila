#!/bin/sh
set -e

echo "Starting Voila! services…"

# Start nginx in background
nginx -g 'daemon off;' &
NGINX_PID=$!

# Start FastAPI with uvicorn
cd /app/backend
exec uvicorn main:app \
  --host "${BACKEND_HOST:-0.0.0.0}" \
  --port "${BACKEND_PORT:-8000}" \
  --workers "${BACKEND_WORKERS:-4}" \
  --log-level "${LOG_LEVEL:-info}" \
  --proxy-headers \
  --forwarded-allow-ips="*"
