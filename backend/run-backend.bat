@echo off
title AgriTrace Backend
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0run-backend.ps1"
pause
