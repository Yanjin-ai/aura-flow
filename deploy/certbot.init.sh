#!/bin/bash
# Certbot 初始化脚本
# 用于首次获取 SSL 证书

set -e

# 配置
DOMAIN="${DOMAIN:-yourdomain.com}"
EMAIL="${EMAIL:-admin@yourdomain.com}"
STAGING="${STAGING:-false}"

echo "🔐 初始化 SSL 证书获取..."
echo "域名: $DOMAIN"
echo "邮箱: $EMAIL"
echo "测试模式: $STAGING"

# 检查域名是否可访问
echo "📡 检查域名解析..."
if ! nslookup $DOMAIN > /dev/null 2>&1; then
    echo "❌ 域名 $DOMAIN 无法解析，请检查 DNS 配置"
    exit 1
fi

# 检查 HTTP 服务是否运行
echo "🌐 检查 HTTP 服务..."
if ! curl -f http://$DOMAIN/.well-known/acme-challenge/ > /dev/null 2>&1; then
    echo "❌ HTTP 服务不可访问，请确保 Nginx 正在运行"
    exit 1
fi

# 构建 certbot 命令
CERTBOT_CMD="certbot certonly --webroot -w /var/www/certbot"

if [ "$STAGING" = "true" ]; then
    CERTBOT_CMD="$CERTBOT_CMD --staging"
    echo "🧪 使用 Let's Encrypt 测试环境"
else
    echo "🚀 使用 Let's Encrypt 生产环境"
fi

# 添加域名
CERTBOT_CMD="$CERTBOT_CMD -d $DOMAIN"
CERTBOT_CMD="$CERTBOT_CMD -d www.$DOMAIN"
CERTBOT_CMD="$CERTBOT_CMD -d api.$DOMAIN"

# 添加邮箱
CERTBOT_CMD="$CERTBOT_CMD --email $EMAIL"
CERTBOT_CMD="$CERTBOT_CMD --agree-tos --non-interactive"

# 执行证书获取
echo "🔑 获取 SSL 证书..."
if $CERTBOT_CMD; then
    echo "✅ SSL 证书获取成功！"
    
    # 验证证书
    echo "🔍 验证证书..."
    if [ -f "/etc/letsencrypt/live/$DOMAIN/fullchain.pem" ]; then
        echo "✅ 证书文件存在"
        
        # 检查证书有效期
        EXPIRY=$(openssl x509 -enddate -noout -in /etc/letsencrypt/live/$DOMAIN/fullchain.pem | cut -d= -f2)
        echo "📅 证书有效期至: $EXPIRY"
        
        # 测试 HTTPS 连接
        echo "🔒 测试 HTTPS 连接..."
        if curl -f https://$DOMAIN > /dev/null 2>&1; then
            echo "✅ HTTPS 连接正常"
        else
            echo "⚠️  HTTPS 连接失败，请检查 Nginx 配置"
        fi
        
    else
        echo "❌ 证书文件不存在"
        exit 1
    fi
    
else
    echo "❌ SSL 证书获取失败"
    exit 1
fi

echo "🎉 SSL 证书初始化完成！"
echo ""
echo "📋 后续步骤："
echo "1. 更新 Nginx 配置中的域名"
echo "2. 重启 Nginx 服务"
echo "3. 设置自动续期 cron 任务"
echo "4. 测试 HTTPS 访问"
