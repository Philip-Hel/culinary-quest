@echo off
:: ======================================================================
:: Culinary Quest — Register a Windows Scheduled Task to start the server
:: automatically when this machine boots.
::
:: Run this ONCE on the server (as admin). It creates a task named
:: "CulinaryQuest" that launches deploy\start-server.bat at startup.
:: To remove later:  schtasks /Delete /TN CulinaryQuest /F
:: ======================================================================
title Culinary Quest — Install Auto-Start Task

setlocal

:: Resolve the repo root from THIS script's own folder (deploy\ is inside it).
set "START_BAT=%~dp0start-server.bat"

if not exist "%START_BAT%" (
    echo  [ERROR] start-server.bat not found: %START_BAT%
    echo          Run this script from inside the repo's deploy\ folder.
    pause
    exit /b 1
)

echo  Will register a boot-time task that runs:
echo    %START_BAT%
echo.

schtasks /Create /TN "CulinaryQuest" /TR "\"%START_BAT%\"" /SC ONSTART /RL HIGHEST /F

if %ERRORLEVEL% neq 0 (
    echo.
    echo  [ERROR] Failed to register the task.
    echo          Most likely cause: this needs Administrator rights.
    echo          Right-click this script and choose "Run as administrator".
    pause
    exit /b 1
)

echo.
echo  === Auto-start task installed ===
echo  The Culinary Quest server will start automatically the next time
echo  this machine boots. Verify with:
echo    schtasks /Query /TN CulinaryQuest
echo.
pause
exit /b 0
