@echo off
:: ======================================================================
:: Culinary Quest — Stop the server on this machine.
:: ======================================================================
title Culinary Quest — Stop Server

for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":5173" ^| findstr "LISTENING" 2^>nul') do (
    taskkill /F /PID %%a >nul 2>&1
)

echo  Server stopped (nothing was listening on port 5173 if no message above).
timeout /t 1 /nobreak >nul
exit /b 0
