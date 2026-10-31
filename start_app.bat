@echo off
title Brightloop Subscription Management Launcher
echo ====================================================================
echo Starting Brightloop System (Backend API + Frontend UI)...
echo ====================================================================

start "Brightloop Backend (Port 5000)" cmd /k "cd /d "%~dp0server" && node src/server.js"
start "Brightloop Frontend (Port 5173)" cmd /k "cd /d "%~dp0client" && node node_modules\vite\bin\vite.js"

echo.
echo Both servers are launching!
echo Backend:  http://localhost:5000/api
echo Frontend: http://localhost:5173
echo.
echo Open your browser at: http://localhost:5173
echo.
echo Admin credentials:
echo Email:    admin@brightloop.com
echo Password: Brightloop@2026
echo ====================================================================
pause
