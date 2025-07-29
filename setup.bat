@echo off
REM Charlie's HRMS - Quick Setup Script for Windows
REM This script helps new developers set up their environment quickly

setlocal enabledelayedexpansion

echo.
echo ========================================
echo   Charlie's HRMS - Quick Setup
echo ========================================
echo.

REM Check if Node.js is installed
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Node.js is not installed. Please install Node.js 18+ from https://nodejs.org/
    pause
    exit /b 1
) else (
    for /f "tokens=*" %%i in ('node --version') do set NODE_VERSION=%%i
    echo ✅ Node.js is installed: !NODE_VERSION!
)

REM Check if npm is installed
npm --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ npm is not installed. Please install npm.
    pause
    exit /b 1
) else (
    for /f "tokens=*" %%i in ('npm --version') do set NPM_VERSION=%%i
    echo ✅ npm is installed: !NPM_VERSION!
)

echo.
echo ========================================
echo   📦 Setting up Root Dependencies
echo ========================================
echo.

echo Installing root dependencies...
npm install
if %errorlevel% neq 0 (
    echo ❌ Failed to install root dependencies
    pause
    exit /b 1
)
echo ✅ Root dependencies installed

echo.
echo ========================================
echo   🔧 Setting up Backend Environment
echo ========================================
echo.

cd backend

REM Copy environment file if it doesn't exist
if not exist ".env" (
    if exist ".env.example" (
        copy ".env.example" ".env" >nul
        echo ✅ Created backend\.env from .env.example
        echo ⚠️  Please edit backend\.env with your actual values
    ) else (
        echo ❌ backend\.env.example not found
        pause
        exit /b 1
    )
) else (
    echo ℹ️  backend\.env already exists
)

REM Install backend dependencies
echo Installing backend dependencies...
npm install
if %errorlevel% neq 0 (
    echo ❌ Failed to install backend dependencies
    pause
    exit /b 1
)
echo ✅ Backend dependencies installed

cd ..

echo.
echo ========================================
echo   🎨 Setting up Frontend Environment
echo ========================================
echo.

cd frontend

REM Copy environment file if it doesn't exist
if not exist ".env.local" (
    if exist ".env.example" (
        copy ".env.example" ".env.local" >nul
        echo ✅ Created frontend\.env.local from .env.example
        echo ⚠️  Please edit frontend\.env.local with your actual values
    ) else (
        echo ❌ frontend\.env.example not found
        pause
        exit /b 1
    )
) else (
    echo ℹ️  frontend\.env.local already exists
)

REM Install frontend dependencies
echo Installing frontend dependencies...
npm install
if %errorlevel% neq 0 (
    echo ❌ Failed to install frontend dependencies
    pause
    exit /b 1
)
echo ✅ Frontend dependencies installed

cd ..

echo.
echo ========================================
echo   🔑 Secret Generation Helper
echo ========================================
echo.

echo Here are some tips for your .env files:
echo.
echo 1. Generate a JWT secret (32+ characters):
echo    You can use: node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
echo.
echo 2. Get your Supabase credentials from: https://supabase.com/dashboard
echo.
echo 3. Update these in backend\.env:
echo    - DATABASE_URL (Supabase connection string)
echo    - SUPABASE_URL
echo    - SUPABASE_SECRET_KEY
echo    - JWT_SECRET
echo.
echo 4. Update these in frontend\.env.local:
echo    - VITE_API_BASE_URL (your backend URL)
echo.

echo.
echo ========================================
echo   🔍 Validating Environment
echo ========================================
echo.

if exist "validate-environment.js" (
    node validate-environment.js
) else (
    echo ⚠️  Environment validation script not found
)

echo.
echo ========================================
echo   🎉 Setup Complete!
echo ========================================
echo.

echo Next steps:
echo 1. Edit backend\.env with your actual values
echo 2. Edit frontend\.env.local with your actual values
echo 3. Run 'npm run validate-env' to check your setup
echo 4. Run 'npm run dev' to start both backend and frontend
echo.
echo For detailed setup instructions, see: ENVIRONMENT_SETUP_GUIDE.md
echo.

pause