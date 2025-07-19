@echo off
REM FlowBit.ai Platform - Git Preparation for Submission (Windows)

echo 📝 Preparing Git Repository for Submission
echo ==========================================

REM Initialize git if not already done
if not exist ".git" (
    echo 🔧 Initializing Git repository...
    git init
    echo ✅ Git repository initialized
)

REM Create .gitignore if it doesn't exist
if not exist ".gitignore" (
    echo 🔧 Creating .gitignore...
    (
        echo # Dependencies
        echo node_modules/
        echo */node_modules/
        echo.
        echo # Environment variables
        echo .env.local
        echo .env.production
        echo.
        echo # Build outputs
        echo build/
        echo dist/
        echo */build/
        echo */dist/
        echo.
        echo # Docker volumes (keep structure, not data^)
        echo volumes/mongodb/*
        echo !volumes/mongodb/.gitkeep
        echo volumes/n8n/*
        echo !volumes/n8n/.gitkeep
        echo.
        echo # Logs
        echo *.log
        echo npm-debug.log*
        echo yarn-debug.log*
        echo yarn-error.log*
        echo.
        echo # IDE files
        echo .vscode/
        echo .idea/
        echo *.swp
        echo *.swo
        echo.
        echo # OS generated files
        echo .DS_Store
        echo .DS_Store?
        echo ._*
        echo .Spotlight-V100
        echo .Trashes
        echo ehthumbs.db
        echo Thumbs.db
    ) > .gitignore
    echo ✅ .gitignore created
)

REM Create placeholder files for volume directories
if not exist "volumes\mongodb" mkdir volumes\mongodb
if not exist "volumes\n8n" mkdir volumes\n8n
echo. > volumes\mongodb\.gitkeep
echo. > volumes\n8n\.gitkeep

REM Add all files
echo 📁 Adding all files to git...
git add .

REM Commit everything
echo 💾 Committing changes...
git commit -m "feat: Complete FlowBit.ai Multi-Tenant SaaS Platform - Multi-tenant authentication with JWT - Real-time dashboard with 10-second auto-refresh - N8N workflow integration for ticket automation - Complete tenant isolation (LogisticsCo, RetailGmbH) - Docker containerization with 5 microservices - Comprehensive API documentation - Database seeding with test accounts"

echo ✅ Git repository prepared for submission
echo.
echo 📋 Next Steps:
echo 1. Create remote repository (GitHub/GitLab)
echo 2. Add remote: git remote add origin ^<your-repo-url^>
echo 3. Push code: git push -u origin main
echo 4. Record demo video (≤ 3 minutes)
echo 5. Submit repository URL + video
echo.
echo 🎬 Demo checklist in SUBMISSION_CHECKLIST.md

pause
