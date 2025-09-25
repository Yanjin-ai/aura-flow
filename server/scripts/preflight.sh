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
}

# 检查数据库连通性
check_database() {
    log "🗄️  检查数据库连通性..."
    
    if [ -z "$DATABASE_URL" ]; then
        check_fail "DATABASE_URL 未设置"
        return
    fi
    
    # 测试数据库连接
    if command -v psql &> /dev/null; then
        if PGPASSWORD="$DB_PASSWORD" psql "$DATABASE_URL" -c "SELECT 1;" > /dev/null 2>&1; then
            check_pass "数据库连接成功"
        else
            check_fail "数据库连接失败"
        fi
    else
        check_warning "psql 未安装，跳过数据库连接测试"
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

# 执行主函数
main
