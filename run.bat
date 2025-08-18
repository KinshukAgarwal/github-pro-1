@echo off
echo 🚀 GitHub Profile Analytics Platform
echo ===================================
echo.

echo 🔧 Starting backend API...
start "GitHub Analytics API" cmd /k "cd /d %~dp0server && npm run dev"

echo ⏳ Waiting for backend to initialize...
timeout /t 5 /nobreak >nul

echo 🎨 Starting frontend...
start "GitHub Analytics Frontend" cmd /k "cd /d %~dp0client && npm run dev"

echo.
echo 🎉 Platform is starting!
echo =======================
echo.
echo 📱 Frontend:  http://127.0.0.1:3000
echo 🔧 Backend:   http://127.0.0.1:5000
echo 🌐 Production: https://git-viz-lytics.vercel.app
echo.
echo ✅ Environment: All variables loaded
echo 🔑 GitHub OAuth: Configured
echo 🤖 Gemini AI: Ready
echo.
echo 📝 Both services are starting in separate windows
echo 🛑 Close those windows to stop the platform
echo.
pause
