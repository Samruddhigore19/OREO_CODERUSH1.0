@echo off
echo ========================================
echo  CME Detection and Alert System
echo  Starting Backend and Frontend Services
echo ========================================
echo.

REM Check if Node.js is installed
node --version >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo ERROR: Node.js is not installed or not in PATH
    echo Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
)

echo Node.js version:
node --version
echo.

REM Check if we're in the right directory
if not exist "backend" (
    echo ERROR: backend directory not found
    echo Please run this script from the project root directory
    pause
    exit /b 1
)

if not exist "my-app" (
    echo ERROR: my-app directory not found
    echo Please run this script from the project root directory
    pause
    exit /b 1
)

echo Installing backend dependencies...
cd backend
if not exist "node_modules" (
    echo Installing Node.js dependencies for backend...
    call npm install
    if %ERRORLEVEL% neq 0 (
        echo ERROR: Failed to install backend dependencies
        pause
        exit /b 1
    )
) else (
    echo Backend dependencies already installed.
)
cd ..

echo.
echo Installing frontend dependencies...
cd my-app
if not exist "node_modules" (
    echo Installing Node.js dependencies for frontend...
    call npm install
    if %ERRORLEVEL% neq 0 (
        echo ERROR: Failed to install frontend dependencies
        pause
        exit /b 1
    )
) else (
    echo Frontend dependencies already installed.
)
cd ..

echo.
echo ========================================
echo  Starting Services
echo ========================================
echo.

echo Starting backend server on port 3001...
start "CME Backend Server" cmd /k "cd backend && npm run dev"

echo Waiting for backend to start...
timeout /t 5 /nobreak >nul

echo Starting frontend development server on port 3000...
start "CME Frontend Server" cmd /k "cd my-app && npm run dev"

echo.
echo ========================================
echo  Services Started Successfully!
echo ========================================
echo.
echo Backend API:     http://localhost:3001
echo Frontend UI:     http://localhost:3000
echo WebSocket:       ws://localhost:3001/ws
echo.
echo Backend Health:  http://localhost:3001/api/health
echo API Docs:        See backend/README.md
echo.
echo The frontend will automatically open in your browser.
echo Both servers will reload automatically when you make changes.
echo.
echo To stop the servers, close their respective command windows.
echo.
pause
