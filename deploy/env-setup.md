# 环境变量配置指南

## Vercel 环境变量设置

在 Vercel 部署中，你需要在项目设置中配置以下环境变量：

### 必需的环境变量

```bash
# Supabase 配置
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key

# Supabase Auth 配置（用于服务端 API）
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# JWT 配置（已弃用，现在使用 Supabase Auth）
# JWT_SECRET=your-super-secret-jwt-key

# AI 配置（可选）
VITE_AI_PROVIDER=openai
VITE_AI_API_KEY=your-openai-api-key
VITE_AI_MODEL=gpt-3.5-turbo

# 监控配置（可选）
VITE_SENTRY_DSN=your-sentry-dsn
VITE_ENABLE_TELEMETRY=false

# 构建信息（可选）
VITE_BUILD_VERSION=1.0.0
```

## 如何设置环境变量

### 1. 在 Vercel Dashboard 中设置

1. 登录 [Vercel Dashboard](https://vercel.com/dashboard)
2. 选择你的项目
3. 进入 "Settings" 标签页
4. 点击 "Environment Variables"
5. 添加上述环境变量

### 2. 使用 Vercel CLI 设置

```bash
# 安装 Vercel CLI
npm i -g vercel

# 登录 Vercel
vercel login

# 设置环境变量
vercel env add VITE_SUPABASE_URL
vercel env add VITE_SUPABASE_ANON_KEY
vercel env add JWT_SECRET
```

## Supabase 配置

### 1. 创建 Supabase 项目

1. 访问 [Supabase](https://supabase.com)
2. 创建新项目
3. 获取项目 URL 和 anon key

### 2. 初始化数据库

在 Supabase SQL 编辑器中执行 `deploy/supabase-init.sql` 脚本：

```sql
-- 执行 deploy/supabase-init.sql 中的所有 SQL 语句
```

### 3. 配置 Row Level Security (RLS)

确保以下 RLS 策略已启用：

```sql
-- 用户表 RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- 任务表 RLS
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

-- 其他表的 RLS 策略...
```

## 测试配置

### 1. 健康检查

访问 `/api/health` 端点检查服务状态：

```bash
curl https://your-app.vercel.app/api/health
```

### 2. 数据库连接测试

检查 Supabase 连接是否正常：

```bash
curl -X POST https://your-app.vercel.app/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"test123","name":"Test User"}'
```

## 故障排除

### 常见问题

1. **环境变量未生效**
   - 确保在 Vercel 中正确设置了环境变量
   - 重新部署项目

2. **Supabase 连接失败**
   - 检查 URL 和 anon key 是否正确
   - 确认 Supabase 项目状态正常

3. **数据库权限错误**
   - 检查 RLS 策略是否正确配置
   - 确认 anon key 有正确的权限

### 调试步骤

1. 检查 Vercel 函数日志
2. 验证环境变量是否正确加载
3. 测试 Supabase 连接
4. 检查数据库表结构

## 安全注意事项

1. **不要在前端暴露敏感信息**
   - 只使用 `VITE_` 前缀的环境变量
   - 敏感信息使用服务端环境变量

2. **定期轮换密钥**
   - 定期更新 JWT_SECRET
   - 监控 API 使用情况

3. **启用 RLS**
   - 确保所有表都启用了 RLS
   - 正确配置访问策略
