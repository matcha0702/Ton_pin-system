@echo off
cd /d "%~dp0"
title ToN Pin Tool - Cloud Watcher
py watcher.py
if errorlevel 1 python watcher.py
pause
