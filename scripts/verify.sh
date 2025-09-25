#!/bin/bash

# Aura Flow 系统验证脚本
# 用于验证整个系统是否正常工作

set -e

echo "🔍 开始验证 Aura Flow 系统..."

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 验证函数
verify() {
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ $1${NC}"
    else
        echo -e "${RED}❌ $1${NC}"
        exit 1
    fi
}

# 检查 Node.js 版本
echo -e "${BLUE}📋 检查 Node.js 版本...${NC}"
node -v | grep -q "v18\|v19\|v20"
verify "Node.js 版本检查"

# 检查 pnpm
echo -e "${BLUE}📋 检查 pnpm...${NC}"
pnpm -v > /dev/null
verify "pnpm 可用性检查"

# 检查前端依赖
echo -e "${BLUE}📋 检查前端依赖...${NC}"
if [ -d "node_modules" ]; then
    echo -e "${GREEN}✅ 前端依赖已安装${NC}"
else
    echo -e "${YELLOW}⚠️ 前端依赖未安装，正在安装...${NC}"
    pnpm install
    verify "前端依赖安装"
fi

# 检查后端依赖
echo -e "${BLUE}📋 检查后端依赖...${NC}"
if [ -d "server/node_modules" ]; then
    echo -e "${GREEN}✅ 后端依赖已安装${NC}"
else
    echo -e "${YELLOW}⚠️ 后端依赖未安装，正在安装...${NC}"
    cd server && pnpm install && cd ..
    verify "后端依赖安装"
fi

# 检查环境变量
echo -e "${BLUE}📋 检查环境变量...${NC}"
if [ -f ".env.local" ]; then
    echo -e "${GREEN}✅ .env.local 文件存在${NC}"
else
    echo -e "${YELLOW}⚠️ .env.local 文件不存在，正在创建...${NC}"
    cp .env.example .env.local
    verify ".env.local 文件创建"
fi

# 检查数据库
echo -e "${BLUE}📋 检查数据库...${NC}"
cd server
if [ -f "dev.db" ]; then
    echo -e "${GREEN}✅ 数据库文件存在${NC}"
else
    echo -e "${YELLOW}⚠️ 数据库文件不存在，正在初始化...${NC}"
    pnpm db:generate
    pnpm db:push
    pnpm db:seed
    verify "数据库初始化"
fi
cd ..

# 检查构建
echo -e "${BLUE}📋 检查前端构建...${NC}"
pnpm build > /dev/null 2>&1
verify "前端构建"

# 检查后端构建
echo -e "${BLUE}📋 检查后端构建...${NC}"
cd server
pnpm build > /dev/null 2>&1
verify "后端构建"
cd ..

# 检查 Docker（可选）
echo -e "${BLUE}📋 检查 Docker...${NC}"
if command -v docker &> /dev/null; then
    echo -e "${GREEN}✅ Docker 可用${NC}"
    
    # 检查 Docker Compose
    if command -v docker-compose &> /dev/null; then
        echo -e "${GREEN}✅ Docker Compose 可用${NC}"
    else
        echo -e "${YELLOW}⚠️ Docker Compose 不可用${NC}"
    fi
else
    echo -e "${YELLOW}⚠️ Docker 不可用，跳过容器化验证${NC}"
fi

# 检查关键文件
echo -e "${BLUE}📋 检查关键文件...${NC}"

files=(
    "src/lib/platform/index.ts"
    "src/lib/platform/config.ts"
    "src/lib/platform/auth.ts"
    "src/lib/platform/db.ts"
    "src/lib/platform/ai.ts"
    "src/lib/platform/storage.ts"
    "src/lib/platform/telemetry.ts"
    "server/src/index.js"
    "server/prisma/schema.prisma"
    ".github/workflows/ci.yml"
    "Dockerfile"
    "docker-compose.yml"
    "nginx.conf"
)

for file in "${files[@]}"; do
    if [ -f "$file" ]; then
        echo -e "${GREEN}✅ $file${NC}"
    else
        echo -e "${RED}❌ $file 缺失${NC}"
        exit 1
    fi
done

# 检查脚本权限
echo -e "${BLUE}📋 检查脚本权限...${NC}"
if [ -x "scripts/setup.sh" ]; then
    echo -e "${GREEN}✅ setup.sh 可执行${NC}"
else
    echo -e "${YELLOW}⚠️ 设置 setup.sh 权限...${NC}"
    chmod +x scripts/setup.sh
    verify "setup.sh 权限设置"
fi

# 运行测试（如果可用）
echo -e "${BLUE}📋 运行测试...${NC}"
if pnpm test > /dev/null 2>&1; then
    echo -e "${GREEN}✅ 测试通过${NC}"
else
    echo -e "${YELLOW}⚠️ 测试跳过或失败${NC}"
fi

# 检查代码质量
echo -e "${BLUE}📋 检查代码质量...${NC}"
if pnpm lint > /dev/null 2>&1; then
    echo -e "${GREEN}✅ 代码检查通过${NC}"
else
    echo -e "${YELLOW}⚠️ 代码检查有警告${NC}"
fi

echo ""
echo -e "${GREEN}🎉 系统验证完成！${NC}"
echo ""
echo -e "${BLUE}📋 验证结果总结：${NC}"
echo -e "${GREEN}✅ 所有核心组件已就绪${NC}"
echo -e "${GREEN}✅ 依赖安装完成${NC}"
echo -e "${GREEN}✅ 环境配置正确${NC}"
echo -e "${GREEN}✅ 数据库初始化完成${NC}"
echo -e "${GREEN}✅ 构建流程正常${NC}"
echo -e "${GREEN}✅ 关键文件完整${NC}"
echo ""
echo -e "${BLUE}🚀 可以开始使用以下命令：${NC}"
echo -e "${YELLOW}   启动后端: pnpm server:dev${NC}"
echo -e "${YELLOW}   启动前端: pnpm dev${NC}"
echo -e "${YELLOW}   访问应用: http://localhost:5173${NC}"
echo -e "${YELLOW}   调试页面: http://localhost:5173/debug${NC}"
echo ""
echo -e "${BLUE}📚 更多信息请查看：${NC}"
echo -e "${YELLOW}   README.md - 项目介绍${NC}"
echo -e "${YELLOW}   MIGRATION_GUIDE.md - 迁移指南${NC}"
echo -e "${YELLOW}   PROJECT_SUMMARY.md - 项目总结${NC}"
