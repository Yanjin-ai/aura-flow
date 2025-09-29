# 🚀 Supabase 快速配置指南

## 第一步：创建 Supabase 项目

1. 访问 [https://supabase.com](https://supabase.com)
2. 点击 "Start your project"
3. 使用 GitHub 登录
4. 创建新项目：
   - **项目名称**: `aura-flow`
   - **数据库密码**: 设置强密码（记住！）
   - **地区**: Singapore 或 Tokyo

## 第二步：获取配置信息

项目创建完成后，在左侧菜单找到 **Settings** → **API**：

- **Project URL**: `https://xxxxx.supabase.co`
- **anon public key**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`

## 第三步：配置数据库

1. 在左侧菜单找到 **SQL Editor**
2. 点击 **New query**
3. 复制并执行以下脚本：

```sql
-- 执行 deploy/supabase-init.sql 中的内容
-- 这个脚本会创建所有必要的表
```

## 第四步：配置 Vercel

1. 访问 [https://vercel.com](https://vercel.com)
2. 进入你的 `aura-flow-yanjin3` 项目
3. 点击 **Settings** → **Environment Variables**
4. 添加以下变量：

```
VITE_SUPABASE_URL = https://你的项目ID.supabase.co
VITE_SUPABASE_ANON_KEY = 你的匿名密钥
JWT_SECRET = 生成32位随机字符串
```

## 第五步：重新部署

1. 在 Vercel 中点击 **Deployments**
2. 点击最新的部署
3. 点击 **Redeploy**

## 验证配置

部署完成后，访问你的应用：
1. 注册新用户
2. 创建任务
3. 在 Supabase 的 **Table Editor** 中查看数据

## 故障排除

如果遇到问题：
1. 检查环境变量是否正确设置
2. 确认数据库脚本已执行
3. 查看 Vercel 部署日志
4. 检查 Supabase 项目状态

## 下一步

配置完成后，你的应用将具备：
- ✅ 真实用户认证
- ✅ 数据永久保存
- ✅ 多设备同步
- ✅ 准备商业化
