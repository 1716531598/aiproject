@echo off
REM Start backend Flask server on port 888
REM Usage: start-backend.bat [--e2e]

cd /d "%~dp0server"

if "%1"=="--e2e" (
    set E2E_MODE=true
    echo [E2E] Captcha bypass enabled
)

echo Starting backend on http://localhost:888 ...
python app.py
pause
