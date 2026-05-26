@echo off
chcp 65001 >nul 2>&1
cd /d "%~dp0"

if not exist "node_modules" (
    echo 首次运行，正在安装依赖...
    pnpm install
    if errorlevel 1 (
        echo 依赖安装失败，请检查网络连接或 pnpm 是否已安装。
        pause
        exit /b 1
    )
    echo 依赖安装完成。
)

echo 正在启动 demo 开发服务器...
pnpm dev:demo
pause
