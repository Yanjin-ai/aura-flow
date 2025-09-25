# Aura Flow 运维手册 (RUNBOOK)

## 概述

本文档提供了 Aura Flow 系统的运维指南，包括部署、监控、故障排除和日常维护操作。

## 系统架构

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   前端 (Vite)   │    │   后端 (Node)   │    │   数据库 (PG)   │
│   Port: 5173    │◄──►│   Port: 3001    │◄──►│   Port: 5432    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         └───────────────────────┼───────────────────────┘
                                 │
                    ┌─────────────────┐
                    │   Nginx 代理    │
                    │   Port: 80/443  │
                    └─────────────────┘
                                 │
                    ┌─────────────────┐
                    │   Redis 缓存    │
                    │   Port: 6379    │
                    └─────────────────┘
```

## SLO 目标

### 可用性目标
- **系统可用性**: 99.9% (每月停机时间 < 43.2 分钟)
- **API 响应时间**: P95 < 200ms, P99 < 500ms
- **数据库连接**: 99.95% 可用性
- **错误率**: < 0.1% (4xx/5xx 错误)

### 性能目标
- **页面加载时间**: 首屏 < 2s, 完全加载 < 5s
- **API 吞吐量**: > 1000 RPS
- **数据库查询**: P95 < 100ms
- **文件上传**: < 10MB, 处理时间 < 30s

### 安全目标
- **安全事件响应**: < 1 小时
- **漏洞修复**: 高危 < 24 小时, 中危 < 7 天
- **数据备份**: 每日备份, 恢复时间 < 4 小时

## 环境配置

### 开发环境
- 前端：`http://localhost:5173`
- 后端：`http://localhost:3001`
- 数据库：SQLite (`file:./dev.db`)

### 生产环境
- 前端：通过 Nginx 提供静态文件
- 后端：通过 Nginx 反向代理
- 数据库：PostgreSQL

## 部署指南

### 1. 开发环境部署

```bash
# 克隆项目
git clone <repository-url>
cd aura-flow

# 安装依赖
./scripts/setup.sh

# 启动服务
./start.sh
```

### 2. 生产环境部署

#### 使用 Docker Compose

```bash
# 构建并启动所有服务
docker-compose --profile production up -d

# 查看服务状态
docker-compose ps

# 查看日志
docker-compose logs -f
```

#### 手动部署

```bash
# 1. 构建前端
pnpm build

# 2. 启动后端
cd server
pnpm install
pnpm db:migrate:prod
pnpm start

# 3. 配置 Nginx
sudo cp nginx.conf /etc/nginx/sites-available/aura-flow
sudo ln -s /etc/nginx/sites-available/aura-flow /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

## 数据库管理

### 迁移操作

```bash
# 生成迁移文件
cd server
pnpm db:generate

# 应用迁移
pnpm db:migrate:prod

# 回滚迁移（谨慎使用）
pnpm db:rollback
```

### 备份与恢复

```bash
# 备份数据库
pnpm db:backup

# 恢复数据库
pnpm db:restore <backup-file>
```

### 数据种子

```bash
# 填充测试数据
pnpm db:seed
```

## 监控与日志

### 健康检查

```bash
# 检查服务状态
curl http://localhost:3001/health

# 检查监控指标
curl http://localhost:3001/monitoring/metrics
```

### 日志查看

```bash
# 查看应用日志
tail -f server/logs/combined.log

# 查看错误日志
tail -f server/logs/error.log

# 查看 Docker 日志
docker-compose logs -f backend
```

### 性能监控

- **Uptime 监控**：配置在 `server/src/services/monitoring.js`
- **Sentry 错误追踪**：通过环境变量 `VITE_SENTRY_DSN` 配置
- **系统指标**：CPU、内存、磁盘使用率

## 告警策略

### 关键指标告警
- **系统可用性 < 99%**: 立即告警 (P0)
- **API 响应时间 P95 > 500ms**: 5 分钟内告警 (P1)
- **数据库连接失败**: 立即告警 (P0)
- **错误率 > 1%**: 10 分钟内告警 (P1)
- **磁盘使用率 > 85%**: 30 分钟内告警 (P2)
- **内存使用率 > 90%**: 15 分钟内告警 (P1)

### 告警渠道
- **P0 (紧急)**: 短信 + 电话 + Slack
- **P1 (高优先级)**: 短信 + Slack + 邮件
- **P2 (中优先级)**: Slack + 邮件
- **P3 (低优先级)**: 邮件

### 告警升级策略
1. **0-15 分钟**: 值班工程师
2. **15-30 分钟**: 技术负责人
3. **30-60 分钟**: 工程总监
4. **> 60 分钟**: CTO

## 故障排除

### 高优先级问题 (P0-P1)

#### 1. 数据库连接失败
**症状**: API 返回 500 错误，日志显示数据库连接超时
**排查步骤**:
```bash
# 检查数据库状态
systemctl status postgresql
pg_isready -h localhost -p 5432

# 检查连接数
psql -c "SELECT count(*) FROM pg_stat_activity;"

# 检查数据库日志
tail -f /var/log/postgresql/postgresql-*.log
```
**解决方案**:
- 重启 PostgreSQL 服务
- 检查连接池配置
- 清理长时间运行的查询

#### 2. CORS 错误
**症状**: 前端无法访问 API，浏览器控制台显示 CORS 错误
**排查步骤**:
```bash
# 检查后端 CORS 配置
grep -n "corsOptions" server/src/index.js

# 检查环境变量
echo $CORS_ORIGIN
```
**解决方案**:
- 更新 CORS 配置
- 检查前端域名是否在白名单中
- 重启后端服务

#### 3. JWT Token 验证失败
**症状**: 用户无法登录，API 返回 401 错误
**排查步骤**:
```bash
# 检查 JWT 密钥
echo $JWT_SECRET

# 检查 Token 过期时间
node -e "console.log(process.env.JWT_EXPIRES_IN)"
```
**解决方案**:
- 检查 JWT 密钥配置
- 验证 Token 格式
- 检查时钟同步

#### 4. AI 服务配额超限
**症状**: 洞察生成失败，返回配额超限错误
**排查步骤**:
```bash
# 检查 AI 服务状态
curl -f http://localhost:3001/monitoring/ai-status

# 检查成本限制
grep -n "DAILY_COST_LIMIT" server/src/middleware/aiCostControl.js
```
**解决方案**:
- 检查 AI 提供商配额
- 调整成本限制配置
- 启用降级模式

#### 5. 静态资源 404
**症状**: 前端页面无法加载，静态资源返回 404
**排查步骤**:
```bash
# 检查 Nginx 配置
nginx -t
systemctl status nginx

# 检查静态文件目录
ls -la /usr/share/nginx/html/
```
**解决方案**:
- 检查 Nginx 配置
- 重新构建前端
- 检查文件权限

### 常见问题

#### 1. 服务无法启动

**症状**：服务启动失败或端口被占用

**解决方案**：
```bash
# 检查端口占用
lsof -i :3001
lsof -i :5173

# 杀死占用进程
kill -9 <PID>

# 重新启动服务
./start.sh
```

#### 2. 数据库连接失败

**症状**：`DATABASE_URL` 环境变量未找到

**解决方案**：
```bash
# 检查环境变量
cd server
cat .env

# 创建环境变量文件
cp .env.example .env
# 编辑 .env 文件，设置正确的 DATABASE_URL
```

#### 3. CORS 错误

**症状**：前端无法访问后端 API

**解决方案**：
```bash
# 检查后端 CORS 配置
grep -n "corsOptions" server/src/index.js

# 确保 NODE_ENV 设置正确
export NODE_ENV=development
```

#### 4. 前端构建失败

**症状**：Sentry 导入错误或其他构建错误

**解决方案**：
```bash
# 安装缺失的依赖
pnpm add @sentry/browser

# 清理缓存重新构建
rm -rf node_modules/.vite
pnpm build
```

### 日志分析

#### 错误日志模式

```bash
# 查找错误日志
grep -i "error" server/logs/combined.log

# 查找特定用户的操作
grep "userId.*123" server/logs/combined.log

# 查找 API 请求
grep "API 请求" server/logs/combined.log
```

#### 性能分析

```bash
# 查找慢请求
grep "responseTime.*[5-9][0-9][0-9][0-9]ms" server/logs/combined.log

# 统计请求类型
grep "API 请求" server/logs/combined.log | awk '{print $NF}' | sort | uniq -c
```

## 安全维护

### 定期任务

1. **更新依赖**：
```bash
# 检查过时的依赖
pnpm outdated

# 更新依赖
pnpm update
```

2. **安全扫描**：
```bash
# 运行安全审计
pnpm audit

# 修复安全漏洞
pnpm audit fix
```

3. **备份验证**：
```bash
# 验证备份文件
pnpm db:backup --verify

# 测试恢复流程
pnpm db:restore --test <backup-file>
```

### 访问控制

- **管理员权限**：通过 `role: 'admin'` 字段控制
- **API 速率限制**：配置在 `server/src/middleware/rateLimiter.js`
- **CORS 策略**：配置在 `server/src/index.js`

## 扩展与优化

### 水平扩展

1. **负载均衡**：配置多个后端实例
2. **数据库集群**：设置 PostgreSQL 主从复制
3. **缓存层**：添加 Redis 缓存

### 性能优化

1. **前端优化**：
   - 启用 Gzip 压缩
   - 配置 CDN
   - 实现懒加载

2. **后端优化**：
   - 数据库索引优化
   - 查询缓存
   - 连接池配置

## 回滚流程

### 自动回滚触发条件
- 健康检查连续失败 > 3 次
- 错误率 > 5% 持续 5 分钟
- 响应时间 P95 > 2s 持续 10 分钟
- 数据库连接失败率 > 10%

### 回滚步骤

#### 1. 应用回滚
```bash
# 停止当前服务
docker-compose down

# 回滚到上一个版本
docker tag aura-flow-backend:latest aura-flow-backend:backup
docker tag aura-flow-backend:previous aura-flow-backend:latest

# 重启服务
docker-compose up -d

# 验证回滚
curl -f http://localhost/health
```

#### 2. 数据库回滚
```bash
# 创建回滚点
pg_dump -U aura_flow_user -d aura_flow > backup_before_rollback.sql

# 回滚到备份
psql -U aura_flow_user -d aura_flow -c "DROP SCHEMA public CASCADE;"
psql -U aura_flow_user -d aura_flow -c "CREATE SCHEMA public;"
psql -U aura_flow_user -d aura_flow < backup_before_rollback.sql
```

#### 3. 配置回滚
```bash
# 备份当前配置
cp .env.production .env.production.backup

# 回滚到上一个配置
cp .env.production.previous .env.production

# 重启服务
docker-compose restart
```

### 回滚验证清单
- [ ] 健康检查通过
- [ ] 关键功能正常
- [ ] 数据库连接正常
- [ ] 用户登录正常
- [ ] API 响应时间正常
- [ ] 错误率 < 1%

## 数据恢复演练

### 演练频率
- **月度演练**: 数据库备份恢复
- **季度演练**: 完整系统恢复
- **年度演练**: 灾难恢复

### 演练步骤

#### 1. 数据库恢复演练
```bash
# 创建测试环境
docker run -d --name test-db -e POSTGRES_PASSWORD=test postgres:15

# 恢复备份
psql -h localhost -U postgres -d postgres < backup_20241220.sql

# 验证数据完整性
psql -h localhost -U postgres -d postgres -c "SELECT COUNT(*) FROM users;"
```

#### 2. 应用恢复演练
```bash
# 部署到测试环境
docker-compose -f docker-compose.test.yml up -d

# 运行健康检查
./scripts/smoke.sh

# 运行 E2E 测试
pnpm playwright test
```

#### 3. 完整恢复演练
```bash
# 模拟灾难场景
docker-compose down
docker volume rm aura-flow_postgres_data

# 从备份恢复
docker-compose up -d db
sleep 30
psql -h localhost -U postgres -d postgres < latest_backup.sql

# 启动应用
docker-compose up -d

# 验证系统功能
./scripts/smoke.sh
```

### 恢复时间目标 (RTO)
- **数据库恢复**: < 30 分钟
- **应用恢复**: < 15 分钟
- **完整系统恢复**: < 60 分钟

### 恢复点目标 (RPO)
- **数据丢失**: < 1 小时
- **配置丢失**: < 15 分钟

## 紧急响应

### 服务中断

1. **立即响应**：
   - 检查服务状态：`docker-compose ps`
   - 查看错误日志：`docker-compose logs backend`
   - 重启服务：`docker-compose restart backend`

2. **回滚操作**：
   ```bash
   # 回滚到上一个版本
   git checkout <previous-commit>
   docker-compose up -d --build
   ```

3. **数据恢复**：
   ```bash
   # 从备份恢复
   pnpm db:restore <latest-backup>
   ```

### 安全事件

1. **检测异常**：
   - 检查访问日志
   - 监控错误率
   - 分析用户行为

2. **响应措施**：
   - 临时禁用可疑用户
   - 增加速率限制
   - 通知安全团队

## 联系信息

- **开发团队**：dev@auraflow.com
- **运维团队**：ops@auraflow.com
- **紧急联系**：+86-xxx-xxxx-xxxx

## 更新日志

- **v1.0.0** (2025-09-19)：初始版本
  - 基础功能实现
  - 监控和日志系统
  - 安全配置
  - 部署文档
