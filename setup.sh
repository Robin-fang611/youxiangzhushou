#!/bin/bash

echo "🚀 邮件营销系统 v2.0 - 快速启动脚本"
echo "======================================"
echo ""

# 检查 Node.js
if ! command -v node &> /dev/null; then
    echo "❌ 错误：未检测到 Node.js，请先安装 Node.js 18+"
    exit 1
fi

NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ $NODE_VERSION -lt 18 ]; then
    echo "❌ 错误：Node.js 版本过低，需要 18+，当前版本：$(node -v)"
    exit 1
fi

echo "✅ Node.js 版本检查通过：$(node -v)"

# 检查 .env 文件
if [ ! -f .env ]; then
    echo "⚠️  未找到 .env 文件，正在创建..."
    cp .env.example .env
    echo "✅ 已创建 .env 文件"
    echo ""
    echo "⚠️  请编辑 .env 文件，配置邮件服务信息"
    echo "   至少需要配置 QQ_EMAIL 和 QQ_SMTP_AUTH"
    echo ""
    read -p "配置完成后按回车继续..."
fi

# 安装依赖
if [ ! -d "node_modules" ]; then
    echo "📦 正在安装依赖..."
    npm install
    if [ $? -ne 0 ]; then
        echo "❌ 依赖安装失败"
        exit 1
    fi
    echo "✅ 依赖安装完成"
else
    echo "✅ 依赖已安装"
fi

# 初始化数据库
echo ""
echo "🗄️  正在初始化数据库..."
npx prisma migrate dev --name init
if [ $? -ne 0 ]; then
    echo "❌ 数据库初始化失败"
    exit 1
fi
echo "✅ 数据库初始化完成"

# 生成 Prisma 客户端
echo ""
echo "🔧 生成 Prisma 客户端..."
npx prisma generate
echo "✅ Prisma 客户端生成完成"

# 启动开发服务器
echo ""
echo "🚀 准备启动开发服务器..."
echo ""
echo "======================================"
echo "✨ 启动成功后，访问：http://localhost:3000"
echo "======================================"
echo ""
echo "💡 提示："
echo "   - 按 Ctrl+C 停止服务器"
echo "   - 查看数据库：npm run db:studio"
echo "   - 查看日志：.next/server/app.log"
echo ""

npm run dev
