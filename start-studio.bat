@echo off
title Database Studio Launcher
echo ========================================================
echo   Starting SQLAlchemy Database Studio (Port 8000)
echo ========================================================
echo.
echo Opening Database Studio in browser...
start http://localhost:8000/db-studio
echo.
echo Starting backend server...
cd /d %~dp0 && .\venv\Scripts\uvicorn.exe backend.main:app --reload --port 8000
