#!/bin/bash
# Nginx 蓝绿部署切换脚本
# 原子替换 upstream 配置并重新加载

set -e

# 配置
NGINX_CONF=${NGINX_CONF:-"/etc/nginx/nginx.conf"}
NGINX_BACKUP=${NGINX_BACKUP:-"/etc/nginx/nginx.conf.backup"}
UPSTREAM_V1="api_v1"
UPSTREAM_V2="api_v2"
CURRENT_UPSTREAM=""
TARGET_UPSTREAM=""

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

# 检查 Nginx 配置语法
check_nginx_config() {
    local config_file=$1
    log "🔍 检查 Nginx 配置语法: $config_file"
    
    if nginx -t -c "$config_file"; then
        log_success "Nginx 配置语法正确"
        return 0
    else
        log_error "Nginx 配置语法错误"
        return 1
    fi
}

# 获取当前 upstream
get_current_upstream() {
    log "🔍 获取当前 upstream 配置..."
    
    if [ -f "$NGINX_CONF" ]; then
        # 查找当前使用的 upstream
        CURRENT_UPSTREAM=$(grep -o "proxy_pass http://[^;]*" "$NGINX_CONF" | grep -o "api_v[12]" | head -1)
        if [ -n "$CURRENT_UPSTREAM" ]; then
            log "当前 upstream: $CURRENT_UPSTREAM"
        else
            log_warning "无法确定当前 upstream"
        fi
    else
        log_error "Nginx 配置文件不存在: $NGINX_CONF"
        exit 1
    fi
}

# 确定目标 upstream
determine_target_upstream() {
    if [ -n "$CURRENT_UPSTREAM" ]; then
        if [ "$CURRENT_UPSTREAM" = "$UPSTREAM_V1" ]; then
            TARGET_UPSTREAM="$UPSTREAM_V2"
        else
            TARGET_UPSTREAM="$UPSTREAM_V1"
        fi
    else
        # 默认切换到 v1
        TARGET_UPSTREAM="$UPSTREAM_V1"
    fi
    
    log "目标 upstream: $TARGET_UPSTREAM"
}

# 备份当前配置
backup_current_config() {
    log "💾 备份当前 Nginx 配置..."
    
    if [ -f "$NGINX_CONF" ]; then
        cp "$NGINX_CONF" "$NGINX_BACKUP"
        log_success "配置已备份到: $NGINX_BACKUP"
    else
        log_error "Nginx 配置文件不存在"
        exit 1
    fi
}

# 更新 upstream 配置
update_upstream_config() {
    log "🔧 更新 upstream 配置..."
    
    # 创建临时配置文件
    local temp_conf="/tmp/nginx_switch_$$.conf"
    
    # 替换 upstream 引用
    sed "s|proxy_pass http://api_v[12]|proxy_pass http://$TARGET_UPSTREAM|g" "$NGINX_CONF" > "$temp_conf"
    
    # 检查新配置语法
    if check_nginx_config "$temp_conf"; then
        # 原子替换配置文件
        mv "$temp_conf" "$NGINX_CONF"
        log_success "Upstream 配置已更新"
    else
        log_error "新配置语法错误，回滚到原配置"
        rm -f "$temp_conf"
        exit 1
    fi
}

# 重新加载 Nginx
reload_nginx() {
    log "🔄 重新加载 Nginx..."
    
    # 测试配置
    if nginx -t; then
        # 重新加载配置
        if nginx -s reload; then
            log_success "Nginx 重新加载成功"
        else
            log_error "Nginx 重新加载失败"
            return 1
        fi
    else
        log_error "Nginx 配置测试失败"
        return 1
    fi
}

# 验证切换结果
verify_switch() {
    log "🔍 验证切换结果..."
    
    # 等待 Nginx 重新加载
    sleep 2
    
    # 检查 Nginx 进程
    if pgrep nginx > /dev/null; then
        log_success "Nginx 进程运行正常"
    else
        log_error "Nginx 进程未运行"
        return 1
    fi
    
    # 检查当前配置
    local current_proxy=$(grep -o "proxy_pass http://[^;]*" "$NGINX_CONF" | grep -o "api_v[12]" | head -1)
    if [ "$current_proxy" = "$TARGET_UPSTREAM" ]; then
        log_success "Upstream 切换成功: $TARGET_UPSTREAM"
    else
        log_error "Upstream 切换失败，当前: $current_proxy，期望: $TARGET_UPSTREAM"
        return 1
    fi
    
    # 健康检查
    log "执行健康检查..."
    if curl -f http://localhost/health > /dev/null 2>&1; then
        log_success "健康检查通过"
    else
        log_warning "健康检查失败，请手动验证服务状态"
    fi
}

# 回滚配置
rollback_config() {
    log "🔄 回滚到原配置..."
    
    if [ -f "$NGINX_BACKUP" ]; then
        cp "$NGINX_BACKUP" "$NGINX_CONF"
        if nginx -t && nginx -s reload; then
            log_success "配置回滚成功"
        else
            log_error "配置回滚失败"
        fi
    else
        log_error "备份配置文件不存在"
    fi
}

# 显示当前状态
show_status() {
    log "📊 当前状态:"
    
    if [ -f "$NGINX_CONF" ]; then
        echo "Nginx 配置: $NGINX_CONF"
        echo "当前 upstream: $(grep -o "proxy_pass http://[^;]*" "$NGINX_CONF" | grep -o "api_v[12]" | head -1)"
        echo "Nginx 进程: $(pgrep nginx | wc -l) 个"
        echo "Nginx 状态: $(systemctl is-active nginx 2>/dev/null || echo 'unknown')"
    fi
}

# 主函数
main() {
    log "🚀 开始 Nginx 蓝绿部署切换..."
    
    # 检查权限
    if [ "$EUID" -ne 0 ]; then
        log_error "需要 root 权限来操作 Nginx"
        exit 1
    fi
    
    # 检查 Nginx 是否安装
    if ! command -v nginx &> /dev/null; then
        log_error "Nginx 未安装"
        exit 1
    fi
    
    # 执行切换步骤
    get_current_upstream
    determine_target_upstream
    backup_current_config
    update_upstream_config
    
    # 重新加载 Nginx
    if reload_nginx; then
        verify_switch
        log_success "🎉 蓝绿部署切换完成！"
        log "从 $CURRENT_UPSTREAM 切换到 $TARGET_UPSTREAM"
    else
        log_error "切换失败，执行回滚..."
        rollback_config
        exit 1
    fi
}

# 显示帮助信息
show_help() {
    echo "用法: $0 [选项]"
    echo ""
    echo "选项:"
    echo "  -c, --config FILE      Nginx 配置文件路径 (默认: /etc/nginx/nginx.conf)"
    echo "  -t, --target UPSTREAM  目标 upstream (api_v1 或 api_v2)"
    echo "  -s, --status           显示当前状态"
    echo "  -r, --rollback         回滚到备份配置"
    echo "  -h, --help             显示帮助信息"
    echo ""
    echo "示例:"
    echo "  $0 --target api_v2"
    echo "  $0 --status"
    echo "  $0 --rollback"
}

# 解析命令行参数
while [[ $# -gt 0 ]]; do
    case $1 in
        -c|--config)
            NGINX_CONF="$2"
            shift 2
            ;;
        -t|--target)
            TARGET_UPSTREAM="$2"
            shift 2
            ;;
        -s|--status)
            show_status
            exit 0
            ;;
        -r|--rollback)
            rollback_config
            exit 0
            ;;
        -h|--help)
            show_help
            exit 0
            ;;
        *)
            log_error "未知参数: $1"
            show_help
            exit 1
            ;;
    esac
done

# 执行主函数
main
