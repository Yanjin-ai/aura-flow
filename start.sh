#!/bin/bash

# Aura Flow 启动脚本
# 自动设置 NVM 环境并启动服务

set -e

echo "🚀 启动 Aura Flow..."

# 设置 NVM 环境
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
[ -s "$NVM_DIR/bash_completion" ] && \. "$NVM_DIR/bash_completion"

# 使用 Node.js 22.19.0
nvm use v22.19.0

echo "✅ Node.js 环境已设置: $(node --version)"
echo "✅ pnpm 版本: $(pnpm --version)"

# 检查依赖是否安装
if [ ! -d "node_modules" ]; then
    echo "📦 安装前端依赖..."
    pnpm install
fi

if [ ! -d "server/node_modules" ]; then
    echo "📦 安装后端依赖..."
    cd server && pnpm install && cd ..
fi

# 检查数据库
if [ ! -f "server/dev.db" ]; then
    echo "🗄️ 初始化数据库..."
    cd server
    pnpm db:generate
    pnpm db:push
    pnpm db:seed
    cd ..
fi

echo ""
echo "🎉 环境准备完成！"
echo ""
echo "📋 可用的启动选项："
echo "1. 启动后端: pnpm server:dev"
echo "2. 启动前端: pnpm dev"
echo "3. 同时启动: 打开两个终端分别运行上述命令"
echo ""
echo "🌐 访问地址："
echo "   前端: http://localhost:5173"
echo "   后端: http://localhost:3001"
echo "   调试页: http://localhost:5173/debug"
echo ""
echo "🔑 默认登录信息："
echo "   邮箱: demo@auraflow.com"
echo "   密码: password123"
echo ""

# 询问是否自动启动服务
read -p "是否自动启动后端服务？(y/n): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "🚀 启动后端服务..."
    cd server && pnpm dev
fi
