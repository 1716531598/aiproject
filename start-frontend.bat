@echo off
REM Start frontend Umi dev server on port 8000
REM Proxy /api -> localhost:888

cd /d "%~dp0web_react"

echo Starting frontend on http://localhost:8000 ...
pnpm dev:demo
pause
