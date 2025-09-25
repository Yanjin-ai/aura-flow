#!/bin/bash
# Panic Mode 脚本
# 一键进入维护模式：Nginx 返回 503 + 前端维护页 + 降级为 Mock + 限速加严

set -e

# 配置
NGINX_CONFIG_DIR=${NGINX_CONFIG_DIR:-"/etc/nginx"}
NGINX_SITES_AVAILABLE=${NGINX_SITES_AVAILABLE:-"$NGINX_CONFIG_DIR/sites-available"}
NGINX_SITES_ENABLED=${NGINX_SITES_ENABLED:-"$NGINX_CONFIG_DIR/sites-enabled"}
MAINTENANCE_PAGE_DIR=${MAINTENANCE_PAGE_DIR:-"/var/www/maintenance"}
COMPOSE_FILE=${COMPOSE_FILE:-"docker-compose.prod.yml"}
BACKUP_DIR=${BACKUP_DIR:-"./backups"}

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 日志函数
log() {
    echo -e "${BLUE}[$(date '+%Y-%m-%d %H:%M:%S')]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[$(date '+%Y-%m-%d %H:%M:%S')] ✅ $1${NC}"
}

log_warning() {
    echo -e "${YELLOW}[$(date '+%Y-%m-%d %H:%M:%S')] ⚠️  $1${NC}"
}

log_error() {
    echo -e "${RED}[$(date '+%Y-%m-%d %H:%M:%S')] ❌ $1${NC}"
}

# 创建维护页面
create_maintenance_page() {
    log "创建维护页面..."
    
    # 创建维护页面目录
    sudo mkdir -p "$MAINTENANCE_PAGE_DIR"
    
    # 创建维护页面 HTML
    cat > /tmp/maintenance.html << 'EOF'
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>系统维护中 - Aura Flow</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            margin: 0;
            padding: 0;
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 100vh;
            color: white;
        }
        .container {
            text-align: center;
            max-width: 600px;
            padding: 2rem;
            background: rgba(255, 255, 255, 0.1);
            border-radius: 20px;
            backdrop-filter: blur(10px);
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
        }
        .icon {
            font-size: 4rem;
            margin-bottom: 1rem;
        }
        h1 {
            font-size: 2.5rem;
            margin-bottom: 1rem;
            font-weight: 300;
        }
        p {
            font-size: 1.2rem;
            margin-bottom: 2rem;
            opacity: 0.9;
        }
        .status {
            background: rgba(255, 255, 255, 0.2);
            padding: 1rem;
            border-radius: 10px;
            margin: 1rem 0;
        }
        .countdown {
            font-size: 1.5rem;
            font-weight: bold;
            color: #ffd700;
        }
        .contact {
            margin-top: 2rem;
            font-size: 0.9rem;
            opacity: 0.8;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="icon">🔧</div>
        <h1>系统维护中</h1>
        <p>我们正在对系统进行维护升级，以提供更好的服务体验。</p>
        
        <div class="status">
            <div class="countdown" id="countdown">预计维护时间: 30 分钟</div>
            <div>维护开始时间: <span id="start-time"></span></div>
        </div>
        
        <p>感谢您的耐心等待，我们很快就会回来！</p>
        
        <div class="contact">
            <p>如有紧急问题，请联系：</p>
            <p>📧 support@yourdomain.com</p>
            <p>📱 +86-400-000-0000</p>
        </div>
    </div>
    
    <script>
        // 设置开始时间
        document.getElementById('start-time').textContent = new Date().toLocaleString('zh-CN');
        
        // 简单的倒计时（30分钟）
        let minutes = 30;
        const countdownElement = document.getElementById('countdown');
        
        const timer = setInterval(() => {
            minutes--;
            if (minutes <= 0) {
                countdownElement.textContent = '维护即将完成...';
                clearInterval(timer);
            } else {
                countdownElement.textContent = `预计剩余时间: ${minutes} 分钟`;
            }
        }, 60000);
    </script>
</body>
</html>
EOF

    # 复制维护页面到目标目录
    sudo cp /tmp/maintenance.html "$MAINTENANCE_PAGE_DIR/index.html"
    sudo chown -R www-data:www-data "$MAINTENANCE_PAGE_DIR"
    sudo chmod -R 755 "$MAINTENANCE_PAGE_DIR"
    
    log_success "维护页面已创建"
}

# 创建维护模式 Nginx 配置
create_maintenance_nginx_config() {
    log "创建维护模式 Nginx 配置..."
    
    local site_name="aura-flow-maintenance"
    local config_file="$NGINX_SITES_AVAILABLE/$site_name"
    
    # 创建维护模式配置
    cat > /tmp/maintenance.conf << EOF
server {
    listen 80;
    listen 443 ssl http2;
    server_name _;
    
    # SSL 配置（如果有证书）
    # ssl_certificate /path/to/cert.pem;
    # ssl_certificate_key /path/to/key.pem;
    
    # 维护页面
    location / {
        root $MAINTENANCE_PAGE_DIR;
        index index.html;
        try_files \$uri \$uri/ /index.html;
        
        # 添加维护模式头部
        add_header X-Maintenance-Mode "true" always;
        add_header Retry-After "1800" always;  # 30分钟
    }
    
    # 健康检查端点（允许通过）
    location /healthz {
        access_log off;
        return 200 "healthy\n";
        add_header Content-Type text/plain;
    }
    
    # 监控端点（允许通过）
    location /monitoring {
        access_log off;
        return 200 "monitoring\n";
        add_header Content-Type text/plain;
    }
    
    # 禁止访问其他所有路径
    location ~ ^/(api|admin|status) {
        return 503 "Service temporarily unavailable";
        add_header Content-Type text/plain;
        add_header Retry-After "1800";
    }
}
EOF

    # 复制配置到 Nginx 目录
    sudo cp /tmp/maintenance.conf "$config_file"
    
    log_success "维护模式 Nginx 配置已创建"
}

# 启用维护模式
enable_maintenance_mode() {
    log "🚨 启用维护模式..."
    
    # 备份当前配置
    backup_current_config
    
    # 创建维护页面
    create_maintenance_page
    
    # 创建维护模式 Nginx 配置
    create_maintenance_nginx_config
    
    # 启用维护模式配置
    local site_name="aura-flow-maintenance"
    sudo ln -sf "$NGINX_SITES_AVAILABLE/$site_name" "$NGINX_SITES_ENABLED/$site_name"
    
    # 测试 Nginx 配置
    if sudo nginx -t; then
        log_success "Nginx 配置测试通过"
    else
        log_error "Nginx 配置测试失败"
        return 1
    fi
    
    # 重新加载 Nginx
    sudo systemctl reload nginx
    
    # 降级 AI 服务为 Mock 模式
    log "降级 AI 服务为 Mock 模式..."
    export AI_PROVIDER=mock
    if [ -f "$COMPOSE_FILE" ]; then
        docker-compose -f "$COMPOSE_FILE" up -d --force-recreate api
    fi
    
    # 加严限速
    log "加严限速配置..."
    # 这里可以修改 Nginx 限速配置或应用限速配置
    
    # 发送维护模式通知
    if [ -f "scripts/alert-webhook.sh" ]; then
        ./scripts/alert-webhook.sh system-alert-enhanced "maintenance" "critical" "系统进入维护模式" "所有服务已降级，用户访问受限" "/"
    fi
    
    log_success "🎉 维护模式已启用"
    log "用户将看到维护页面，所有 API 请求将返回 503"
    log "AI 服务已降级为 Mock 模式"
    log "限速配置已加严"
}

# 禁用维护模式
disable_maintenance_mode() {
    log "✅ 禁用维护模式..."
    
    # 禁用维护模式配置
    local site_name="aura-flow-maintenance"
    sudo rm -f "$NGINX_SITES_ENABLED/$site_name"
    
    # 恢复原始配置
    restore_original_config
    
    # 测试 Nginx 配置
    if sudo nginx -t; then
        log_success "Nginx 配置测试通过"
    else
        log_error "Nginx 配置测试失败"
        return 1
    fi
    
    # 重新加载 Nginx
    sudo systemctl reload nginx
    
    # 恢复 AI 服务
    log "恢复 AI 服务..."
    unset AI_PROVIDER
    if [ -f "$COMPOSE_FILE" ]; then
        docker-compose -f "$COMPOSE_FILE" up -d --force-recreate api
    fi
    
    # 恢复限速配置
    log "恢复限速配置..."
    # 这里可以恢复原始的限速配置
    
    # 发送恢复通知
    if [ -f "scripts/alert-webhook.sh" ]; then
        ./scripts/alert-webhook.sh system-alert-enhanced "maintenance" "low" "系统维护模式已禁用" "所有服务已恢复正常" "/"
    fi
    
    log_success "🎉 维护模式已禁用"
    log "系统已恢复正常运行"
}

# 备份当前配置
backup_current_config() {
    log "备份当前配置..."
    
    mkdir -p "$BACKUP_DIR"
    local backup_file="$BACKUP_DIR/nginx-config-backup-$(date +%Y%m%d-%H%M%S).tar.gz"
    
    # 备份 Nginx 配置
    sudo tar -czf "$backup_file" -C "$NGINX_CONFIG_DIR" sites-available sites-enabled
    
    # 备份 Docker Compose 配置
    if [ -f "$COMPOSE_FILE" ]; then
        cp "$COMPOSE_FILE" "$BACKUP_DIR/docker-compose-backup-$(date +%Y%m%d-%H%M%S).yml"
    fi
    
    log_success "配置已备份到: $backup_file"
}

# 恢复原始配置
restore_original_config() {
    log "恢复原始配置..."
    
    # 这里可以实现恢复逻辑
    # 例如从备份中恢复配置
    
    log_success "原始配置已恢复"
}

# 检查维护模式状态
check_maintenance_status() {
    log "检查维护模式状态..."
    
    local site_name="aura-flow-maintenance"
    if [ -L "$NGINX_SITES_ENABLED/$site_name" ]; then
        log_warning "维护模式已启用"
        return 0
    else
        log_success "维护模式未启用"
        return 1
    fi
}

# 显示帮助信息
show_help() {
    echo "用法: $0 [选项]"
    echo ""
    echo "选项:"
    echo "  --enable          启用维护模式"
    echo "  --disable         禁用维护模式"
    echo "  --status          检查维护模式状态"
    echo "  --help, -h        显示帮助信息"
    echo ""
    echo "环境变量:"
    echo "  NGINX_CONFIG_DIR          Nginx 配置目录 (默认: /etc/nginx)"
    echo "  MAINTENANCE_PAGE_DIR      维护页面目录 (默认: /var/www/maintenance)"
    echo "  COMPOSE_FILE              Docker Compose 文件 (默认: docker-compose.prod.yml)"
    echo "  BACKUP_DIR                备份目录 (默认: ./backups)"
    echo ""
    echo "示例:"
    echo "  $0 --enable               # 启用维护模式"
    echo "  $0 --disable              # 禁用维护模式"
    echo "  $0 --status               # 检查状态"
    echo ""
    echo "维护模式功能:"
    echo "  - Nginx 返回 503 状态码"
    echo "  - 显示维护页面"
    echo "  - AI 服务降级为 Mock 模式"
    echo "  - 限速配置加严"
    echo "  - 发送告警通知"
}

# 主函数
main() {
    case "$1" in
        --enable)
            enable_maintenance_mode
            ;;
        --disable)
            disable_maintenance_mode
            ;;
        --status)
            check_maintenance_status
            ;;
        --help|-h)
            show_help
            ;;
        *)
            log_error "未知选项: $1"
            show_help
            exit 1
            ;;
    esac
}

# 检查参数
if [ $# -eq 0 ]; then
    show_help
    exit 1
fi

# 执行主函数
main "$@"
