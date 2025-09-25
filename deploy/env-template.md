# 🔧 环境变量配置模板

## Vercel 环境变量配置

在 Vercel 项目设置中添加以下环境变量：

### 必需的环境变量

```bash
# Supabase 配置
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here

# 应用配置
VITE_APP_NAME=Aura Flow
VITE_BUILD_VERSION=1.0.0
VITE_API_BASE_URL=https://your-project-id.supabase.co

# AI 服务配置
VITE_AI_PROVIDER=mock
VITE_AI_API_KEY=your-ai-api-key

# 监控配置
VITE_SENTRY_DSN=your-sentry-dsn
VITE_ENABLE_TELEMETRY=false

# 功能开关
VITE_ENABLE_ANALYTICS=true
VITE_ENABLE_ERROR_REPORTING=true
```

### 可选的环境变量

```bash
# 开发配置
VITE_DEV_MOCK=on
VITE_DEBUG_MODE=false

# 性能配置
VITE_ENABLE_PWA=true
VITE_CACHE_VERSION=1.0.0

# 安全配置
VITE_CSP_NONCE=true
VITE_SECURE_COOKIES=true
```

## 如何获取 Supabase 配置

### 1. 获取 Supabase URL
1. 登录 Supabase 控制台
2. 选择你的项目
3. 进入 Settings → API
4. 复制 "Project URL"

### 2. 获取 Supabase Anon Key
1. 在同一个页面
2. 复制 "anon public" 密钥

### 3. 在 Vercel 中配置
1. 进入 Vercel 项目设置
2. 点击 "Environment Variables"
3. 添加上述所有变量
4. 点击 "Save" 并重新部署

## 环境变量说明

| 变量名 | 说明 | 示例值 |
|--------|------|--------|
| `VITE_SUPABASE_URL` | Supabase 项目 URL | `https://abc123.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | Supabase 匿名密钥 | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` |
| `VITE_APP_NAME` | 应用名称 | `Aura Flow` |
| `VITE_AI_PROVIDER` | AI 服务提供商 | `mock` 或 `openai` |
| `VITE_ENABLE_TELEMETRY` | 是否启用遥测 | `false` |

## 安全注意事项

⚠️ **重要提醒**：
- 不要将真实的 API 密钥提交到代码仓库
- 使用环境变量存储敏感信息
- 定期轮换 API 密钥
- 限制 API 密钥的权限范围

## 验证配置

配置完成后，可以通过以下方式验证：

1. 检查环境变量是否正确加载
2. 测试 Supabase 连接
3. 验证 API 调用是否正常
4. 检查控制台是否有错误信息
