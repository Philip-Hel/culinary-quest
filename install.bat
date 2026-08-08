@echo off
:: ======================================================================
:: Culinary Quest — One-time setup
:: Run this ONCE to install dependencies, build the app, and create a
:: desktop shortcut. After that, just double-click "Culinary Quest"
:: on your desktop to start it (or use deploy\start-server.bat for a
:: server that keeps running and can be reverse-proxied to a domain).
:: ======================================================================
title Culinary Quest — Setup

echo.
echo  === Culinary Quest — One-Time Setup ===
echo.

:: 1. Check Node.js is available
where node >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo  [ERROR] Node.js is not installed or not in your PATH.
    echo  Please install Node.js v20+ from https://nodejs.org
    echo  and run this script again.
    pause
    exit /b 1
)

:: 2. Optional: copy API keys (Spoonacular / DeepSeek) from .env.example
if not exist ".env" (
    if exist ".env.example" (
        echo  [0/4] Creating .env from .env.example ...
        copy /Y ".env.example" ".env" >nul
        echo         Add your API keys to .env (Spoonacular / DeepSeek) if you want them.
    )
)

:: 3. Install dependencies
echo  [1/4] Installing dependencies...
call npm install
if %ERRORLEVEL% neq 0 (
    echo  [ERROR] npm install failed.
    pause
    exit /b 1
)

:: 4. Build the production app
echo  [2/4] Building the app...
call npm run build
if %ERRORLEVEL% neq 0 (
    echo  [ERROR] Build failed.
    pause
    exit /b 1
)

:: 5. Create desktop shortcut
echo  [3/4] Creating desktop shortcut...
set "SHORTCUT=%USERPROFILE%\Desktop\Culinary Quest.lnk"
set "TARGET=%cd%\deploy\start-server.bat"
set "WORKDIR=%cd%"

powershell -NoProfile -Command ^
    "$ws = New-Object -ComObject WScript.Shell; ^
     $sc = $ws.CreateShortcut('%SHORTCUT%'); ^
     $sc.TargetPath = '%TARGET%'; ^
     $sc.WorkingDirectory = '%WORKDIR%'; ^
     $sc.Description = 'Start Culinary Quest'; ^
     $sc.Save()"

echo  [4/4] Done.
if exist "%SHORTCUT%" (
    echo.
    echo  === Setup complete! ===
    echo  A "Culinary Quest" shortcut is on your desktop.
    echo  Double-click it to start the server (serves the built app on port 5173).
) else (
    echo  [WARN] Could not create the desktop shortcut.
    echo  Run deploy\start-server.bat manually to start the app.
)
echo.
pause
