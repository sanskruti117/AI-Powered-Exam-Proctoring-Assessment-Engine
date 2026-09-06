@echo off
title Exam Proctoring System Launcher
echo ========================================================
echo   Starting Exam Proctoring System (Frontend + Backend)
echo ========================================================
echo.
echo [1/2] Starting Python FastAPI Backend on port 8000...
start "Backend (FastAPI - Port 8000)" cmd /k "cd /d %~dp0 && .\venv\Scripts\uvicorn.exe backend.main:app --reload --port 8000"
echo [2/2] Starting Next.js Frontend on port 3000...
start "Frontend (Next.js - Port 3000)" cmd /k "cd /d %~dp0 && npm run dev"
echo.
echo ========================================================
echo   Both servers launched in separate windows!
echo   - Frontend:    http://localhost:3000
echo   - Backend API: http://127.0.0.1:8000/docs
echo ========================================================
