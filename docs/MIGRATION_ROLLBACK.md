# Aura Flow 迁移与回滚指南

## 概述

本文档详细说明了 Aura Flow 系统的迁移和回滚流程，确保系统升级和降级的可靠性。

## 迁移策略

### 1. 数据库迁移

#### 从 SQLite 迁移到 PostgreSQL

**步骤 1：准备 PostgreSQL 环境**

```bash
# 安装 PostgreSQL
sudo apt-get install postgresql postgresql-contrib

# 创建数据库和用户
sudo -u postgres psql
CREATE DATABASE aura_flow;
CREATE USER aura_flow_user WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE aura_flow TO aura_flow_user;
\q
```

**步骤 2：更新 Prisma 配置**

```bash
# 更新 server/prisma/schema.prisma
# 将 provider 从 "sqlite" 改为 "postgresql"

# 更新 server/.env
DATABASE_URL="postgresql://aura_flow_user:your_password@localhost:5432/aura_flow"
```

**步骤 3：执行迁移**

```bash
cd server
pnpm db:generate
pnpm db:migrate:prod
```

**步骤 4：数据迁移**

```bash
# 导出 SQLite 数据
sqlite3 dev.db .dump > data_export.sql

# 清理 PostgreSQL 特定语法
sed -i 's/AUTOINCREMENT/SERIAL/g' data_export.sql
sed -i 's/INTEGER PRIMARY KEY/SERIAL PRIMARY KEY/g' data_export.sql

# 导入到 PostgreSQL
psql -U aura_flow_user -d aura_flow -f data_export.sql
```

#### 从 Base44 迁移到自建系统

**步骤 1：数据导出**

```bash
# 从 Base44 导出数据
curl -H "Authorization: Bearer <base44_token>" \
  https://api.base44.com/v1/export/user-data > base44_export.json
```

**步骤 2：数据转换**

```bash
# 运行数据转换脚本
node scripts/migrate-from-base44.js base44_export.json
```

**步骤 3：数据导入**

```bash
# 导入转换后的数据
pnpm db:seed --import converted_data.json
```

### 2. 配置迁移

#### 环境变量迁移

**开发环境 → 生产环境**

```bash
# 复制环境变量模板
cp .env.example .env.production

# 更新生产环境配置
vim .env.production
```

**关键配置项**：

```bash
# 数据库
DATABASE_URL="postgresql://user:pass@host:5432/db"

# API 配置
VITE_API_BASE_URL="https://api.yourdomain.com"
VITE_AI_PROVIDER="openai"

# 安全配置
JWT_SECRET="your-production-secret"
VITE_SENTRY_DSN="your-sentry-dsn"

# 监控配置
VITE_ENABLE_TELEMETRY=true
VITE_BUILD_VERSION="1.0.0"
```

### 3. 服务迁移

#### 从开发环境到生产环境

**步骤 1：构建生产版本**

```bash
# 构建前端
pnpm build

# 构建后端 Docker 镜像
docker build -t aura-flow:latest .
```

**步骤 2：部署到生产环境**

```bash
# 使用 Docker Compose
docker-compose --profile production up -d

# 或手动部署
docker run -d --name aura-flow-backend \
  -p 3001:3001 \
  -e NODE_ENV=production \
  -e DATABASE_URL="postgresql://..." \
  aura-flow:latest
```

## 回滚策略

### 1. 应用回滚

#### 快速回滚（Docker）

```bash
# 回滚到上一个版本
docker-compose down
docker tag aura-flow:latest aura-flow:backup
docker tag aura-flow:previous aura-flow:latest
docker-compose up -d
```

#### 代码回滚（Git）

```bash
# 回滚到上一个提交
git log --oneline -5
git checkout <previous-commit-hash>
pnpm build
docker-compose up -d --build
```

### 2. 数据库回滚

#### PostgreSQL 回滚

```bash
# 创建回滚点
pg_dump -U aura_flow_user -d aura_flow > backup_before_migration.sql

# 回滚到备份
psql -U aura_flow_user -d aura_flow -c "DROP SCHEMA public CASCADE;"
psql -U aura_flow_user -d aura_flow -c "CREATE SCHEMA public;"
psql -U aura_flow_user -d aura_flow < backup_before_migration.sql
```

#### Prisma 迁移回滚

```bash
cd server

# 查看迁移历史
pnpm prisma migrate status

# 回滚到特定迁移
pnpm prisma migrate resolve --rolled-back <migration-name>
```

### 3. 配置回滚

#### 环境变量回滚

```bash
# 备份当前配置
cp .env.production .env.production.backup

# 回滚到上一个配置
cp .env.production.previous .env.production

# 重启服务
docker-compose restart
```

## 迁移检查清单

### 迁移前检查

- [ ] 备份当前数据库
- [ ] 备份当前配置文件
- [ ] 测试迁移脚本
- [ ] 准备回滚计划
- [ ] 通知相关团队

### 迁移中检查

- [ ] 监控服务状态
- [ ] 检查错误日志
- [ ] 验证数据完整性
- [ ] 测试关键功能
- [ ] 确认性能指标

### 迁移后检查

- [ ] 运行健康检查
- [ ] 验证所有功能
- [ ] 检查监控告警
- [ ] 更新文档
- [ ] 清理临时文件

## 回滚检查清单

### 回滚前检查

- [ ] 确认回滚原因
- [ ] 评估回滚影响
- [ ] 准备回滚脚本
- [ ] 通知相关团队
- [ ] 备份当前状态

### 回滚中检查

- [ ] 停止当前服务
- [ ] 执行回滚操作
- [ ] 验证回滚结果
- [ ] 重启服务
- [ ] 检查服务状态

### 回滚后检查

- [ ] 运行健康检查
- [ ] 验证功能正常
- [ ] 检查数据完整性
- [ ] 更新监控配置
- [ ] 记录回滚原因

## 自动化脚本

### 迁移脚本

```bash
#!/bin/bash
# scripts/migrate.sh

set -e

echo "开始迁移流程..."

# 1. 备份当前状态
echo "备份当前状态..."
./scripts/backup.sh

# 2. 执行迁移
echo "执行迁移..."
pnpm db:migrate:prod

# 3. 验证迁移
echo "验证迁移结果..."
pnpm test

# 4. 健康检查
echo "执行健康检查..."
curl -f http://localhost:3001/health || exit 1

echo "迁移完成！"
```

### 回滚脚本

```bash
#!/bin/bash
# scripts/rollback.sh

set -e

echo "开始回滚流程..."

# 1. 停止服务
echo "停止服务..."
docker-compose down

# 2. 回滚数据库
echo "回滚数据库..."
./scripts/restore-db.sh

# 3. 回滚应用
echo "回滚应用..."
git checkout HEAD~1
pnpm build
docker-compose up -d

# 4. 健康检查
echo "执行健康检查..."
sleep 10
curl -f http://localhost:3001/health || exit 1

echo "回滚完成！"
```

## 故障恢复

### 常见故障场景

#### 1. 数据库连接失败

**症状**：应用无法连接到数据库

**恢复步骤**：
```bash
# 检查数据库状态
systemctl status postgresql

# 重启数据库
sudo systemctl restart postgresql

# 检查连接
psql -U aura_flow_user -d aura_flow -c "SELECT 1;"
```

#### 2. 应用启动失败

**症状**：Docker 容器无法启动

**恢复步骤**：
```bash
# 查看容器日志
docker logs aura-flow-backend

# 检查环境变量
docker exec aura-flow-backend env

# 重新构建镜像
docker-compose build --no-cache
docker-compose up -d
```

#### 3. 数据不一致

**症状**：数据迁移后出现不一致

**恢复步骤**：
```bash
# 停止应用
docker-compose down

# 恢复数据库备份
./scripts/restore-db.sh

# 重新启动
docker-compose up -d
```

## 最佳实践

### 迁移最佳实践

1. **渐进式迁移**：分步骤进行，每步都验证
2. **数据备份**：迁移前必须备份
3. **测试环境**：先在测试环境验证
4. **监控告警**：设置迁移过程监控
5. **回滚准备**：准备快速回滚方案

### 回滚最佳实践

1. **快速响应**：发现问题立即回滚
2. **数据安全**：确保回滚不丢失数据
3. **服务可用性**：最小化服务中断时间
4. **问题分析**：回滚后分析失败原因
5. **文档更新**：更新相关文档

## 联系信息

- **技术负责人**：tech@auraflow.com
- **运维团队**：ops@auraflow.com
- **紧急联系**：+86-xxx-xxxx-xxxx

## 更新日志

- **v1.0.0** (2025-09-19)：初始版本
  - 基础迁移和回滚流程
  - 自动化脚本
  - 故障恢复指南
