#!/bin/bash

# Aura Flow 快速设置脚本
# 用于快速搭建开发环境

set -e

echo "🚀 开始设置 Aura Flow 开发环境..."

# 检查 Node.js 版本
if ! command -v node &> /dev/null; then
    echo "❌ Node.js 未安装，请先安装 Node.js 18+"
    exit 1
fi

NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "❌ Node.js 版本过低，需要 18+，当前版本: $(node -v)"
    exit 1
fi

echo "✅ Node.js 版本检查通过: $(node -v)"

# 检查 pnpm
if ! command -v pnpm &> /dev/null; then
    echo "📦 安装 pnpm..."
    npm install -g pnpm
fi

echo "✅ pnpm 版本: $(pnpm -v)"

# 安装前端依赖
echo "📦 安装前端依赖..."
pnpm install

# 安装后端依赖
echo "📦 安装后端依赖..."
cd server
pnpm install
cd ..

# 设置环境变量
echo "⚙️ 设置环境变量..."
if [ ! -f .env.local ]; then
    cp .env.example .env.local
    echo "✅ 已创建 .env.local 文件"
else
    echo "✅ .env.local 文件已存在"
fi

# 初始化数据库
echo "🗄️ 初始化数据库..."
cd server
pnpm db:generate
pnpm db:push
pnpm db:seed
cd ..

echo "✅ 数据库初始化完成"

# 检查 Docker（可选）
if command -v docker &> /dev/null; then
    echo "🐳 Docker 可用，可以运行容器化部署"
    echo "   运行 'pnpm docker:dev' 启动开发环境"
    echo "   运行 'pnpm docker:prod' 启动生产环境"
else
    echo "⚠️ Docker 未安装，跳过容器化选项"
fi

echo ""
echo "🎉 设置完成！"
echo ""
echo "📋 可用的命令："
echo "   前端开发: pnpm dev"
echo "   后端开发: pnpm server:dev"
echo "   构建项目: pnpm build"
echo "   运行测试: pnpm test"
echo "   E2E 测试: pnpm playwright"
echo ""
echo "🌐 访问地址："
echo "   前端: http://localhost:5173"
echo "   后端: http://localhost:3001"
echo "   调试页: http://localhost:5173/debug"
echo "   健康检查: http://localhost:3001/health"
echo ""
echo "🔑 默认登录信息："
echo "   邮箱: demo@auraflow.com"
echo "   密码: password123"
echo ""
echo "📚 更多信息请查看 MIGRATION_GUIDE.md"
