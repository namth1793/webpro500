@echo off
echo ========================================
echo   WebPro - Khoi dong server
echo ========================================
cd /d "%~dp0backend"
echo [*] Khoi dong backend tai port 5017...
echo [*] Mo trinh duyet: http://localhost:5017
start "" http://localhost:5017
node server.js
pause
