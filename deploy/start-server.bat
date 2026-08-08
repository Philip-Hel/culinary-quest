@echo off
:: ======================================================================
:: Culinary Quest — Start the server on this machine (for Scheduled Task
:: auto-start, or to run it after stopping). Serves the built app on
:: port 5173. No browser opens; a reverse proxy (deploy\Caddyfile) can
:: expose it over HTTPS to your domain.
:: ======================================================================
title Culinary Quest — Start Server

cd /d "%~dp0.."

:: Kill any existing instance on port 5173 first so we don't double-run
for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":5173" ^| findstr "LISTENING" 2^>nul') do (
    taskkill /F /PID %%a >nul 2>&1
)

start "Culinary Quest Server" /MIN cmd /c "cd /d %~dp0.. && npm start"

echo.
echo  Server starting... wait a few seconds then visit:
echo    http://localhost:5173
echo    http://<this-server-ip>:5173   (LAN)
echo.
timeout /t 2 /nobreak >nul
exit /b 0
