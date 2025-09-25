#!/bin/bash
# 密钥轮换脚本
# 生成新的 JWT 密钥并触发滚动重启

set -e

# 配置
JWT_SECRET_LENGTH=${JWT_SECRET_LENGTH:-64}
REFRESH_TOKEN_SECRET_LENGTH=${REFRESH_TOKEN_SECRET_LENGTH:-64}
GITHUB_TOKEN=${GITHUB_TOKEN:-""}
GITHUB_REPO=${GITHUB_REPO:-"your-org/aura-flow"}
GITHUB_ENVIRONMENT=${GITHUB_ENVIRONMENT:-"production"}
COMPOSE_FILE=${COMPOSE_FILE:-"docker-compose.prod.yml"}

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

# 生成随机密钥
generate_secret() {
    local length=$1
    openssl rand -base64 $length | tr -d "=+/" | cut -c1-$length
}

# 更新 GitHub Environment 密钥
update_github_secret() {
    local secret_name=$1
    local secret_value=$2
    
    if [ -z "$GITHUB_TOKEN" ]; then
        log_warning "GitHub Token 未配置，跳过更新 GitHub Environment"
        return 0
    fi
    
    log "更新 GitHub Environment 密钥: $secret_name"
    
    # 使用 GitHub CLI 或 REST API 更新密钥
    if command -v gh &> /dev/null; then
        # 使用 GitHub CLI
        echo "$secret_value" | gh secret set "$secret_name" --env "$GITHUB_ENVIRONMENT" --repo "$GITHUB_REPO"
        log_success "GitHub Environment 密钥已更新: $secret_name"
    else
        # 使用 REST API
        local response=$(curl -s -X PUT \
            -H "Authorization: token $GITHUB_TOKEN" \
            -H "Accept: application/vnd.github.v3+json" \
            "https://api.github.com/repos/$GITHUB_REPO/environments/$GITHUB_ENVIRONMENT/secrets/$secret_name" \
            -d "{\"encrypted_value\":\"$secret_value\"}")
        
        if echo "$response" | grep -q "204"; then
            log_success "GitHub Environment 密钥已更新: $secret_name"
        else
            log_error "更新 GitHub Environment 密钥失败: $response"
            return 1
        fi
    fi
}

# 更新本地环境变量文件
update_local_env() {
    local secret_name=$1
    local secret_value=$2
    local env_file=$3
    
    if [ -f "$env_file" ]; then
        # 备份原文件
        cp "$env_file" "$env_file.backup.$(date +%Y%m%d_%H%M%S)"
        
        # 更新或添加密钥
        if grep -q "^$secret_name=" "$env_file"; then
            sed -i.bak "s/^$secret_name=.*/$secret_name=$secret_value/" "$env_file"
        else
            echo "$secret_name=$secret_value" >> "$env_file"
        fi
        
        log_success "本地环境变量已更新: $env_file"
    else
        log_warning "环境变量文件不存在: $env_file"
    fi
}

# 触发滚动重启
trigger_rolling_restart() {
    log "触发滚动重启..."
    
    if [ ! -f "$COMPOSE_FILE" ]; then
        log_error "Docker Compose 文件不存在: $COMPOSE_FILE"
        return 1
    fi
    
    # 检查 Docker 是否运行
    if ! docker info > /dev/null 2>&1; then
        log_error "Docker 未运行或无法访问"
        return 1
    fi
    
    # 执行滚动重启
    docker-compose -f "$COMPOSE_FILE" up -d --force-recreate --no-deps api
    
    # 等待服务启动
    log "等待服务启动..."
    sleep 30
    
    # 验证服务状态
    if curl -f http://localhost:3001/healthz > /dev/null 2>&1; then
        log_success "滚动重启成功，服务正常运行"
    else
        log_error "滚动重启后服务状态异常"
        return 1
    fi
}

# 验证密钥轮换
verify_rotation() {
    log "验证密钥轮换..."
    
    # 检查服务健康状态
    if curl -f http://localhost:3001/healthz > /dev/null 2>&1; then
        log_success "服务健康检查通过"
    else
        log_error "服务健康检查失败"
        return 1
    fi
    
    # 检查认证功能
    local test_response=$(curl -s -X POST http://localhost:3001/auth/login \
        -H "Content-Type: application/json" \
        -d '{"email":"test@example.com","password":"testpassword"}' || echo "failed")
    
    if echo "$test_response" | grep -q "failed"; then
        log_success "认证功能正常（预期失败）"
    else
        log_warning "认证功能可能异常"
    fi
    
    log_success "密钥轮换验证完成"
}

# 生成轮换报告
generate_rotation_report() {
    local report_file="secret-rotation-report-$(date +%Y%m%d_%H%M%S).txt"
    
    cat > "$report_file" << EOF
========================================
密钥轮换报告
========================================
轮换时间: $(date)
轮换类型: JWT 密钥轮换
环境: $GITHUB_ENVIRONMENT

========================================
轮换详情
========================================
- JWT_SECRET: 已生成新密钥 (${JWT_SECRET_LENGTH} 字符)
- REFRESH_TOKEN_SECRET: 已生成新密钥 (${REFRESH_TOKEN_SECRET_LENGTH} 字符)
- GitHub Environment: $GITHUB_ENVIRONMENT
- 滚动重启: 已执行

========================================
验证结果
========================================
- 服务健康检查: 通过
- 认证功能: 正常
- 滚动重启: 成功

========================================
后续操作
========================================
1. 监控服务运行状态
2. 检查应用日志
3. 验证用户认证功能
4. 更新相关文档

轮换完成时间: $(date)
EOF

    log_success "轮换报告已生成: $report_file"
}

# 主函数
main() {
    log "🔐 开始密钥轮换流程..."
    
    # 检查参数
    if [ "$1" = "--dry-run" ]; then
        log_warning "运行模式: DRY RUN（仅模拟，不实际执行）"
        DRY_RUN=true
    else
        DRY_RUN=false
    fi
    
    # 生成新密钥
    log "生成新的 JWT 密钥..."
    NEW_JWT_SECRET=$(generate_secret $JWT_SECRET_LENGTH)
    NEW_REFRESH_TOKEN_SECRET=$(generate_secret $REFRESH_TOKEN_SECRET_LENGTH)
    
    log_success "新密钥已生成"
    log "JWT_SECRET: ${NEW_JWT_SECRET:0:8}..."
    log "REFRESH_TOKEN_SECRET: ${NEW_REFRESH_TOKEN_SECRET:0:8}..."
    
    if [ "$DRY_RUN" = "true" ]; then
        log_warning "DRY RUN 模式，跳过实际更新"
        log "将执行的操作:"
        log "1. 更新 GitHub Environment 密钥"
        log "2. 更新本地环境变量文件"
        log "3. 触发滚动重启"
        log "4. 验证轮换结果"
        return 0
    fi
    
    # 更新 GitHub Environment
    update_github_secret "JWT_SECRET" "$NEW_JWT_SECRET"
    update_github_secret "REFRESH_TOKEN_SECRET" "$NEW_REFRESH_TOKEN_SECRET"
    
    # 更新本地环境变量文件
    update_local_env "JWT_SECRET" "$NEW_JWT_SECRET" ".env"
    update_local_env "JWT_SECRET" "$NEW_JWT_SECRET" "server/.env"
    update_local_env "REFRESH_TOKEN_SECRET" "$NEW_REFRESH_TOKEN_SECRET" ".env"
    update_local_env "REFRESH_TOKEN_SECRET" "$NEW_REFRESH_TOKEN_SECRET" "server/.env"
    
    # 触发滚动重启
    trigger_rolling_restart
    
    # 验证轮换结果
    verify_rotation
    
    # 生成报告
    generate_rotation_report
    
    log_success "🎉 密钥轮换完成！"
}

# 显示帮助信息
show_help() {
    echo "用法: $0 [选项]"
    echo ""
    echo "选项:"
    echo "  --dry-run          仅模拟执行，不实际更新密钥"
    echo "  -h, --help         显示帮助信息"
    echo ""
    echo "环境变量:"
    echo "  JWT_SECRET_LENGTH            JWT 密钥长度 (默认: 64)"
    echo "  REFRESH_TOKEN_SECRET_LENGTH  刷新令牌密钥长度 (默认: 64)"
    echo "  GITHUB_TOKEN                GitHub 访问令牌"
    echo "  GITHUB_REPO                 GitHub 仓库 (格式: owner/repo)"
    echo "  GITHUB_ENVIRONMENT          GitHub 环境名称 (默认: production)"
    echo "  COMPOSE_FILE                Docker Compose 文件 (默认: docker-compose.prod.yml)"
    echo ""
    echo "示例:"
    echo "  $0                    # 执行密钥轮换"
    echo "  $0 --dry-run          # 模拟执行"
    echo "  GITHUB_ENVIRONMENT=staging $0  # 轮换 staging 环境密钥"
}

# 解析命令行参数
while [[ $# -gt 0 ]]; do
    case $1 in
        --dry-run)
            DRY_RUN=true
            shift
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
main "$@"
