@echo off
:: ======================================================================
:: Culinary Quest - Install and start Caddy (LAN-only HTTPS reverse proxy)
::
:: Run this ONCE on the server, AS ADMINISTRATOR. It:
::   1. Installs Go (via winget) if missing.
::   2. Installs xcaddy and builds a Caddy binary that INCLUDES the Cloudflare
::      DNS plugin (needed for the DNS-01 cert). The stock Caddy binary does
::      NOT include this plugin.
::   3. Writes C:\Caddy\Caddyfile from the Caddyfile next to this script
::      (EDIT deploy\Caddyfile first: replace your-domain.com with your real
::      domain and set your Cloudflare email).
::   4. Prompts for the Cloudflare API token.
::   5. Starts Caddy: https://your-domain.com -> localhost:5173
::
:: PREREQUISITES (do these first):
::   - The app is running on localhost:5173 (run deploy\start-server.bat)
::   - A DNS record:  your-domain.com -> <this-server-IP>
::   - A Cloudflare API token with DNS edit on the zone for your domain.
::   - A writable working directory, e.g. C:\Caddy.
:: ======================================================================
title Culinary Quest - Install Caddy
setlocal enabledelayedexpansion

:: ---- 1. Admin check ----
net session >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo  [ERROR] Please run as Administrator - right-click and choose "Run as administrator".
    pause
    exit /b 1
)

:: ---- 2. Working dir + config ----
if not exist "C:\Caddy" mkdir "C:\Caddy"
if not exist "C:\Caddy\bin" mkdir "C:\Caddy\bin"
set "SRC_CFG=%~dp0Caddyfile"
if not exist "%SRC_CFG%" (
    echo  [ERROR] Caddyfile not found next to this script: %SRC_CFG%
    pause
    exit /b 1
)

:: ---- 3. Ensure Go is installed ----
where go >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo  [1/5] Installing Go via winget...
    winget install --id GoLang.Go --accept-source-agreements --accept-package-agreements
    if %ERRORLEVEL% neq 0 (
        echo  [ERROR] Go install failed. Install Go from https://go.dev/dl then re-run.
        pause
        exit /b 1
    )
)

:: ---- 4. Build Caddy with the Cloudflare plugin (if we don't already have it) ----
if not exist "C:\Caddy\caddy.exe" (
    echo  [2/5] Building Caddy with the Cloudflare DNS plugin...
    set "GOBIN=C:\Caddy\bin"
    set "GOPATH=C:\Caddy\gopath"
    set "PATH=!PATH!;!GOBIN!;C:\Program Files\Go\bin"
    call go install github.com/caddyserver/xcaddy/cmd/xcaddy@latest
    if %ERRORLEVEL% neq 0 (
        echo  [ERROR] xcaddy install failed.
        pause
        exit /b 1
    )
    call xcaddy build --with github.com/caddy-dns/cloudflare --output C:\Caddy\caddy.exe
    if not exist "C:\Caddy\caddy.exe" (
        echo  [ERROR] Caddy build failed. See the build errors above.
        pause
        exit /b 1
    )
    echo   Built plugin-enabled Caddy at C:\Caddy\caddy.exe
) else (
    echo  [2/5] Plugin-enabled Caddy already present at C:\Caddy\caddy.exe
)

:: ---- 5. Write the Caddyfile ----
echo  [3/5] Writing Caddy config...
copy /Y "%SRC_CFG%" "C:\Caddy\Caddyfile" >nul

:: ---- 6. Cloudflare API token ----
:: Set it in THIS session so the launched Caddy inherits it immediately.
echo  [4/5] Cloudflare API token check...
if not "%CF_DNS_API_TOKEN%"=="" goto token_done
echo   A Cloudflare API token with DNS edit on your zone is needed for the
echo   Let's Encrypt cert via DNS-01 for your-domain.com.
echo   Leave blank to skip and set it yourself later.
echo.
set /p TOKEN=   Enter Cloudflare API token or press Enter to skip: 
if not "%TOKEN%"=="" (
    set "CF_DNS_API_TOKEN=!TOKEN!"
    setx CF_DNS_API_TOKEN "!TOKEN!" >nul
)
:token_done

:: ---- 7. Start Caddy ----
echo  [5/5] Starting Caddy...
start "Caddy Server" /MIN cmd /c "set CF_DNS_API_TOKEN=!CF_DNS_API_TOKEN! && C:\Caddy\caddy.exe run --config C:\Caddy\Caddyfile"

echo.
echo  === Caddy started ===
echo  Caddy is proxying  https://your-domain.com  ->  localhost:5173
echo  (EDIT deploy\Caddyfile and re-run if your domain differs.)
echo  It obtains/renews the Let's Encrypt cert automatically via the Cloudflare token.
echo  To run in the foreground to see errors:
echo    C:\Caddy\caddy.exe run --config C:\Caddy\Caddyfile
echo.
pause
exit /b 0
