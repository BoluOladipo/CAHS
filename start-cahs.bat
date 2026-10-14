@echo off
echo ========================================
echo   Starting CAHS Local Environment
echo ========================================

REM 1. Ensure PostgreSQL is running on port 5433
netstat -ano | findstr :5433 >nul
if %errorlevel% neq 0 (
    echo Starting PostgreSQL on port 5433...
    start /B "" "C:\Program Files\PostgreSQL\18\bin\postgres.exe" -D "C:\Users\Black\cahs_db" -p 5433
    timeout /t 2 /nobreak >nul
) else (
    echo PostgreSQL is already running on port 5433.
)

REM 2. Start API and Web servers
cd /d "%~dp0"
echo Starting API (:4000) and Web (:5173)...
npm run dev
pause
