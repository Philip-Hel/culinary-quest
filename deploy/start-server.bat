@echo off
:: ======================================================================
:: Culinary Quest — Start the server on this machine (for Scheduled Task
:: auto-start, or to run it after stopping). Serves the built app on
:: port 5173. No browser opens; a reverse proxy (deploy\Caddyfile) can
:: expose it over HTTPS to your domain.
::
:: NOTE: this runs from a Scheduled Task as the SYSTEM account at boot, so
:: it must NOT rely on the user's PATH or an interactive shell. We resolve
:: node.exe explicitly and run `node server.mjs` directly (no npm), and log
:: output to deploy\server.log so boot failures are diagnosable.
:: ======================================================================
title Culinary Quest — Start Server

setlocal
cd /d "%~dp0.."
set "REPO=%~dp0.."
set "LOG=%~dp0server.log"

:: --- Resolve node.exe (PATH first, then the usual install locations) ---
set "NODE_EXE="
for %%P in (node.exe) do if not defined NODE_EXE set "NODE_EXE=%%~$PATH:P"
if not defined NODE_EXE if exist "C:\Program Files\nodejs\node.exe" set "NODE_EXE=C:\Program Files\nodejs\node.exe"
if not defined NODE_EXE if exist "%ProgramFiles%\nodejs\node.exe" set "NODE_EXE=%ProgramFiles%\nodejs\node.exe"
if not defined NODE_EXE if exist "%ProgramFiles(x86)%\nodejs\node.exe" set "NODE_EXE=%ProgramFiles(x86)%\nodejs\node.exe"
if not defined NODE_EXE if exist "%LOCALAPPDATA%\Programs\nodejs\node.exe" set "NODE_EXE=%LOCALAPPDATA%\Programs\nodejs\node.exe"

if not defined NODE_EXE (
    echo  [ERROR] Could not find node.exe. Install Node.js or add it to the system PATH. >>"%LOG%"
    echo  [ERROR] Could not find node.exe. Install Node.js or add it to the system PATH.
    exit /b 1
)

:: Kill any existing instance on port 5173 first so we don't double-run
for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":5173" ^| findstr "LISTENING" 2^>nul') do (
    taskkill /F /PID %%a >nul 2>&1
)

echo  [%DATE% %TIME%] Starting Culinary Quest server with "%NODE_EXE%" >>"%LOG%"

:: Run node directly (works under SYSTEM without npm/PATH), minimized, and
:: append stdout/stderr to the log so boot-time problems are visible.
start "Culinary Quest Server" /MIN cmd /c ""%NODE_EXE%" "%REPO%\server.mjs" >>"%LOG%" 2>&1"

echo.
echo  Server starting... wait a few seconds then visit:
echo    http://localhost:5173
echo    http://<this-server-ip>:5173   (LAN)
echo.
echo  Log: %LOG%
timeout /t 2 /nobreak >nul
exit /b 0
