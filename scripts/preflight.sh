#!/bin/bash
# 发布前自检脚本
# 检查环境变量、数据库、Nginx 配置等

set -e

# 配置
REQUIRED_ENV_VARS=(
  "DATABASE_URL"
  "JWT_SECRET"
  "REFRESH_TOKEN_SECRET"
  "CORS_ORIGIN"
  "AI_PROVIDER"
  "OPENAI_API_KEY"
  "SENTRY_DSN"
)

NGINX_CONF=${NGINX_CONF:-"/etc/nginx/nginx.conf"}
CERT_DIR=${CERT_DIR:-"/etc/letsencrypt/live"}
DOMAIN=${DOMAIN:-"yourdomain.com"}

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

# 检查计数器
CHECKS_PASSED=0
CHECKS_FAILED=0
CHECKS_WARNING=0

# 检查函数
check_pass() {
    CHECKS_PASSED=$((CHECKS_PASSED + 1))
    log_success "$1"
}

check_fail() {
    CHECKS_FAILED=$((CHECKS_FAILED + 1))
    log_error "$1"
}

check_warning() {
    CHECKS_WARNING=$((CHECKS_WARNING + 1))
    log_warning "$1"
}

# 检查环境变量完整性
check_env_vars() {
    log "🔍 检查环境变量完整性..."
    
    local missing_vars=()
    
    for var in "${REQUIRED_ENV_VARS[@]}"; do
        if [ -z "${!var}" ]; then
            missing_vars+=("$var")
        fi
    done
    
    if [ ${#missing_vars[@]} -eq 0 ]; then
        check_pass "所有必需的环境变量已设置"
    else
        check_fail "缺少必需的环境变量: ${missing_vars[*]}"
    fi
    
    # 检查环境变量值的安全性
    if [ -n "$JWT_SECRET" ] && [ ${#JWT_SECRET} -lt 32 ]; then
        check_warning "JWT_SECRET 长度过短，建议至少 32 字符"
    fi
    
    if [ -n "$REFRESH_TOKEN_SECRET" ] && [ ${#REFRESH_TOKEN_SECRET} -lt 32 ]; then
        check_warning "REFRESH_TOKEN_SECRET 长度过短，建议至少 32 字符"
    fi
    
    if [ -n "$CORS_ORIGIN" ] && [[ "$CORS_ORIGIN" == *"*"* ]]; then
        check_warning "CORS_ORIGIN 包含通配符，可能存在安全风险"
    fi
}

# 检查数据库连通性
check_database() {
    log "🗄️  检查数据库连通性..."
    
    if [ -z "$DATABASE_URL" ]; then
        check_fail "DATABASE_URL 未设置"
        return
    fi
    
    # 解析数据库连接信息
    if [[ $DATABASE_URL =~ postgresql://([^:]+):([^@]+)@([^:]+):([^/]+)/(.+) ]]; then
        local db_user="${BASH_REMATCH[1]}"
        local db_pass="${BASH_REMATCH[2]}"
        local db_host="${BASH_REMATCH[3]}"
        local db_port="${BASH_REMATCH[4]}"
        local db_name="${BASH_REMATCH[5]}"
        
        # 测试数据库连接
        if PGPASSWORD="$db_pass" psql -h "$db_host" -p "$db_port" -U "$db_user" -d "$db_name" -c "SELECT 1;" > /dev/null 2>&1; then
            check_pass "数据库连接成功"
            
            # 检查是否有待执行的迁移
            if command -v prisma &> /dev/null; then
                cd server
                if pnpm prisma migrate status | grep -q "Following migration have not yet been applied"; then
                    check_warning "存在待执行的数据库迁移"
                else
                    check_pass "数据库迁移状态正常"
                fi
                cd ..
            fi
        else
            check_fail "数据库连接失败"
        fi
    else
        check_fail "无法解析 DATABASE_URL 格式"
    fi
}

# 检查 Nginx 配置
check_nginx() {
    log "🌐 检查 Nginx 配置..."
    
    if [ ! -f "$NGINX_CONF" ]; then
        check_fail "Nginx 配置文件不存在: $NGINX_CONF"
        return
    fi
    
    # 检查 Nginx 配置语法
    if nginx -t -c "$NGINX_CONF" > /dev/null 2>&1; then
        check_pass "Nginx 配置语法正确"
    else
        check_fail "Nginx 配置语法错误"
        return
    fi
    
    # 检查 SSL 证书
    if [ -d "$CERT_DIR/$DOMAIN" ]; then
        local cert_file="$CERT_DIR/$DOMAIN/fullchain.pem"
        if [ -f "$cert_file" ]; then
            local cert_expiry=$(openssl x509 -enddate -noout -in "$cert_file" | cut -d= -f2)
            local cert_timestamp=$(date -d "$cert_expiry" +%s)
            local current_timestamp=$(date +%s)
            local days_until_expiry=$(( (cert_timestamp - current_timestamp) / 86400 ))
            
            if [ $days_until_expiry -gt 30 ]; then
                check_pass "SSL 证书有效期正常 (${days_until_expiry} 天)"
            elif [ $days_until_expiry -gt 7 ]; then
                check_warning "SSL 证书将在 ${days_until_expiry} 天后过期"
            else
                check_fail "SSL 证书即将过期 (${days_until_expiry} 天)"
            fi
        else
            check_fail "SSL 证书文件不存在: $cert_file"
        fi
    else
        check_warning "SSL 证书目录不存在: $CERT_DIR/$DOMAIN"
    fi
}

# 检查 CORS 配置一致性
check_cors_consistency() {
    log "🔗 检查 CORS 配置一致性..."
    
    if [ -z "$CORS_ORIGIN" ]; then
        check_fail "CORS_ORIGIN 未设置"
        return
    fi
    
    # 检查前端域名是否在 CORS_ORIGIN 中
    local frontend_domain="https://$DOMAIN"
    if [[ "$CORS_ORIGIN" == *"$frontend_domain"* ]]; then
        check_pass "CORS 配置包含前端域名"
    else
        check_warning "CORS 配置可能不包含前端域名: $frontend_domain"
    fi
    
    # 检查是否包含开发环境域名
    if [[ "$CORS_ORIGIN" == *"localhost"* ]] && [ "$NODE_ENV" = "production" ]; then
        check_warning "生产环境中 CORS 包含 localhost，可能存在安全风险"
    fi
}

# 检查 AI 提供商配置
check_ai_provider() {
    log "🤖 检查 AI 提供商配置..."
    
    if [ -z "$AI_PROVIDER" ]; then
        check_fail "AI_PROVIDER 未设置"
        return
    fi
    
    case "$AI_PROVIDER" in
        "openai")
            if [ -z "$OPENAI_API_KEY" ]; then
                check_fail "AI_PROVIDER 为 openai 但 OPENAI_API_KEY 未设置"
            else
                check_pass "OpenAI 配置完整"
            fi
            ;;
        "mock")
            check_pass "使用 Mock AI 提供商"
            ;;
        *)
            check_warning "未知的 AI 提供商: $AI_PROVIDER"
            ;;
    esac
}

# 检查监控配置
check_monitoring() {
    log "📊 检查监控配置..."
    
    if [ -z "$SENTRY_DSN" ]; then
        check_warning "SENTRY_DSN 未设置，错误监控可能不可用"
    else
        check_pass "Sentry 配置已设置"
    fi
    
    # 检查日志级别
    if [ -z "$LOG_LEVEL" ]; then
        check_warning "LOG_LEVEL 未设置，使用默认级别"
    else
        case "$LOG_LEVEL" in
            "error"|"warn"|"info"|"debug")
                check_pass "日志级别设置正确: $LOG_LEVEL"
                ;;
            *)
                check_warning "未知的日志级别: $LOG_LEVEL"
                ;;
        esac
    fi
}

# 检查系统资源
check_system_resources() {
    log "💻 检查系统资源..."
    
    # 检查磁盘空间
    local disk_usage=$(df / | awk 'NR==2 {print $5}' | sed 's/%//')
    if [ $disk_usage -lt 80 ]; then
        check_pass "磁盘空间充足 (${disk_usage}% 使用)"
    elif [ $disk_usage -lt 90 ]; then
        check_warning "磁盘空间不足 (${disk_usage}% 使用)"
    else
        check_fail "磁盘空间严重不足 (${disk_usage}% 使用)"
    fi
    
    # 检查内存使用
    local memory_usage=$(free | awk 'NR==2{printf "%.0f", $3*100/$2}')
    if [ $memory_usage -lt 80 ]; then
        check_pass "内存使用正常 (${memory_usage}% 使用)"
    elif [ $memory_usage -lt 90 ]; then
        check_warning "内存使用较高 (${memory_usage}% 使用)"
    else
        check_fail "内存使用过高 (${memory_usage}% 使用)"
    fi
}

# 检查网络连通性
check_network() {
    log "🌐 检查网络连通性..."
    
    # 检查外部 API 连通性
    if [ "$AI_PROVIDER" = "openai" ]; then
        if curl -s --max-time 10 https://api.openai.com/v1/models > /dev/null 2>&1; then
            check_pass "OpenAI API 连通性正常"
        else
            check_warning "OpenAI API 连通性异常"
        fi
    fi
    
    # 检查 Sentry 连通性
    if [ -n "$SENTRY_DSN" ]; then
        if curl -s --max-time 10 https://sentry.io > /dev/null 2>&1; then
            check_pass "Sentry 连通性正常"
        else
            check_warning "Sentry 连通性异常"
        fi
    fi
}

# 主函数
main() {
    log "🚀 开始发布前自检..."
    
    # 加载环境变量
    if [ -f ".env" ]; then
        export $(grep -v '^#' .env | xargs)
    fi
    
    if [ -f "server/.env" ]; then
        export $(grep -v '^#' server/.env | xargs)
    fi
    
    # 执行检查
    check_env_vars
    check_database
    check_nginx
    check_cors_consistency
    check_ai_provider
    check_monitoring
    check_system_resources
    check_network
    
    # 输出检查结果
    echo ""
    echo "=========================================="
    echo "📊 自检结果摘要"
    echo "=========================================="
    echo "✅ 通过: $CHECKS_PASSED"
    echo "⚠️  警告: $CHECKS_WARNING"
    echo "❌ 失败: $CHECKS_FAILED"
    echo "=========================================="
    
    if [ $CHECKS_FAILED -eq 0 ]; then
        log_success "🎉 所有检查通过，可以继续发布！"
        exit 0
    else
        log_error "❌ 存在 $CHECKS_FAILED 个失败项，请修复后重试"
        exit 1
    fi
}

# 显示帮助信息
show_help() {
    echo "用法: $0 [选项]"
    echo ""
    echo "选项:"
    echo "  -c, --config FILE      Nginx 配置文件路径"
    echo "  -d, --domain DOMAIN    域名"
    echo "  -h, --help             显示帮助信息"
    echo ""
    echo "环境变量:"
    echo "  DATABASE_URL           数据库连接 URL"
    echo "  JWT_SECRET             JWT 密钥"
    echo "  REFRESH_TOKEN_SECRET   刷新令牌密钥"
    echo "  CORS_ORIGIN           CORS 允许的源"
    echo "  AI_PROVIDER           AI 提供商"
    echo "  OPENAI_API_KEY        OpenAI API 密钥"
    echo "  SENTRY_DSN            Sentry DSN"
    echo ""
    echo "示例:"
    echo "  $0 --domain yourdomain.com"
    echo "  $0 --config /etc/nginx/nginx.conf"
}

# 解析命令行参数
while [[ $# -gt 0 ]]; do
    case $1 in
        -c|--config)
            NGINX_CONF="$2"
            shift 2
            ;;
        -d|--domain)
            DOMAIN="$2"
            shift 2
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
