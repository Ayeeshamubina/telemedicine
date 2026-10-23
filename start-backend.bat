@echo off
title MEDIBRIDGE Backend Server (Port 5000 & 5173 Proxy)
cd /d "%~dp0backend"
echo ========================================================
echo   Starting MEDIBRIDGE Backend & DualProxy (Port 5000 / 5173)
echo ========================================================
echo.
node server.js
pause
