@echo off
echo 🚀 邮件营销系统 v2.0 - 快速启动脚本 (Windows)
echo ======================================
echo.

REM 检查 Node.js
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ❌ 错误：未检测到 Node.js，请先安装 Node.js 18+
    pause
    exit /b 1
)

for /f "tokens=2 delims=v." %%i in ('node -v') do set NODE_VERSION=%%i
for /f "tokens=1 delims=." %%j in ("%NODE_VERSION%") do set NODE_MAJOR=%%j

if %NODE_MAJOR% LSS 18 (
    echo ❌ 错误：Node.js 版本过低，需要 18+
    node -v
    pause
    exit /b 1
)

echo ✅ Node.js 版本检查通过：
node -v

REM 检查 .env 文件
if not exist .env (
    echo ⚠️  未找到 .env 文件，正在创建...
    copy .env.example .env
    echo ✅ 已创建 .env 文件
    echo.
    echo ⚠️  请编辑 .env 文件，配置邮件服务信息
    echo    至少需要配置 QQ_EMAIL 和 QQ_SMTP_AUTH
    echo.
    pause
)

REM 安装依赖
if not exist node_modules (
    echo 📦 正在安装依赖...
    call npm install
    if errorlevel 1 (
        echo ❌ 依赖安装失败
        pause
        exit /b 1
    )
    echo ✅ 依赖安装完成
) else (
    echo ✅ 依赖已安装
)

REM 初始化数据库
echo.
echo 🗄️  正在初始化数据库...
call npx prisma migrate dev --name init
if errorlevel 1 (
    echo ❌ 数据库初始化失败
    pause
    exit /b 1
)
echo ✅ 数据库初始化完成

REM 生成 Prisma 客户端
echo.
echo 🔧 生成 Prisma 客户端...
call npx prisma generate
echo ✅ Prisma 客户端生成完成

REM 启动开发服务器
echo.
echo 🚀 准备启动开发服务器...
echo.
echo ======================================
echo ✨ 启动成功后，访问：http://localhost:3000
echo ======================================
echo.
echo 💡 提示：
echo    - 按 Ctrl+C 停止服务器
echo    - 查看数据库：npm run db:studio
echo.

call npm run dev
