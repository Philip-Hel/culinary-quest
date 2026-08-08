@echo off
:: ======================================================================
:: Culinary Quest - Register a Windows Scheduled Task to start Caddy
:: automatically when this machine boots.
::
:: Run this ONCE on the server (as admin), AFTER install-caddy.bat has
:: built the plugin-enabled binary and written C:\Caddy\Caddyfile.
:: Creates a task named "CulinaryQuestCaddy" that runs Caddy at startup.
:: To remove later:  schtasks /Delete /TN CulinaryQuestCaddy /F
:: ======================================================================
title Culinary Quest - Install Caddy Auto-Start Task

net session >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo  [ERROR] Please run as Administrator.
    pause
    exit /b 1
)

if not exist "C:\Caddy\caddy.exe" (
    echo  [ERROR] C:\Caddy\caddy.exe not found.
    echo          Run deploy\install-caddy.bat first to build and configure Caddy.
    pause
    exit /b 1
)

echo  Registering a boot-time task that starts Caddy with your config...
schtasks /Create /TN "CulinaryQuestCaddy" /TR "C:\Caddy\caddy.exe run --config C:\Caddy\Caddyfile" /SC ONSTART /RL HIGHEST /F

if %ERRORLEVEL% neq 0 (
    echo.
    echo  [ERROR] Failed to register the task.
    pause
    exit /b 1
)

echo.
echo  === Caddy auto-start task installed ===
echo  Caddy will proxy https://your-domain.com -^> localhost:5173 at every boot.
echo  Verify with:  schtasks /Query /TN CulinaryQuestCaddy
echo.
pause
exit /b 0
