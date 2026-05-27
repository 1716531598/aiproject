@echo off
REM Start both backend and frontend
REM Backend: http://localhost:888   Frontend: http://localhost:8000
REM Close the popup windows to stop services

echo Starting backend and frontend ...
echo.

set "SCRIPT_DIR=%~dp0"

start "Ironman-Backend" cmd /k "cd /d %SCRIPT_DIR%server && python app.py"

timeout /t 2 /nobreak >nul

start "Ironman-Frontend" cmd /k "cd /d %SCRIPT_DIR%web_react && pnpm dev:demo"

echo =========================================
echo   Backend:  http://localhost:888
echo   Frontend: http://localhost:8000
echo   Close popup windows to stop services
echo =========================================
echo.
pause
