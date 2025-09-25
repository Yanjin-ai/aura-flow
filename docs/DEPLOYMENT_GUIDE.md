# 🚀 Aura Flow 部署指南

## 📋 部署方案对比

| 方案 | 成本 | 难度 | 推荐度 | 适用场景 |
|------|------|------|--------|----------|
| Vercel + Railway | 免费 | ⭐⭐ | ⭐⭐⭐⭐⭐ | 个人项目、演示 |
| 云服务器 + 域名 | 200-500元/年 | ⭐⭐⭐ | ⭐⭐⭐⭐ | 正式项目 |
| Docker VPS | 100-300元/年 | ⭐⭐⭐⭐ | ⭐⭐⭐ | 技术用户 |

## 🌟 方案一：免费部署（推荐）

### 使用 Vercel + Railway

**优点**：
- ✅ 完全免费
- ✅ 自动 HTTPS
- ✅ 全球 CDN
- ✅ 自动部署
- ✅ 免费域名

### 部署步骤

#### 1. 准备代码
```bash
# 确保代码已推送到 GitHub
git add .
git commit -m "准备部署"
git push origin main
```

#### 2. 部署前端到 Vercel
1. 访问 [vercel.com](https://vercel.com)
2. 使用 GitHub 账号登录
3. 点击 "New Project"
4. 选择你的 GitHub 仓库
5. 配置环境变量：
   ```
   VITE_API_BASE_URL=https://your-backend.railway.app
   VITE_AI_PROVIDER=mock
   VITE_ENABLE_TELEMETRY=false
   ```
6. 点击 "Deploy"
7. 获得免费域名：`yourapp.vercel.app`

#### 3. 部署后端到 Railway
1. 访问 [railway.app](https://railway.app)
2. 使用 GitHub 账号登录
3. 点击 "New Project" → "Deploy from GitHub repo"
4. 选择你的仓库
5. 配置环境变量：
   ```
   NODE_ENV=production
   DATABASE_URL=postgresql://...
   JWT_SECRET=your-super-secret-jwt-key
   CORS_ORIGIN=https://yourapp.vercel.app
   ```
6. 添加 PostgreSQL 数据库
7. 获得后端域名：`your-backend.railway.app`

#### 4. 配置数据库
```bash
# 在 Railway 控制台运行数据库迁移
pnpm server:db:generate
pnpm server:db:push
pnpm server:db:seed
```

## 💰 方案二：购买域名 + 云服务

### 成本估算
- **域名**: 50-100元/年
- **云服务器**: 100-300元/月
- **总计**: 约 200-500元/年

### 部署步骤

#### 1. 购买域名
推荐域名注册商：
- 阿里云万网
- 腾讯云
- GoDaddy

#### 2. 购买云服务器
推荐配置：
- **CPU**: 2核
- **内存**: 4GB
- **存储**: 40GB SSD
- **带宽**: 3Mbps

#### 3. 服务器配置
```bash
# 1. 安装 Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh

# 2. 安装 Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/download/v2.20.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# 3. 克隆项目
git clone https://github.com/your-username/aura-flow.git
cd aura-flow

# 4. 配置环境变量
cp .env.example .env.production
# 编辑 .env.production 文件
```

#### 4. 配置域名解析
在域名管理后台添加 A 记录：
```
A    @    你的服务器IP
A    www  你的服务器IP
```

#### 5. 启动服务
```bash
# 使用生产环境配置
pnpm docker:prod

# 查看服务状态
docker-compose ps
```

#### 6. 配置 SSL 证书
```bash
# 安装 Certbot
sudo apt install certbot python3-certbot-nginx

# 获取 SSL 证书
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
```

## 🐳 方案三：Docker VPS 部署

### 使用项目自带的 Docker 配置

#### 1. 购买 VPS
推荐 VPS 提供商：
- 腾讯云轻量应用服务器
- 阿里云 ECS
- DigitalOcean
- Vultr

#### 2. 服务器配置
```bash
# 1. 更新系统
sudo apt update && sudo apt upgrade -y

# 2. 安装 Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh

# 3. 安装 Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/download/v2.20.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# 4. 克隆项目
git clone https://github.com/your-username/aura-flow.git
cd aura-flow
```

#### 3. 配置生产环境
```bash
# 1. 创建生产环境配置
cp .env.example .env.production

# 2. 编辑环境变量
nano .env.production
```

**环境变量配置**：
```bash
# 数据库配置
POSTGRES_DB=aura_flow
POSTGRES_USER=aura_flow_user
POSTGRES_PASSWORD=your-secure-password

# JWT 配置
JWT_SECRET=your-super-secret-jwt-key-change-in-production
REFRESH_TOKEN_SECRET=your-refresh-secret

# 域名配置
CORS_ORIGIN=https://yourdomain.com

# AI 服务配置
AI_PROVIDER=openai
OPENAI_API_KEY=your-openai-key
```

#### 4. 启动服务
```bash
# 使用生产环境配置启动
docker-compose -f docker-compose.prod.yml up -d

# 查看服务状态
docker-compose -f docker-compose.prod.yml ps

# 查看日志
docker-compose -f docker-compose.prod.yml logs -f
```

#### 5. 配置 Nginx
```bash
# 1. 安装 Nginx
sudo apt install nginx

# 2. 配置 Nginx
sudo nano /etc/nginx/sites-available/aura-flow
```

**Nginx 配置**：
```nginx
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;

    location / {
        proxy_pass http://localhost:80;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

```bash
# 3. 启用站点
sudo ln -s /etc/nginx/sites-available/aura-flow /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

## 🔧 部署后配置

### 1. 数据库初始化
```bash
# 进入后端容器
docker-compose -f docker-compose.prod.yml exec api bash

# 运行数据库迁移
pnpm db:generate
pnpm db:push
pnpm db:seed
```

### 2. 健康检查
```bash
# 检查前端
curl https://yourdomain.com

# 检查后端 API
curl https://yourdomain.com/health

# 检查数据库
docker-compose -f docker-compose.prod.yml exec db psql -U aura_flow_user -d aura_flow -c "SELECT 1;"
```

### 3. 监控和日志
```bash
# 查看服务状态
docker-compose -f docker-compose.prod.yml ps

# 查看日志
docker-compose -f docker-compose.prod.yml logs -f

# 查看资源使用
docker stats
```

## 🛡️ 安全配置

### 1. 防火墙配置
```bash
# 只开放必要端口
sudo ufw allow 22    # SSH
sudo ufw allow 80    # HTTP
sudo ufw allow 443   # HTTPS
sudo ufw enable
```

### 2. SSL 证书配置
```bash
# 使用 Let's Encrypt 免费证书
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com

# 自动续期
sudo crontab -e
# 添加：0 12 * * * /usr/bin/certbot renew --quiet
```

### 3. 环境变量安全
```bash
# 使用强密码
JWT_SECRET=$(openssl rand -base64 32)
POSTGRES_PASSWORD=$(openssl rand -base64 32)

# 限制文件权限
chmod 600 .env.production
```

## 📊 性能优化

### 1. 数据库优化
```bash
# 配置 PostgreSQL
sudo nano /etc/postgresql/14/main/postgresql.conf
```

### 2. Nginx 优化
```bash
# 启用 Gzip 压缩
# 配置缓存
# 设置安全头
```

### 3. 监控设置
```bash
# 安装监控工具
sudo apt install htop iotop nethogs

# 设置日志轮转
sudo nano /etc/logrotate.d/aura-flow
```

## 🆘 故障排除

### 常见问题

1. **服务无法启动**
   ```bash
   # 检查端口占用
   sudo netstat -tlnp | grep :80
   
   # 检查 Docker 状态
   docker ps -a
   ```

2. **数据库连接失败**
   ```bash
   # 检查数据库状态
   docker-compose -f docker-compose.prod.yml exec db pg_isready
   
   # 检查连接字符串
   echo $DATABASE_URL
   ```

3. **SSL 证书问题**
   ```bash
   # 检查证书状态
   sudo certbot certificates
   
   # 重新获取证书
   sudo certbot renew --force-renewal
   ```

## 🎯 推荐部署方案

### 新手用户
**推荐**: Vercel + Railway 免费部署
- 成本：0元
- 时间：30分钟
- 难度：⭐⭐

### 正式项目
**推荐**: 购买域名 + 云服务器
- 成本：200-500元/年
- 时间：2-4小时
- 难度：⭐⭐⭐

### 技术用户
**推荐**: Docker VPS 部署
- 成本：100-300元/年
- 时间：1-2小时
- 难度：⭐⭐⭐⭐

选择适合你的方案开始部署吧！🚀
