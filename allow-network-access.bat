@echo off
echo ========================================================
echo   MEDIBRIDGE - Enabling Mobile & LAN Network Access
echo ========================================================
echo.
echo Adding inbound firewall rules for Vite (5173) and Backend (5000)...
netsh advfirewall firewall delete rule name="MEDIBRIDGE Port 5173" >nul 2>&1
netsh advfirewall firewall delete rule name="MEDIBRIDGE Port 5000" >nul 2>&1
netsh advfirewall firewall add rule name="MEDIBRIDGE Port 5173" dir=in action=allow protocol=TCP localport=5173
netsh advfirewall firewall add rule name="MEDIBRIDGE Port 5000" dir=in action=allow protocol=TCP localport=5000
echo.
echo Setting Wi-Fi network profile to Private...
powershell -NoProfile -Command "Set-NetConnectionProfile -InterfaceAlias 'WiFi' -NetworkCategory Private"
echo.
echo ========================================================
echo   SUCCESS! Ports 5173 & 5000 are now allowed.
echo   Network profile set to Private.
echo   Mobile URL: http://192.168.1.9:5173
echo ========================================================
pause
