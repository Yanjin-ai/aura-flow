# 多阶段构建 Dockerfile
# 用于构建和运行 Aura Flow 应用

# 第一阶段：构建前端
FROM node:18-alpine AS frontend-builder

WORKDIR /app

# 安装 pnpm
RUN npm install -g pnpm

# 复制前端依赖文件
COPY package.json pnpm-lock.yaml ./
COPY src/ ./src/
COPY public/ ./public/
COPY index.html vite.config.js tailwind.config.js postcss.config.js jsconfig.json ./

# 安装依赖并构建
RUN pnpm install --frozen-lockfile
RUN pnpm build

# 第二阶段：构建后端
FROM node:18-alpine AS backend-builder

WORKDIR /app

# 安装 pnpm
RUN npm install -g pnpm

# 复制后端文件
COPY server/package.json server/pnpm-lock.yaml ./server/
COPY server/ ./server/

# 安装后端依赖
WORKDIR /app/server
RUN pnpm install --frozen-lockfile --production

# 第三阶段：运行时镜像
FROM node:18-alpine AS runtime

# 安装必要的系统依赖
RUN apk add --no-cache \
    sqlite \
    dumb-init

# 创建应用用户
RUN addgroup -g 1001 -S nodejs
RUN adduser -S auraflow -u 1001

WORKDIR /app

# 复制后端文件
COPY --from=backend-builder --chown=auraflow:nodejs /app/server ./server

# 复制前端构建产物
COPY --from=frontend-builder --chown=auraflow:nodejs /app/dist ./public

# 创建必要的目录
RUN mkdir -p /app/server/logs /app/server/uploads
RUN chown -R auraflow:nodejs /app

# 切换到应用用户
USER auraflow

# 设置工作目录
WORKDIR /app/server

# 生成 Prisma 客户端
RUN npx prisma generate

# 暴露端口
EXPOSE 3001

# 健康检查
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3001/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) })"

# 启动应用
ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "src/index.js"]
