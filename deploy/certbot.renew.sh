#!/bin/bash
# Certbot 自动续期脚本
# 用于自动续期 SSL 证书

set -e

# 配置
DOMAIN="${DOMAIN:-yourdomain.com}"
LOG_FILE="/var/log/certbot-renew.log"
NOTIFICATION_EMAIL="${NOTIFICATION_EMAIL:-admin@yourdomain.com}"

# 日志函数
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

log "🔄 开始 SSL 证书续期检查..."

# 检查证书是否需要续期
if certbot certificates | grep -q "VALID: 30 days"; then
    log "⚠️  证书将在30天内过期，开始续期..."
    
    # 尝试续期
    if certbot renew --quiet; then
        log "✅ 证书续期成功"
        
        # 重新加载 Nginx 配置
        if nginx -t; then
            nginx -s reload
            log "✅ Nginx 配置重新加载成功"
        else
            log "❌ Nginx 配置测试失败"
            exit 1
        fi
        
        # 验证新证书
        if [ -f "/etc/letsencrypt/live/$DOMAIN/fullchain.pem" ]; then
            EXPIRY=$(openssl x509 -enddate -noout -in /etc/letsencrypt/live/$DOMAIN/fullchain.pem | cut -d= -f2)
            log "📅 新证书有效期至: $EXPIRY"
            
            # 测试 HTTPS 连接
            if curl -f https://$DOMAIN > /dev/null 2>&1; then
                log "✅ HTTPS 连接正常"
            else
                log "❌ HTTPS 连接失败"
                exit 1
            fi
        fi
        
        # 发送成功通知
        if command -v mail > /dev/null 2>&1; then
            echo "SSL 证书续期成功

域名: $DOMAIN
续期时间: $(date)
新有效期: $EXPIRY

系统: Aura Flow" | mail -s "SSL 证书续期成功" "$NOTIFICATION_EMAIL"
        fi
        
    else
        log "❌ 证书续期失败"
        
        # 发送失败通知
        if command -v mail > /dev/null 2>&1; then
            echo "SSL 证书续期失败

域名: $DOMAIN
失败时间: $(date)
错误日志: $(tail -n 10 $LOG_FILE)

请立即检查证书状态！

系统: Aura Flow" | mail -s "SSL 证书续期失败" "$NOTIFICATION_EMAIL"
        fi
        
        exit 1
    fi
    
else
    log "✅ 证书仍在有效期内，无需续期"
fi

log "🎉 SSL 证书续期检查完成"

# 清理旧日志（保留最近30天）
find /var/log -name "certbot-renew.log*" -mtime +30 -delete 2>/dev/null || true
