# 🚀 Aura Flow 部署操作指南

## 📋 部署前准备

### 我已经为你准备好的文件：
- ✅ `deploy/supabase-init.sql` - 数据库初始化脚本
- ✅ `deploy/env-template.md` - 环境变量配置模板
- ✅ `vercel.json` - Vercel 部署配置
- ✅ `deploy/test-deployment.sh` - 部署测试脚本

### 你需要准备的东西：
- 📧 邮箱地址（用于注册账号）
- 📱 手机号码（用于验证）
- 💳 信用卡（可选，免费额度足够使用）

## 🎯 部署步骤

### 第一步：注册 Supabase 账号

1. **访问 Supabase 官网**
   - 打开浏览器，访问：https://supabase.com
   - 点击右上角的 "Start your project" 按钮

2. **注册账号**
   - 点击 "Sign up" 按钮
   - 选择 "Continue with GitHub"（推荐）或使用邮箱注册
   - 完成邮箱验证

3. **创建新项目**
   - 点击 "New Project" 按钮
   - 选择组织（如果没有，会提示创建）
   - 填写项目信息：
     - **Name**: `aura-flow-prod`
     - **Database Password**: 生成一个强密码（保存好，后面会用到）
     - **Region**: 选择 `Singapore` 或 `US East (N. Virginia)`
   - 点击 "Create new project"

4. **等待项目创建**
   - 项目创建需要 1-2 分钟
   - 创建完成后会自动跳转到项目控制台

### 第二步：配置 Supabase 数据库

1. **打开 SQL 编辑器**
   - 在 Supabase 控制台左侧菜单中，点击 "SQL Editor"
   - 点击 "New query" 按钮

2. **执行数据库初始化脚本**
   - 打开我提供的 `deploy/supabase-init.sql` 文件
   - 复制全部内容
   - 粘贴到 SQL 编辑器中
   - 点击 "Run" 按钮执行

3. **验证数据库创建**
   - 执行完成后，应该看到 "Database initialization completed successfully!" 消息
   - 在左侧菜单中点击 "Table Editor"，应该能看到以下表：
     - `users` - 用户表
     - `tasks` - 任务表
     - `insights` - 洞察表
     - `reflections` - 反思表
     - `sessions` - 会话表

4. **获取 API 配置信息**
   - 在左侧菜单中点击 "Settings" → "API"
   - 复制以下信息（稍后会用到）：
     - **Project URL**: `https://your-project-id.supabase.co`
     - **anon public key**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`

### 第三步：注册 Vercel 账号

1. **访问 Vercel 官网**
   - 打开浏览器，访问：https://vercel.com
   - 点击 "Sign Up" 按钮

2. **注册账号**
   - 选择 "Continue with GitHub"（推荐）
   - 授权 Vercel 访问你的 GitHub 账号
   - 完成账号设置

### 第四步：部署到 Vercel

1. **导入项目**
   - 在 Vercel 控制台中，点击 "New Project"
   - 选择 "Import Git Repository"
   - 找到你的 `aura-flow` 仓库，点击 "Import"

2. **配置项目设置**
   - **Project Name**: `aura-flow`（或你喜欢的名字）
   - **Framework Preset**: 选择 "Vite"
   - **Root Directory**: 保持默认（`./`）
   - **Build Command**: 保持默认（`npm run build`）
   - **Output Directory**: 保持默认（`dist`）

3. **配置环境变量**
   - 在 "Environment Variables" 部分，点击 "Add" 按钮
   - 按照以下表格添加环境变量：

   | Name | Value | 说明 |
   |------|-------|------|
   | `VITE_SUPABASE_URL` | `https://your-project-id.supabase.co` | 从 Supabase 复制的 Project URL |
   | `VITE_SUPABASE_ANON_KEY` | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` | 从 Supabase 复制的 anon public key |
   | `VITE_APP_NAME` | `Aura Flow` | 应用名称 |
   | `VITE_BUILD_VERSION` | `1.0.0` | 版本号 |
   | `VITE_API_BASE_URL` | `https://your-project-id.supabase.co` | API 基础 URL |
   | `VITE_AI_PROVIDER` | `mock` | AI 服务提供商 |
   | `VITE_ENABLE_TELEMETRY` | `false` | 是否启用遥测 |

4. **部署项目**
   - 点击 "Deploy" 按钮
   - 等待部署完成（通常需要 2-3 分钟）
   - 部署完成后会显示你的应用 URL，类似：`https://aura-flow.vercel.app`

### 第五步：测试部署

1. **运行测试脚本**
   ```bash
   # 在项目根目录运行
   ./deploy/test-deployment.sh https://your-app-url.vercel.app
   ```

2. **手动测试**
   - 在浏览器中访问你的应用 URL
   - 测试以下功能：
     - ✅ 访问登录页面
     - ✅ 访问注册页面
     - ✅ 注册新用户
     - ✅ 登录用户
     - ✅ 添加任务
     - ✅ 完成任务
     - ✅ 查看设置页面
     - ✅ 退出登录

3. **移动端测试**
   - 在手机浏览器中访问应用
   - 测试响应式设计是否正常
   - 测试触摸操作是否流畅

## 🔧 故障排除

### 常见问题及解决方案

#### 1. 部署失败
**问题**: Vercel 部署失败
**解决方案**:
- 检查环境变量是否正确配置
- 查看 Vercel 构建日志中的错误信息
- 确保所有必需的环境变量都已添加

#### 2. 数据库连接失败
**问题**: 应用无法连接到 Supabase
**解决方案**:
- 检查 `VITE_SUPABASE_URL` 和 `VITE_SUPABASE_ANON_KEY` 是否正确
- 确认 Supabase 项目状态正常
- 检查数据库表是否正确创建

#### 3. 用户注册失败
**问题**: 用户无法注册
**解决方案**:
- 检查 Supabase 数据库表是否正确创建
- 确认行级安全策略是否正确配置
- 查看浏览器控制台是否有错误信息

#### 4. 页面显示异常
**问题**: 页面样式或功能异常
**解决方案**:
- 检查构建是否成功
- 确认静态资源是否正确加载
- 查看浏览器控制台错误信息

## 📞 获取帮助

如果遇到问题，可以：

1. **查看日志**
   - Vercel 构建日志
   - Supabase 数据库日志
   - 浏览器控制台错误

2. **检查配置**
   - 环境变量是否正确
   - 数据库表是否创建
   - API 密钥是否有效

3. **联系支持**
   - 提供详细的错误信息
   - 描述复现步骤
   - 附上相关截图

## 🎉 部署完成

恭喜！你的 Aura Flow 应用已经成功部署到公网！

### 下一步操作：
1. 分享应用链接给朋友测试
2. 收集用户反馈
3. 根据反馈优化功能
4. 考虑购买自定义域名
5. 设置监控和告警

### 应用信息：
- **应用 URL**: `https://your-app.vercel.app`
- **管理后台**: Supabase 控制台
- **部署平台**: Vercel 控制台
- **数据库**: Supabase PostgreSQL

现在你的应用已经面向全球用户开放了！🌍
