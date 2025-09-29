# 🚀 生产环境配置指南

## 环境变量配置

在生产环境中，需要设置以下环境变量：

### Supabase 配置
```bash
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
```

### API 配置
```bash
VITE_API_BASE_URL=https://your-api-domain.com
```

### AI 服务配置
```bash
VITE_AI_PROVIDER=openai
VITE_AI_API_KEY=your-openai-api-key
VITE_AI_MODEL=gpt-3.5-turbo
```

### 监控配置
```bash
VITE_SENTRY_DSN=your-sentry-dsn
VITE_ENABLE_TELEMETRY=true
```

### 构建信息
```bash
VITE_BUILD_VERSION=1.0.0
```

## 部署步骤

### 1. Supabase 设置
1. 在 [Supabase](https://supabase.com) 创建新项目
2. 在 SQL 编辑器中执行 `deploy/supabase-init.sql` 脚本
3. 获取项目 URL 和 anon key

### 2. Vercel 部署
1. 在 Vercel 项目设置中添加环境变量
2. 设置所有必需的环境变量
3. 重新部署应用

### 3. 验证部署
1. 访问部署的应用
2. 测试用户注册和登录
3. 测试任务创建和管理
4. 检查数据库连接

## 配置说明

- **开发环境**：使用 Mock 服务，无需外部依赖
- **生产环境**：使用真实 Supabase 数据库和 AI 服务
- **自动切换**：根据 `VITE_SUPABASE_URL` 是否存在自动选择服务类型
