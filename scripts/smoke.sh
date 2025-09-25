#!/bin/bash
# Aura Flow Smoke 测试脚本
# 验证关键 API 端点的基本功能

set -e

# 配置
BASE_URL="${API_BASE_URL:-http://localhost:3001}"
TEST_EMAIL="smoke-test@example.com"
TEST_PASSWORD="smoke-test-password"
TEST_NAME="Smoke Test User"

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 日志函数
log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# 检查服务是否运行
check_service() {
    log_info "检查服务状态..."
    
    if ! curl -s -f "$BASE_URL/health" > /dev/null; then
        log_error "服务未运行或健康检查失败"
        exit 1
    fi
    
    log_info "服务运行正常"
}

# 测试用户注册
test_register() {
    log_info "测试用户注册..."
    
    local response=$(curl -s -X POST "$BASE_URL/auth/register" \
        -H "Content-Type: application/json" \
        -d "{
            \"email\": \"$TEST_EMAIL\",
            \"name\": \"$TEST_NAME\",
            \"password\": \"$TEST_PASSWORD\"
        }")
    
    if echo "$response" | grep -q "注册成功\|用户已存在"; then
        log_info "用户注册测试通过"
    else
        log_error "用户注册失败: $response"
        exit 1
    fi
}

# 测试用户登录
test_login() {
    log_info "测试用户登录..."
    
    local response=$(curl -s -X POST "$BASE_URL/auth/login" \
        -H "Content-Type: application/json" \
        -d "{
            \"email\": \"$TEST_EMAIL\",
            \"password\": \"$TEST_PASSWORD\"
        }")
    
    if echo "$response" | grep -q "access_token\|登录成功"; then
        log_info "用户登录测试通过"
        # 提取 token
        TOKEN=$(echo "$response" | grep -o '"access_token":"[^"]*"' | cut -d'"' -f4)
    else
        log_error "用户登录失败: $response"
        exit 1
    fi
}

# 测试获取用户信息
test_me() {
    log_info "测试获取用户信息..."
    
    local response=$(curl -s -X GET "$BASE_URL/auth/me" \
        -H "Authorization: Bearer $TOKEN")
    
    if echo "$response" | grep -q "$TEST_EMAIL"; then
        log_info "获取用户信息测试通过"
    else
        log_error "获取用户信息失败: $response"
        exit 1
    fi
}

# 测试任务 CRUD
test_tasks() {
    log_info "测试任务 CRUD..."
    
    # 创建任务
    local create_response=$(curl -s -X POST "$BASE_URL/tasks" \
        -H "Authorization: Bearer $TOKEN" \
        -H "Content-Type: application/json" \
        -d "{
            \"title\": \"Smoke Test Task\",
            \"description\": \"This is a smoke test task\",
            \"priority\": \"HIGH\"
        }")
    
    if echo "$create_response" | grep -q "task_id\|id"; then
        log_info "任务创建测试通过"
        TASK_ID=$(echo "$create_response" | grep -o '"id":"[^"]*"' | cut -d'"' -f4)
    else
        log_error "任务创建失败: $create_response"
        exit 1
    fi
    
    # 获取任务列表
    local list_response=$(curl -s -X GET "$BASE_URL/tasks" \
        -H "Authorization: Bearer $TOKEN")
    
    if echo "$list_response" | grep -q "Smoke Test Task"; then
        log_info "任务列表获取测试通过"
    else
        log_error "任务列表获取失败: $list_response"
        exit 1
    fi
    
    # 更新任务
    local update_response=$(curl -s -X PUT "$BASE_URL/tasks/$TASK_ID" \
        -H "Authorization: Bearer $TOKEN" \
        -H "Content-Type: application/json" \
        -d "{
            \"title\": \"Updated Smoke Test Task\",
            \"status\": \"COMPLETED\"
        }")
    
    if echo "$update_response" | grep -q "更新成功\|success"; then
        log_info "任务更新测试通过"
    else
        log_error "任务更新失败: $update_response"
        exit 1
    fi
    
    # 删除任务
    local delete_response=$(curl -s -X DELETE "$BASE_URL/tasks/$TASK_ID" \
        -H "Authorization: Bearer $TOKEN")
    
    if echo "$delete_response" | grep -q "删除成功\|success"; then
        log_info "任务删除测试通过"
    else
        log_error "任务删除失败: $delete_response"
        exit 1
    fi
}

# 测试洞察生成
test_insights() {
    log_info "测试洞察生成..."
    
    local response=$(curl -s -X POST "$BASE_URL/insights/generate" \
        -H "Authorization: Bearer $TOKEN" \
        -H "Content-Type: application/json" \
        -d "{
            \"type\": \"DAILY\"
        }")
    
    if echo "$response" | grep -q "insights\|insight_id"; then
        log_info "洞察生成测试通过"
    else
        log_warn "洞察生成失败，可能是 AI 服务不可用: $response"
        # 洞察生成失败不应该导致整个测试失败
    fi
}

# 测试数据导出
test_data_export() {
    log_info "测试数据导出..."
    
    local response=$(curl -s -X GET "$BASE_URL/data-management/export-my-data" \
        -H "Authorization: Bearer $TOKEN")
    
    if echo "$response" | grep -q "user_data\|export"; then
        log_info "数据导出测试通过"
    else
        log_error "数据导出失败: $response"
        exit 1
    fi
}

# 测试监控端点
test_monitoring() {
    log_info "测试监控端点..."
    
    local response=$(curl -s -X GET "$BASE_URL/monitoring/status")
    
    if echo "$response" | grep -q "status\|uptime"; then
        log_info "监控端点测试通过"
    else
        log_error "监控端点失败: $response"
        exit 1
    fi
}

# 清理测试数据
cleanup() {
    log_info "清理测试数据..."
    
    # 删除测试用户（如果支持）
    curl -s -X DELETE "$BASE_URL/auth/delete-account" \
        -H "Authorization: Bearer $TOKEN" \
        -H "Content-Type: application/json" \
        -d "{\"password\": \"$TEST_PASSWORD\"}" || true
    
    log_info "清理完成"
}

# 主函数
main() {
    log_info "开始 Aura Flow Smoke 测试..."
    log_info "API 基础 URL: $BASE_URL"
    
    # 设置清理陷阱
    trap cleanup EXIT
    
    # 运行测试
    check_service
    test_register
    test_login
    test_me
    test_tasks
    test_insights
    test_data_export
    test_monitoring
    
    log_info "🎉 所有 Smoke 测试通过！"
}

# 运行主函数
main "$@"
