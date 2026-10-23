@echo off
title MEDIBRIDGE All-In-One Launcher
echo ========================================================
echo   MEDIBRIDGE TELEMEDICINE - Starting All Services
echo ========================================================
echo.
echo [1/2] Launching Backend Server in a separate window...
start "MEDIBRIDGE Backend" cmd /k "cd /d "%~dp0backend" && node server.js"

timeout /t 3 /nobreak >nul

echo [2/2] Launching Frontend Client in a separate window...
start "MEDIBRIDGE Frontend" cmd /k "cd /d "%~dp0frontend" && npm run dev"

echo.
echo ========================================================
echo   SUCCESS! Both servers have been launched.
echo.
echo   - Laptop Access:  https://localhost:5173/
echo   - Mobile Access:  https://192.168.1.3:5173/
echo.
echo   Keep both opened terminal windows open while working.
echo   Close them when you want to stop the servers.
echo ========================================================
echo.
pause
