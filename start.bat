@echo off
title Smart Budget Manager
echo.
echo   Starting Smart Budget Manager...
echo.
cd /d %~dp0UI
node server.js
