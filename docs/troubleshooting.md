# 🛠️ 故障排除指南

## 常见错误和解决方案

### 1. Sentry 导入错误

#### 错误信息
```
[plugin:vite:import-analysis] Failed to resolve import "@sentry/browser" from "src/lib/platform/telemetry.ts"
```

#### 原因
这个错误出现是因为代码尝试动态导入 `@sentry/browser` 包，但该包没有安装。

#### 解决方案
**方案一：使用默认配置（推荐）**
- 确保 `.env.local` 文件中 `VITE_ENABLE_TELEMETRY=false`
- 确保 `VITE_SENTRY_DSN` 为空或未设置
- 这样系统会自动使用控制台模式，不会尝试导入 Sentry

**方案二：安装 Sentry（可选）**
```bash
pnpm add @sentry/browser
```

**方案三：完全禁用遥测**
在 `.env.local` 中设置：
```bash
VITE_ENABLE_TELEMETRY=false
VITE_SENTRY_DSN=
```

#### 验证修复
运行以下命令验证修复：
```bash
pnpm dev
```
如果服务器正常启动且没有错误，说明问题已解决。

### 1.1. pnpm 命令找不到

#### 错误信息
```
(eval):1: command not found: pnpm
```

#### 原因
Node.js 通过 NVM 安装，但当前 shell 没有激活 NVM 环境。

#### 解决方案
**方案一：使用启动脚本（推荐）**
```bash
./start.sh
```

**方案二：手动激活 NVM**
```bash
source ~/.nvm/nvm.sh
nvm use v22.19.0
pnpm --version
```

**方案三：安装 pnpm**
```bash
source ~/.nvm/nvm.sh
nvm use v22.19.0
npm install -g pnpm
```

### 2. 数据库枚举错误

#### 错误信息
```
Error validating: You defined the enum `TaskStatus`. But the current connector does not support enums.
```

#### 原因
SQLite 数据库不支持枚举类型，但 Prisma schema 中定义了枚举。

#### 解决方案
**已修复**：项目已更新为使用字符串替代枚举类型。
- 任务状态: `PENDING`, `IN_PROGRESS`, `COMPLETED`, `CANCELLED`
- 优先级: `LOW`, `MEDIUM`, `HIGH`
- 洞察类型: `DAILY`, `WEEKLY`, `CUSTOM`
- 心情: `POSITIVE`, `NEUTRAL`, `NEGATIVE`

### 3. 数据库连接错误

#### 错误信息
```
Error: Can't reach database server
```

#### 解决方案
1. 确保数据库文件存在：
```bash
cd server
pnpm db:generate
pnpm db:push
pnpm db:seed
```

2. 检查环境变量：
```bash
# 确保 server/.env 中有正确的数据库配置
DATABASE_URL=file:./dev.db
```

### 3. API 连接失败

#### 错误信息
```
Failed to fetch from http://localhost:3001
```

#### 解决方案
1. 确保后端服务正在运行：
```bash
cd server
pnpm dev
```

2. 检查端口是否被占用：
```bash
lsof -i :3001
```

3. 验证 API 健康状态：
```bash
curl http://localhost:3001/health
```

### 4. 构建错误

#### 错误信息
```
Build failed with errors
```

#### 解决方案
1. 清理缓存：
```bash
rm -rf node_modules
rm -rf dist
pnpm install
```

2. 检查环境变量：
```bash
cp .env.example .env.local
# 编辑 .env.local 文件
```

3. 重新构建：
```bash
pnpm build
```

### 5. Docker 相关问题

#### 错误信息
```
Docker daemon not running
```

#### 解决方案
1. 启动 Docker Desktop
2. 或者使用本地开发模式：
```bash
pnpm server:dev  # 后端
pnpm dev         # 前端
```

### 6. 权限问题

#### 错误信息
```
Permission denied
```

#### 解决方案
1. 给脚本添加执行权限：
```bash
chmod +x scripts/setup.sh
chmod +x scripts/verify.sh
```

2. 检查文件权限：
```bash
ls -la scripts/
```

## 🔍 调试工具

### 1. 调试页面
访问 `http://localhost:5173/debug` 查看：
- 系统配置信息
- API 健康状态
- 构建信息
- 快速导航

### 2. 健康检查
- 基础检查：`http://localhost:3001/health`
- 详细检查：`http://localhost:3001/health/detailed`

### 3. 日志查看
```bash
# 前端日志（浏览器控制台）
# 打开浏览器开发者工具查看

# 后端日志
cd server
tail -f logs/combined.log
```

### 4. 验证脚本
运行系统验证脚本：
```bash
./scripts/verify.sh
```

## 🚨 紧急恢复

如果系统完全无法启动：

### 1. 重置环境
```bash
# 清理所有依赖
rm -rf node_modules
rm -rf server/node_modules
rm -rf dist

# 重新安装
pnpm install
cd server && pnpm install && cd ..

# 重新配置
cp .env.example .env.local
```

### 2. 重置数据库
```bash
cd server
pnpm db:reset
pnpm db:seed
```

### 3. 使用 Docker
```bash
pnpm docker:down
pnpm docker:prod
```

## 📞 获取帮助

如果以上解决方案都无法解决问题：

1. **查看日志**：检查浏览器控制台和服务器日志
2. **运行验证**：执行 `./scripts/verify.sh`
3. **检查环境**：确认 Node.js 版本和依赖安装
4. **提交 Issue**：在 GitHub 上提交详细的问题描述

### 问题报告模板
```
**环境信息**
- 操作系统：
- Node.js 版本：
- pnpm 版本：
- 错误发生时间：

**错误信息**
```
完整的错误信息
```

**复现步骤**
1. 
2. 
3. 

**期望行为**
描述期望的正常行为

**实际行为**
描述实际发生的错误行为
```

## 🔧 预防措施

### 1. 定期更新依赖
```bash
pnpm update
```

### 2. 备份重要数据
```bash
# 备份数据库
cp server/dev.db server/dev.db.backup
```

### 3. 使用版本控制
```bash
git add .
git commit -m "备份当前状态"
```

### 4. 监控系统状态
定期访问调试页面检查系统健康状态。

---

**记住**：大多数问题都可以通过重新安装依赖和重置环境来解决。如果问题持续存在，请查看日志获取更多信息。
