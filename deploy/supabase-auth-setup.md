# Supabase Auth 配置指南

## 概述

本项目已迁移到 Supabase Auth 系统，使用 cookie 认证替代自定义 JWT。

## 环境变量配置

### Vercel 环境变量

在 Vercel Dashboard 中配置以下环境变量：

```bash
# 前端 Supabase 配置
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key

# 服务端 Supabase 配置
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

### 获取 Supabase 密钥

1. 登录 [Supabase Dashboard](https://supabase.com/dashboard)
2. 选择你的项目
3. 进入 "Settings" → "API"
4. 复制以下信息：
   - **Project URL** → `VITE_SUPABASE_URL` 和 `SUPABASE_URL`
   - **anon public** → `VITE_SUPABASE_ANON_KEY` 和 `SUPABASE_ANON_KEY`
   - **service_role secret** → `SUPABASE_SERVICE_ROLE_KEY`

## Supabase 项目配置

### 1. 启用 Auth

确保 Supabase 项目已启用 Auth 功能：

1. 进入 "Authentication" → "Settings"
2. 确认 "Enable email confirmations" 设置
3. 配置 "Site URL" 为你的域名

### 2. 配置 Auth 设置

在 "Authentication" → "Settings" 中：

```bash
# Site URL
https://your-app.vercel.app

# Redirect URLs
https://your-app.vercel.app/auth/callback
```

### 3. 数据库表结构

确保数据库表结构与 Supabase Auth 兼容：

```sql
-- 用户表（可选，用于存储额外用户信息）
CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  name TEXT,
  language TEXT DEFAULT 'zh-CN',
  has_seen_welcome_guide BOOLEAN DEFAULT false,
  auto_rollover_enabled BOOLEAN DEFAULT true,
  auto_rollover_days INTEGER DEFAULT 7,
  rollover_notification_enabled BOOLEAN DEFAULT true,
  ai_daily_insights BOOLEAN DEFAULT true,
  ai_weekly_insights BOOLEAN DEFAULT true,
  ai_url_extraction BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 启用 RLS
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- RLS 策略
CREATE POLICY "Users can view own profile" ON user_profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON user_profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON user_profiles
  FOR INSERT WITH CHECK (auth.uid() = id);
```

## 认证流程

### 1. 用户注册

```javascript
// 前端注册
const { data, error } = await supabase.auth.signUp({
  email: 'user@example.com',
  password: 'password123',
  options: {
    data: {
      name: 'User Name'
    }
  }
});
```

### 2. 用户登录

```javascript
// 前端登录
const { data, error } = await supabase.auth.signInWithPassword({
  email: 'user@example.com',
  password: 'password123'
});
```

### 3. 获取用户信息

```javascript
// 前端获取用户信息
const { data: { user } } = await supabase.auth.getUser();

// 服务端获取用户信息（在 API 路由中）
const { data: { user } } = await supabase.auth.getUser();
```

## Cookie 认证

### 1. 自动 Cookie 管理

Supabase Auth 会自动管理认证 cookies：

- `sb-<project-ref>-auth-token` - 访问令牌
- `sb-<project-ref>-auth-token.0` - 刷新令牌（分片）

### 2. 验证 Cookie 认证

登录后，在浏览器开发者工具中检查：

1. **Application** → **Cookies**
2. 查找 `sb-` 开头的 cookies
3. 确认 cookies 已设置

### 3. API 请求

所有 API 请求会自动包含认证 cookies：

```javascript
// 前端请求（自动包含 cookies）
const response = await fetch('/api/auth/me-v2', {
  credentials: 'include'
});

// 服务端验证（自动从 cookies 获取用户信息）
const { data: { user } } = await supabase.auth.getUser();
```

## 测试认证

### 1. 注册测试

```bash
curl -X POST https://your-app.vercel.app/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"test123","name":"Test User"}'
```

### 2. 登录测试

```bash
curl -X POST https://your-app.vercel.app/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"test123"}'
```

### 3. 用户信息测试

```bash
curl -X GET https://your-app.vercel.app/api/auth/me-v2 \
  -H "Cookie: sb-<project-ref>-auth-token=<token>"
```

## 故障排除

### 常见问题

1. **Cookie 未设置**
   - 检查 `credentials: 'include'` 是否正确设置
   - 确认域名和路径配置正确

2. **认证失败**
   - 检查环境变量是否正确配置
   - 确认 Supabase 项目状态正常

3. **CORS 错误**
   - 确认 API 路由设置了正确的 CORS 头
   - 检查 `Access-Control-Allow-Credentials: true`

### 调试步骤

1. 检查浏览器 Network 标签页中的请求
2. 查看 Vercel 函数日志
3. 验证 Supabase Dashboard 中的用户数据
4. 测试 API 端点响应

## 安全注意事项

1. **Service Role Key**
   - 仅在服务端使用
   - 不要暴露给前端

2. **Cookie 安全**
   - 使用 HTTPS
   - 设置适当的 SameSite 策略

3. **RLS 策略**
   - 确保所有表都启用了 RLS
   - 正确配置访问策略
