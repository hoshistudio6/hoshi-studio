@echo off
title Hoshi Studio Server
cd /d "%~dp0"
where node >nul 2>nul
if errorlevel 1 (
  echo Node.js is not installed or is not available in PATH.
  echo Install the LTS version from https://nodejs.org and then run this file again.
  pause
  exit /b 1
)
echo.
echo Starting Hoshi Studio...
echo Keep this window open while using the website.
echo Then open: http://localhost:3000
echo.
node server.js
pause
