# 🎯 你需要做的具体操作

## 📋 总览：5个步骤，预计30分钟完成

| 步骤 | 操作 | 时间 | 难度 |
|------|------|------|------|
| 1 | 注册 Supabase | 5分钟 | ⭐ |
| 2 | 配置数据库 | 5分钟 | ⭐⭐ |
| 3 | 注册 Vercel | 3分钟 | ⭐ |
| 4 | 部署应用 | 10分钟 | ⭐⭐ |
| 5 | 测试验证 | 7分钟 | ⭐ |

---

## 步骤1：注册 Supabase（5分钟）

### 1.1 打开网站
- 浏览器访问：https://supabase.com
- 点击右上角 **"Start your project"**

### 1.2 注册账号
- 点击 **"Sign up"**
- 选择 **"Continue with GitHub"**（推荐）
- 授权 GitHub 访问

### 1.3 创建项目
- 点击 **"New Project"**
- 填写信息：
  ```
  Name: aura-flow-prod
  Database Password: [生成强密码，保存好]
  Region: Singapore
  ```
- 点击 **"Create new project"**
- 等待2分钟创建完成

### 1.4 获取配置信息
- 左侧菜单点击 **"Settings"** → **"API"**
- 复制这两个信息（保存到记事本）：
  ```
  Project URL: https://xxx.supabase.co
  anon public key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
  ```

---

## 步骤2：配置数据库（5分钟）

### 2.1 打开SQL编辑器
- 左侧菜单点击 **"SQL Editor"**
- 点击 **"New query"**

### 2.2 执行数据库脚本
- 打开我提供的文件：`deploy/supabase-init.sql`
- **全选复制** 所有内容
- 粘贴到SQL编辑器中
- 点击 **"Run"** 按钮

### 2.3 验证创建成功
- 应该看到：`Database initialization completed successfully!`
- 左侧菜单点击 **"Table Editor"**
- 确认看到5个表：users, tasks, insights, reflections, sessions

---

## 步骤3：注册 Vercel（3分钟）

### 3.1 打开网站
- 浏览器访问：https://vercel.com
- 点击 **"Sign Up"**

### 3.2 注册账号
- 选择 **"Continue with GitHub"**
- 授权 Vercel 访问 GitHub

### 3.3 导入项目
- 点击 **"New Project"**
- 选择 **"Import Git Repository"**
- 找到你的 `aura-flow` 仓库
- 点击 **"Import"**

---

## 步骤4：部署应用（10分钟）

### 4.1 配置项目
- **Project Name**: `aura-flow`
- **Framework Preset**: `Vite`
- 其他保持默认

### 4.2 添加环境变量
在 **"Environment Variables"** 部分，点击 **"Add"** 添加：

| Name | Value | 说明 |
|------|-------|------|
| `VITE_SUPABASE_URL` | `https://xxx.supabase.co` | 步骤1.4复制的Project URL |
| `VITE_SUPABASE_ANON_KEY` | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` | 步骤1.4复制的anon key |
| `VITE_APP_NAME` | `Aura Flow` | 应用名称 |
| `VITE_BUILD_VERSION` | `1.0.0` | 版本号 |
| `VITE_API_BASE_URL` | `https://xxx.supabase.co` | 同Project URL |
| `VITE_AI_PROVIDER` | `mock` | AI服务 |
| `VITE_ENABLE_TELEMETRY` | `false` | 遥测开关 |

### 4.3 开始部署
- 点击 **"Deploy"** 按钮
- 等待3-5分钟部署完成
- 记住生成的URL：`https://xxx.vercel.app`

---

## 步骤5：测试验证（7分钟）

### 5.1 运行测试脚本
```bash
# 在项目根目录运行
./deploy/test-deployment.sh https://你的应用URL.vercel.app
```

### 5.2 手动测试
在浏览器中测试：

1. **访问应用**
   - 打开 `https://你的应用URL.vercel.app`
   - 应该自动跳转到登录页面

2. **测试注册**
   - 点击 **"立即注册"**
   - 填写信息：
     ```
     姓名: 测试用户
     邮箱: test@example.com
     密码: password123
     确认密码: password123
     ```
   - 点击 **"创建账户"**

3. **测试登录**
   - 使用刚注册的账号登录
   - 或使用演示账号：`demo@auraflow.com` / `password123`

4. **测试功能**
   - ✅ 添加任务
   - ✅ 完成任务
   - ✅ 查看设置
   - ✅ 退出登录

5. **移动端测试**
   - 手机浏览器访问应用
   - 测试响应式设计

---

## 🚨 常见问题快速解决

### 问题1：部署失败
**解决**：检查环境变量是否正确复制

### 问题2：数据库连接失败
**解决**：确认Supabase URL和Key是否正确

### 问题3：页面显示异常
**解决**：等待2分钟重新访问

### 问题4：用户注册失败
**解决**：检查数据库表是否正确创建

---

## ✅ 完成检查清单

- [ ] Supabase项目创建成功
- [ ] 数据库表创建成功
- [ ] Vercel项目导入成功
- [ ] 环境变量配置完成
- [ ] 应用部署成功
- [ ] 用户注册功能正常
- [ ] 用户登录功能正常
- [ ] 任务管理功能正常
- [ ] 移动端显示正常

---

## 🎉 完成！

如果所有测试都通过，恭喜！你的应用已经成功部署到公网！

**应用信息**：
- 应用URL：`https://你的应用URL.vercel.app`
- 管理后台：Supabase控制台
- 部署平台：Vercel控制台

现在可以分享给朋友使用了！🌍
