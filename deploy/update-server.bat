@echo off
:: ======================================================================
:: Culinary Quest — Update this server in one step
::
:: USE THIS ON THE SERVER, NOT YOUR DAY-TO-DAY PC.
:: Pulls the latest code, installs deps, rebuilds the app, and restarts it.
::
:: IMPORTANT: This NEVER touches your local .env file, so your API keys and
:: saved data stay intact across updates. Run it from this deploy\ folder.
:: ======================================================================
title Culinary Quest — Server Update

cd /d "%~dp0.."

echo.
echo  === Culinary Quest — Server Update ===
echo.

:: 1. Node.js available?
where node >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo  [ERROR] Node.js is not installed or not in your PATH.
    echo  Install Node.js v20+ from https://nodejs.org and try again.
    pause
    exit /b 1
)

:: 2. Stop the running server (if any) on port 5173
call :stop_server

:: 3. Pull the latest code (preserves local .env since it's gitignored)
echo  [1/4] Pulling latest code from origin...
git pull --ff-only origin main
if %ERRORLEVEL% neq 0 (
    echo.
    echo  [ERROR] git pull failed. Check that this is a git clone and that
    echo  you can reach origin - run git remote -v. No changes were applied.
    pause
    exit /b 1
)

:: 4. Install dependencies
echo  [2/4] Installing dependencies...
call npm install
if %ERRORLEVEL% neq 0 (
    echo  [ERROR] npm install failed.
    pause
    exit /b 1
)

:: 5. Build the production app
echo  [3/4] Building the app...
call npm run build
if %ERRORLEVEL% neq 0 (
    echo  [ERROR] Build failed.
    pause
    exit /b 1
)

:: 6. Start the server in the background
echo  [4/4] Starting the server...
start "Culinary Quest Server" /MIN cmd /c "cd /d %~dp0.. && npm start"

echo.
echo  === Update complete! ===
echo  The server is now running the latest build. Reach it via your Caddy
echo  HTTPS domain (deploy\Caddyfile) or directly at:
echo    http://localhost:5173   (this machine)
echo    http://<this-server-IP>:5173   (LAN)
echo.
pause
exit /b 0

:stop_server
for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":5173" ^| findstr "LISTENING" 2^>nul') do (
    taskkill /F /PID %%a >nul 2>&1
)
exit /b 0
