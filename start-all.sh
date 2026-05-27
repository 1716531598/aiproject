#!/bin/bash
# Start both backend and frontend
# Backend: localhost:888   Frontend: localhost:8000
# Ctrl+C to stop all services

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
cleanup() {
    echo ""
    echo "Stopping all services..."
    kill $(jobs -p) 2>/dev/null
    wait 2>/dev/null
    echo "Stopped"
    exit 0
}
trap cleanup INT TERM

cd "$SCRIPT_DIR/server"
echo "Starting backend on http://localhost:888 ..."
python app.py &

cd "$SCRIPT_DIR/web_react"
echo "Starting frontend on http://localhost:8000 ..."
pnpm dev:demo &

echo ""
echo "========================================="
echo "  Backend:  http://localhost:888"
echo "  Frontend: http://localhost:8000"
echo "  Press Ctrl+C to stop all"
echo "========================================="
echo ""

wait
