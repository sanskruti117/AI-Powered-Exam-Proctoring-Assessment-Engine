@echo off
title Database Studio Launcher
echo ========================================================
echo   Starting SQLAlchemy Database Studio (Port 8000)
echo ========================================================
echo.
for /f "tokens=*" %%i in ('netstat -ano ^| findstr :5432') do set PG_RUNNING=1
if not defined PG_RUNNING (
    echo Starting PostgreSQL on port 5432...
    start /b "" "%~dp0..\postgresql\bin\postgres.exe" -D "%~dp0..\postgresql\data"
    timeout /t 3 /nobreak >nul
) else (
    echo PostgreSQL is already running on port 5432.
)

echo.
echo Opening Database Studio in browser...
start http://localhost:8000/db-studio
echo.
echo Starting backend server...
cd /d %~dp0 && .\venv\Scripts\python.exe -m uvicorn backend.main:app --reload --port 8000
