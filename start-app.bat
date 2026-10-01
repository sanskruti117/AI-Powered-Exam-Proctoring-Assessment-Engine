@echo off
title Exam Proctoring System Launcher
echo ========================================================
echo   Starting Exam Proctoring System
echo   (Frontend + Backend API + Database Studio)
echo ========================================================
echo.
echo [1/3] Checking PostgreSQL Database Server...
for /f "tokens=*" %%i in ('netstat -ano ^| findstr :5432') do set PG_RUNNING=1
if not defined PG_RUNNING (
    echo Starting PostgreSQL on port 5432...
    start /b "" "%~dp0..\postgresql\bin\postgres.exe" -D "%~dp0..\postgresql\data"
    timeout /t 3 /nobreak >nul
) else (
    echo PostgreSQL is already running on port 5432.
)

echo.
echo [2/3] Starting Python FastAPI Backend + DB Studio on port 8000...
start "Backend & DB Studio (Port 8000)" cmd /k "cd /d %~dp0 && .\venv\Scripts\python.exe -m uvicorn backend.main:app --reload --port 8000"
echo [3/3] Starting Next.js Frontend on port 3000...
start "Frontend (Next.js - Port 3000)" cmd /k "cd /d %~dp0 && npm run dev"
echo.
echo ========================================================
echo   All servers launched successfully!
echo   - PostgreSQL Database: Port 5432 (Ready)
echo   - Frontend App:        http://localhost:3000
echo   - Backend API Docs:    http://127.0.0.1:8000/docs
echo   - Database Studio:     http://127.0.0.1:8000/db-studio
echo ========================================================

