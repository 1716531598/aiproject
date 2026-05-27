#!/bin/bash
# Start frontend Umi dev server on port 8000
# Proxy /api -> localhost:888

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$SCRIPT_DIR/web_react"

echo "Starting frontend on http://localhost:8000 ..."
pnpm dev:demo
