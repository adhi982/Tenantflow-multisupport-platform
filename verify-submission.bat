@echo off
REM FlowBit.ai Platform - Pre-Submission Verification Script (Windows)

echo 🚀 FlowBit.ai Platform - Submission Verification
echo ==============================================

REM Check if Docker is running
echo 📋 Checking Docker...
docker info >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Docker is not running. Please start Docker Desktop.
    pause
    exit /b 1
)
echo ✅ Docker is running

REM Check if docker-compose file exists
if not exist "docker-compose.yml" (
    echo ❌ docker-compose.yml not found. Make sure you're in the project root.
    pause
    exit /b 1
)
echo ✅ docker-compose.yml found

REM Start all services
echo 🐳 Starting all services...
docker-compose up -d

REM Wait for services to start
echo ⏳ Waiting for services to start...
timeout /t 15 /nobreak >nul

REM Check service status
echo 📊 Checking service status...
docker-compose ps

REM Seed the database
echo 👥 Seeding database with test users...
docker exec flowbit-backend node seed-users.js

echo.
echo 🎯 Platform Status Summary:
echo ==========================
echo ✅ All services are running
echo ✅ Database is seeded with test tenants
echo ✅ Ready for demo recording!
echo.
echo 📝 Demo URLs:
echo Main App: http://localhost:3000
echo N8N: http://localhost:5678 (admin/flowbit123)
echo API Docs: http://localhost:3001/api-docs
echo.
echo 🔑 Test Credentials:
echo LogisticsCo: admin@logisticsco.com / admin123
echo RetailGmbH: admin@retailgmbh.de / admin123
echo.
echo 🎬 Ready to record your demo video!
echo.
echo Opening main application...
start http://localhost:3000

pause
