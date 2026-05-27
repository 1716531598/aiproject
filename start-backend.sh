#!/bin/bash
# Start backend Flask server on port 888
# Usage: ./start-backend.sh [--e2e]

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$SCRIPT_DIR/server"

if [ "$1" = "--e2e" ]; then
    export E2E_MODE=true
    echo "[E2E] Captcha bypass enabled"
fi

echo "Starting backend on http://localhost:888 ..."
python app.py
