#!/bin/bash
# 发布后验证脚本
# 验证部署是否成功，包括健康检查、功能测试等

set -e

# 配置
API_BASE_URL=${API_BASE_URL:-"http://localhost:3001"}
FRONTEND_URL=${FRONTEND_URL:-"http://localhost:5173"}
TEST_EMAIL="deploy-test@example.com"
TEST_PASSWORD="DeployTest123!"
TIMEOUT=${TIMEOUT:-30}

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
TESTS_PASSED=0
TESTS_FAILED=0
TESTS_WARNING=0

# 测试函数
test_pass() {
    TESTS_PASSED=$((TESTS_PASSED + 1))
    log_success "$1"
}

test_fail() {
    TESTS_FAILED=$((TESTS_FAILED + 1))
    log_error "$1"
}

test_warning() {
    TESTS_WARNING=$((TESTS_WARNING + 1))
    log_warning "$1"
}

# HTTP 请求函数
http_request() {
    local method=$1
    local url=$2
    local data=$3
    local headers=$4
    local expected_status=$5
    
    local curl_cmd="curl -s -w '%{http_code}' -X $method"
    
    if [ -n "$data" ]; then
        curl_cmd="$curl_cmd -d '$data'"
    fi
    
    if [ -n "$headers" ]; then
        curl_cmd="$curl_cmd -H '$headers'"
    fi
    
    curl_cmd="$curl_cmd '$url'"
    
    local response=$(eval $curl_cmd)
    local status_code="${response: -3}"
    local body="${response%???}"
    
    if [ "$status_code" = "$expected_status" ]; then
        echo "$body"
        return 0
    else
        echo "HTTP $status_code: $body" >&2
        return 1
    fi
}

# 等待服务启动
wait_for_service() {
    local url=$1
    local service_name=$2
    local max_attempts=30
    local attempt=0
    
    log "⏳ 等待 $service_name 启动..."
    
    while [ $attempt -lt $max_attempts ]; do
        if curl -s --max-time 5 "$url" > /dev/null 2>&1; then
            log_success "$service_name 已启动"
            return 0
        fi
        
        attempt=$((attempt + 1))
        sleep 2
    done
    
    test_fail "$service_name 启动超时"
    return 1
}

# 健康检查测试
test_health_checks() {
    log "🏥 测试健康检查端点..."
    
    # 测试 /healthz
    if http_request "GET" "$API_BASE_URL/healthz" "" "" "200" > /dev/null; then
        test_pass "健康检查 (healthz) 通过"
    else
        test_fail "健康检查 (healthz) 失败"
    fi
    
    # 测试 /readyz
    if http_request "GET" "$API_BASE_URL/readyz" "" "" "200" > /dev/null; then
        test_pass "就绪检查 (readyz) 通过"
    else
        test_fail "就绪检查 (readyz) 失败"
    fi
}

# 用户认证测试
test_authentication() {
    log "🔐 测试用户认证..."
    
    # 注册测试用户
    local register_data="{\"email\":\"$TEST_EMAIL\",\"name\":\"Deploy Test User\",\"password\":\"$TEST_PASSWORD\"}"
    local register_response=$(http_request "POST" "$API_BASE_URL/auth/register" "$register_data" "Content-Type: application/json" "200" 2>/dev/null || echo "")
    
    if [ -n "$register_response" ]; then
        test_pass "用户注册成功"
    else
        test_warning "用户注册失败（可能已存在）"
    fi
    
    # 登录测试
    local login_data="{\"email\":\"$TEST_EMAIL\",\"password\":\"$TEST_PASSWORD\"}"
    local login_response=$(http_request "POST" "$API_BASE_URL/auth/login" "$login_data" "Content-Type: application/json" "200")
    
    if [ -n "$login_response" ]; then
        test_pass "用户登录成功"
        
        # 提取访问令牌
        local access_token=$(echo "$login_response" | grep -o '"access_token":"[^"]*"' | cut -d'"' -f4)
        
        if [ -n "$access_token" ]; then
            # 测试 /me 端点
            if http_request "GET" "$API_BASE_URL/auth/me" "" "Authorization: Bearer $access_token" "200" > /dev/null; then
                test_pass "用户信息获取成功"
            else
                test_fail "用户信息获取失败"
            fi
            
            # 保存令牌供后续测试使用
            echo "$access_token" > /tmp/deploy_test_token
        else
            test_fail "无法提取访问令牌"
        fi
    else
        test_fail "用户登录失败"
    fi
}

# 任务管理测试
test_task_management() {
    log "📝 测试任务管理..."
    
    local access_token=$(cat /tmp/deploy_test_token 2>/dev/null || echo "")
    if [ -z "$access_token" ]; then
        test_fail "缺少访问令牌，跳过任务管理测试"
        return
    fi
    
    # 创建任务
    local task_data="{\"title\":\"Deploy Test Task\",\"description\":\"This is a test task for deployment verification\",\"priority\":\"MEDIUM\"}"
    local create_response=$(http_request "POST" "$API_BASE_URL/tasks" "$task_data" "Authorization: Bearer $access_token" "200")
    
    if [ -n "$create_response" ]; then
        test_pass "任务创建成功"
        
        # 提取任务 ID
        local task_id=$(echo "$create_response" | grep -o '"id":"[^"]*"' | cut -d'"' -f4)
        
        if [ -n "$task_id" ]; then
            # 获取任务列表
            if http_request "GET" "$API_BASE_URL/tasks" "" "Authorization: Bearer $access_token" "200" > /dev/null; then
                test_pass "任务列表获取成功"
            else
                test_fail "任务列表获取失败"
            fi
            
            # 更新任务
            local update_data="{\"title\":\"Updated Deploy Test Task\",\"status\":\"COMPLETED\"}"
            if http_request "PUT" "$API_BASE_URL/tasks/$task_id" "$update_data" "Authorization: Bearer $access_token" "200" > /dev/null; then
                test_pass "任务更新成功"
            else
                test_fail "任务更新失败"
            fi
            
            # 删除任务
            if http_request "DELETE" "$API_BASE_URL/tasks/$task_id" "" "Authorization: Bearer $access_token" "200" > /dev/null; then
                test_pass "任务删除成功"
            else
                test_fail "任务删除失败"
            fi
        else
            test_fail "无法提取任务 ID"
        fi
    else
        test_fail "任务创建失败"
    fi
}

# AI 洞察测试
test_ai_insights() {
    log "🤖 测试 AI 洞察生成..."
    
    local access_token=$(cat /tmp/deploy_test_token 2>/dev/null || echo "")
    if [ -z "$access_token" ]; then
        test_fail "缺少访问令牌，跳过 AI 洞察测试"
        return
    fi
    
    # 测试 Mock AI 洞察生成
    local insight_data="{\"type\":\"DAILY\",\"prompt\":\"Generate insights for deployment test\"}"
    local insight_response=$(http_request "POST" "$API_BASE_URL/insights/generate" "$insight_data" "Authorization: Bearer $access_token" "200")
    
    if [ -n "$insight_response" ]; then
        test_pass "AI 洞察生成成功"
        
        # 检查是否包含降级信息
        if echo "$insight_response" | grep -q "degraded"; then
            test_warning "AI 洞察生成被降级"
        fi
    else
        test_fail "AI 洞察生成失败"
    fi
}

# 前端页面测试
test_frontend() {
    log "🌐 测试前端页面..."
    
    # 测试前端首页
    if curl -s --max-time 10 "$FRONTEND_URL" > /dev/null 2>&1; then
        test_pass "前端首页可访问"
    else
        test_fail "前端首页不可访问"
    fi
    
    # 测试状态页面
    if curl -s --max-time 10 "$FRONTEND_URL/status" > /dev/null 2>&1; then
        test_pass "前端状态页面可访问"
    else
        test_warning "前端状态页面不可访问"
    fi
}

# 性能测试
test_performance() {
    log "⚡ 测试性能..."
    
    # 测试健康检查响应时间
    local start_time=$(date +%s%N)
    if http_request "GET" "$API_BASE_URL/healthz" "" "" "200" > /dev/null; then
        local end_time=$(date +%s%N)
        local duration=$(( (end_time - start_time) / 1000000 )) # 转换为毫秒
        
        if [ $duration -lt 1000 ]; then
            test_pass "健康检查响应时间正常 (${duration}ms)"
        elif [ $duration -lt 3000 ]; then
            test_warning "健康检查响应时间较慢 (${duration}ms)"
        else
            test_fail "健康检查响应时间过慢 (${duration}ms)"
        fi
    else
        test_fail "健康检查性能测试失败"
    fi
}

# 清理测试数据
cleanup() {
    log "🧹 清理测试数据..."
    
    # 清理临时文件
    rm -f /tmp/deploy_test_token
    test_pass "测试数据清理完成"
}

# 主函数
main() {
    log "🚀 开始发布后验证..."
    
    # 等待服务启动
    wait_for_service "$API_BASE_URL/healthz" "后端服务"
    wait_for_service "$FRONTEND_URL" "前端服务"
    
    # 执行测试
    test_health_checks
    test_authentication
    test_task_management
    test_ai_insights
    test_frontend
    test_performance
    
    # 清理测试数据
    cleanup
    
    # 输出测试结果
    echo ""
    echo "=========================================="
    echo "📊 验证结果摘要"
    echo "=========================================="
    echo "✅ 通过: $TESTS_PASSED"
    echo "⚠️  警告: $TESTS_WARNING"
    echo "❌ 失败: $TESTS_FAILED"
    echo "=========================================="
    
    if [ $TESTS_FAILED -eq 0 ]; then
        log_success "🎉 所有验证通过，部署成功！"
        exit 0
    else
        log_error "❌ 存在 $TESTS_FAILED 个失败项，部署可能有问题"
        exit 1
    fi
}

# 执行主函数
main
