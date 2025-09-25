# Aura Flow 环境变量清单

## 概述

本文档列出了 Aura Flow 系统中使用的所有环境变量，包括前端和后端配置。

## 前端环境变量

### 必需变量

| 变量名 | 描述 | 示例值 | 必需 |
|--------|------|--------|------|
| `VITE_API_BASE_URL` | 后端 API 基础 URL | `http://localhost:3001` | ✅ |
| `VITE_APP_ID` | 应用标识符 | `aura-flow` | ✅ |
| `VITE_BUILD_VERSION` | 构建版本号 | `1.0.0` | ✅ |

### 可选变量

| 变量名 | 描述 | 示例值 | 默认值 |
|--------|------|--------|--------|
| `VITE_AI_PROVIDER` | AI 提供商 | `openai`, `qwen`, `minimax`, `mock` | `mock` |
| `VITE_SENTRY_DSN` | Sentry 错误追踪 DSN | `https://xxx@sentry.io/xxx` | - |
| `VITE_ENABLE_TELEMETRY` | 启用遥测 | `true`, `false` | `false` |
| `VITE_DEV_MOCK` | 开发环境 Mock | `on`, `off` | `on` |
| `VITE_CSP_NONCE` | CSP nonce | 动态生成 | - |
| `VITE_DEBUG` | 调试模式 | `true`, `false` | `false` |

## 后端环境变量

### 必需变量

| 变量名 | 描述 | 示例值 | 必需 |
|--------|------|--------|------|
| `NODE_ENV` | 运行环境 | `development`, `production` | ✅ |
| `PORT` | 服务端口 | `3001` | ✅ |
| `DATABASE_URL` | 数据库连接字符串 | `postgresql://user:pass@host:5432/db` | ✅ |
| `JWT_SECRET` | JWT 签名密钥 | 32 位随机字符串 | ✅ |
| `REFRESH_TOKEN_SECRET` | 刷新令牌密钥 | 32 位随机字符串 | ✅ |

### 安全配置

| 变量名 | 描述 | 示例值 | 默认值 |
|--------|------|--------|--------|
| `CORS_ORIGIN` | CORS 允许的源 | `https://yourdomain.com` | `http://localhost:5173` |
| `BCRYPT_ROUNDS` | 密码加密轮数 | `12` | `12` |
| `SESSION_SECRET` | 会话密钥 | 32 位随机字符串 | - |
| `TRUST_PROXY` | 信任代理 | `true`, `false` | `false` |
| `SECURE_COOKIES` | 安全 Cookie | `true`, `false` | `false` |
| `SAME_SITE_COOKIES` | SameSite 策略 | `strict`, `lax`, `none` | `strict` |

### 速率限制配置

| 变量名 | 描述 | 示例值 | 默认值 |
|--------|------|--------|--------|
| `RATE_LIMIT_WINDOW_MS` | 速率限制窗口 | `60000` | `60000` |
| `RATE_LIMIT_MAX` | 最大请求数 | `120` | `120` |
| `RATE_LIMIT_LOGIN_MAX` | 登录最大尝试次数 | `5` | `5` |
| `RATE_LIMIT_LOGIN_WINDOW_MS` | 登录限制窗口 | `900000` | `900000` |

### AI 服务配置

| 变量名 | 描述 | 示例值 | 默认值 |
|--------|------|--------|--------|
| `AI_PROVIDER` | AI 提供商 | `openai`, `qwen`, `minimax` | `openai` |
| `OPENAI_API_KEY` | OpenAI API 密钥 | `sk-xxx` | - |
| `OPENAI_BASE_URL` | OpenAI API 基础 URL | `https://api.openai.com/v1` | `https://api.openai.com/v1` |

### 监控配置

| 变量名 | 描述 | 示例值 | 默认值 |
|--------|------|--------|--------|
| `SENTRY_DSN` | Sentry DSN | `https://xxx@sentry.io/xxx` | - |
| `LOG_LEVEL` | 日志级别 | `error`, `warn`, `info`, `debug` | `info` |
| `ENABLE_METRICS` | 启用指标收集 | `true`, `false` | `true` |
| `HEALTH_CHECK_INTERVAL` | 健康检查间隔 | `30000` | `30000` |

### 文件上传配置

| 变量名 | 描述 | 示例值 | 默认值 |
|--------|------|--------|--------|
| `MAX_FILE_SIZE` | 最大文件大小 | `10485760` | `10485760` |
| `UPLOAD_DIR` | 上传目录 | `./uploads` | `./uploads` |

### 备份配置

| 变量名 | 描述 | 示例值 | 默认值 |
|--------|------|--------|--------|
| `BACKUP_RETENTION_DAYS` | 备份保留天数 | `30` | `30` |
| `BACKUP_SCHEDULE` | 备份计划 | `0 2 * * *` | `0 2 * * *` |

## 数据库环境变量

### PostgreSQL 配置

| 变量名 | 描述 | 示例值 | 默认值 |
|--------|------|--------|--------|
| `POSTGRES_DB` | 数据库名 | `aura_flow` | `aura_flow` |
| `POSTGRES_USER` | 数据库用户 | `aura_flow_user` | `aura_flow_user` |
| `POSTGRES_PASSWORD` | 数据库密码 | 强密码 | - |
| `POSTGRES_HOST` | 数据库主机 | `localhost` | `localhost` |
| `POSTGRES_PORT` | 数据库端口 | `5432` | `5432` |

### Redis 配置

| 变量名 | 描述 | 示例值 | 默认值 |
|--------|------|--------|--------|
| `REDIS_HOST` | Redis 主机 | `localhost` | `localhost` |
| `REDIS_PORT` | Redis 端口 | `6379` | `6379` |
| `REDIS_PASSWORD` | Redis 密码 | 强密码 | - |
| `REDIS_DB` | Redis 数据库 | `0` | `0` |

## 部署环境变量

### Docker 配置

| 变量名 | 描述 | 示例值 | 默认值 |
|--------|------|--------|--------|
| `DOCKER_REGISTRY` | Docker 镜像仓库 | `registry.example.com` | - |
| `DOCKER_USERNAME` | Docker 用户名 | `username` | - |
| `DOCKER_PASSWORD` | Docker 密码 | 强密码 | - |

### 生产环境配置

| 变量名 | 描述 | 示例值 | 默认值 |
|--------|------|--------|--------|
| `PRODUCTION_URL` | 生产环境 URL | `https://yourdomain.com` | - |
| `SSL_CERT_PATH` | SSL 证书路径 | `/etc/ssl/certs/cert.pem` | - |
| `SSL_KEY_PATH` | SSL 私钥路径 | `/etc/ssl/private/key.pem` | - |

## 环境变量设置指南

### 开发环境

1. 复制环境变量模板：
```bash
cp .env.example .env.local
cp server/.env.example server/.env
```

2. 更新必需变量：
```bash
# 前端
VITE_API_BASE_URL=http://localhost:3001
VITE_APP_ID=aura-flow-dev

# 后端
NODE_ENV=development
DATABASE_URL=file:./dev.db
JWT_SECRET=your-development-secret-key
```

### 生产环境

1. 生成强密钥：
```bash
# 生成 JWT 密钥
openssl rand -base64 32

# 生成刷新令牌密钥
openssl rand -base64 32

# 生成会话密钥
openssl rand -base64 32
```

2. 设置生产环境变量：
```bash
# 前端
VITE_API_BASE_URL=https://api.yourdomain.com
VITE_AI_PROVIDER=openai
VITE_SENTRY_DSN=https://xxx@sentry.io/xxx
VITE_ENABLE_TELEMETRY=true

# 后端
NODE_ENV=production
DATABASE_URL=postgresql://user:pass@host:5432/db
JWT_SECRET=your-production-secret-key
CORS_ORIGIN=https://yourdomain.com
TRUST_PROXY=true
SECURE_COOKIES=true
```

## 安全注意事项

### 密钥管理
- 使用强随机密钥（至少 32 位）
- 定期轮换密钥
- 不要在代码中硬编码密钥
- 使用密钥管理服务（如 AWS Secrets Manager）

### 环境隔离
- 开发、测试、生产环境使用不同的密钥
- 限制生产环境访问权限
- 使用环境变量注入，避免配置文件泄露

### 监控和审计
- 记录所有环境变量变更
- 监控异常访问
- 定期审计密钥使用情况

## 故障排除

### 常见问题

1. **环境变量未生效**
   - 检查变量名拼写
   - 确认环境变量文件位置
   - 重启服务

2. **密钥验证失败**
   - 检查密钥格式
   - 确认密钥长度
   - 验证密钥一致性

3. **数据库连接失败**
   - 检查连接字符串格式
   - 验证数据库服务状态
   - 确认网络连通性

### 调试命令

```bash
# 检查环境变量
env | grep VITE_
env | grep NODE_

# 验证数据库连接
psql $DATABASE_URL -c "SELECT 1;"

# 测试 API 连接
curl -f $VITE_API_BASE_URL/health
```
