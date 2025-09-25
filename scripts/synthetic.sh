#!/bin/bash
# 合成监控脚本
# 模拟完整用户旅程：登录→新建任务→生成洞察→登出

set -e

# 配置
API_BASE_URL=${API_BASE_URL:-"http://localhost:3001"}
FRONTEND_URL=${FRONTEND_URL:-"http://localhost:5173"}
TEST_EMAIL="synthetic-test@example.com"
TEST_PASSWORD="SyntheticTest123!"
TEST_USER_NAME="Synthetic Test User"
OUTPUT_DIR=${OUTPUT_DIR:-"./test-results"}
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

# 测试计数器
TESTS_PASSED=0
TESTS_FAILED=0
TESTS_TOTAL=0

# 测试结果存储
TEST_RESULTS=()

# 开始测试计时
start_test() {
    TEST_START_TIME=$(date +%s.%N)
}

# 结束测试计时
end_test() {
    TEST_END_TIME=$(date +%s.%N)
    TEST_DURATION=$(echo "$TEST_END_TIME - $TEST_START_TIME" | bc)
}

# 记录测试结果
record_test() {
    local test_name="$1"
    local status="$2"
    local duration="$3"
    local message="$4"
    
    TESTS_TOTAL=$((TESTS_TOTAL + 1))
    
    if [ "$status" = "PASS" ]; then
        TESTS_PASSED=$((TESTS_PASSED + 1))
        log_success "$test_name: $message"
    else
        TESTS_FAILED=$((TESTS_FAILED + 1))
        log_error "$test_name: $message"
    fi
    
    TEST_RESULTS+=("$test_name|$status|$duration|$message")
}

# HTTP 请求函数
http_request() {
    local method=$1
    local url=$2
    local data=$3
    local headers=$4
    local expected_status=$5
    
    local curl_cmd="curl -s -w '%{http_code}' -X $method --max-time $TIMEOUT"
    
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
    
    log_error "$service_name 启动超时"
    return 1
}

# 测试 1: 健康检查
test_health_check() {
    start_test
    
    if http_request "GET" "$API_BASE_URL/healthz" "" "" "200" > /dev/null; then
        end_test
        record_test "Health Check" "PASS" "$TEST_DURATION" "服务健康检查通过"
    else
        end_test
        record_test "Health Check" "FAIL" "$TEST_DURATION" "服务健康检查失败"
        return 1
    fi
}

# 测试 2: 用户注册
test_user_registration() {
    start_test
    
    local register_data="{\"email\":\"$TEST_EMAIL\",\"name\":\"$TEST_USER_NAME\",\"password\":\"$TEST_PASSWORD\"}"
    local response=$(http_request "POST" "$API_BASE_URL/auth/register" "$register_data" "Content-Type: application/json" "200" 2>/dev/null || echo "")
    
    if [ -n "$response" ]; then
        end_test
        record_test "User Registration" "PASS" "$TEST_DURATION" "用户注册成功"
    else
        end_test
        record_test "User Registration" "FAIL" "$TEST_DURATION" "用户注册失败"
        return 1
    fi
}

# 测试 3: 用户登录
test_user_login() {
    start_test
    
    local login_data="{\"email\":\"$TEST_EMAIL\",\"password\":\"$TEST_PASSWORD\"}"
    local response=$(http_request "POST" "$API_BASE_URL/auth/login" "$login_data" "Content-Type: application/json" "200")
    
    if [ -n "$response" ]; then
        # 提取访问令牌
        ACCESS_TOKEN=$(echo "$response" | grep -o '"access_token":"[^"]*"' | cut -d'"' -f4)
        
        if [ -n "$ACCESS_TOKEN" ]; then
            end_test
            record_test "User Login" "PASS" "$TEST_DURATION" "用户登录成功"
        else
            end_test
            record_test "User Login" "FAIL" "$TEST_DURATION" "无法提取访问令牌"
            return 1
        fi
    else
        end_test
        record_test "User Login" "FAIL" "$TEST_DURATION" "用户登录失败"
        return 1
    fi
}

# 测试 4: 获取用户信息
test_get_user_info() {
    start_test
    
    if [ -z "$ACCESS_TOKEN" ]; then
        end_test
        record_test "Get User Info" "FAIL" "$TEST_DURATION" "缺少访问令牌"
        return 1
    fi
    
    if http_request "GET" "$API_BASE_URL/auth/me" "" "Authorization: Bearer $ACCESS_TOKEN" "200" > /dev/null; then
        end_test
        record_test "Get User Info" "PASS" "$TEST_DURATION" "获取用户信息成功"
    else
        end_test
        record_test "Get User Info" "FAIL" "$TEST_DURATION" "获取用户信息失败"
        return 1
    fi
}

# 测试 5: 创建任务
test_create_task() {
    start_test
    
    if [ -z "$ACCESS_TOKEN" ]; then
        end_test
        record_test "Create Task" "FAIL" "$TEST_DURATION" "缺少访问令牌"
        return 1
    fi
    
    local task_data="{\"title\":\"Synthetic Test Task\",\"description\":\"This is a task created by synthetic monitoring\",\"priority\":\"HIGH\"}"
    local response=$(http_request "POST" "$API_BASE_URL/tasks" "$task_data" "Authorization: Bearer $ACCESS_TOKEN" "200")
    
    if [ -n "$response" ]; then
        # 提取任务 ID
        TASK_ID=$(echo "$response" | grep -o '"id":"[^"]*"' | cut -d'"' -f4)
        
        if [ -n "$TASK_ID" ]; then
            end_test
            record_test "Create Task" "PASS" "$TEST_DURATION" "创建任务成功，ID: $TASK_ID"
        else
            end_test
            record_test "Create Task" "FAIL" "$TEST_DURATION" "无法提取任务 ID"
            return 1
        fi
    else
        end_test
        record_test "Create Task" "FAIL" "$TEST_DURATION" "创建任务失败"
        return 1
    fi
}

# 测试 6: 获取任务列表
test_get_tasks() {
    start_test
    
    if [ -z "$ACCESS_TOKEN" ]; then
        end_test
        record_test "Get Tasks" "FAIL" "$TEST_DURATION" "缺少访问令牌"
        return 1
    fi
    
    if http_request "GET" "$API_BASE_URL/tasks" "" "Authorization: Bearer $ACCESS_TOKEN" "200" > /dev/null; then
        end_test
        record_test "Get Tasks" "PASS" "$TEST_DURATION" "获取任务列表成功"
    else
        end_test
        record_test "Get Tasks" "FAIL" "$TEST_DURATION" "获取任务列表失败"
        return 1
    fi
}

# 测试 7: 更新任务
test_update_task() {
    start_test
    
    if [ -z "$ACCESS_TOKEN" ] || [ -z "$TASK_ID" ]; then
        end_test
        record_test "Update Task" "FAIL" "$TEST_DURATION" "缺少访问令牌或任务 ID"
        return 1
    fi
    
    local update_data="{\"title\":\"Updated Synthetic Test Task\",\"status\":\"IN_PROGRESS\"}"
    
    if http_request "PUT" "$API_BASE_URL/tasks/$TASK_ID" "$update_data" "Authorization: Bearer $ACCESS_TOKEN" "200" > /dev/null; then
        end_test
        record_test "Update Task" "PASS" "$TEST_DURATION" "更新任务成功"
    else
        end_test
        record_test "Update Task" "FAIL" "$TEST_DURATION" "更新任务失败"
        return 1
    fi
}

# 测试 8: 生成 AI 洞察
test_generate_insights() {
    start_test
    
    if [ -z "$ACCESS_TOKEN" ]; then
        end_test
        record_test "Generate Insights" "FAIL" "$TEST_DURATION" "缺少访问令牌"
        return 1
    fi
    
    local insight_data="{\"type\":\"DAILY\",\"prompt\":\"Generate insights for synthetic monitoring test\"}"
    local response=$(http_request "POST" "$API_BASE_URL/insights/generate" "$insight_data" "Authorization: Bearer $ACCESS_TOKEN" "200")
    
    if [ -n "$response" ]; then
        end_test
        record_test "Generate Insights" "PASS" "$TEST_DURATION" "生成 AI 洞察成功"
    else
        end_test
        record_test "Generate Insights" "FAIL" "$TEST_DURATION" "生成 AI 洞察失败"
        return 1
    fi
}

# 测试 9: 删除任务
test_delete_task() {
    start_test
    
    if [ -z "$ACCESS_TOKEN" ] || [ -z "$TASK_ID" ]; then
        end_test
        record_test "Delete Task" "FAIL" "$TEST_DURATION" "缺少访问令牌或任务 ID"
        return 1
    fi
    
    if http_request "DELETE" "$API_BASE_URL/tasks/$TASK_ID" "" "Authorization: Bearer $ACCESS_TOKEN" "200" > /dev/null; then
        end_test
        record_test "Delete Task" "PASS" "$TEST_DURATION" "删除任务成功"
    else
        end_test
        record_test "Delete Task" "FAIL" "$TEST_DURATION" "删除任务失败"
        return 1
    fi
}

# 测试 10: 用户登出
test_user_logout() {
    start_test
    
    if [ -z "$ACCESS_TOKEN" ]; then
        end_test
        record_test "User Logout" "FAIL" "$TEST_DURATION" "缺少访问令牌"
        return 1
    fi
    
    if http_request "POST" "$API_BASE_URL/auth/logout" "" "Authorization: Bearer $ACCESS_TOKEN" "200" > /dev/null; then
        end_test
        record_test "User Logout" "PASS" "$TEST_DURATION" "用户登出成功"
    else
        end_test
        record_test "User Logout" "FAIL" "$TEST_DURATION" "用户登出失败"
        return 1
    fi
}

# 测试 11: 前端页面可访问性
test_frontend_accessibility() {
    start_test
    
    if curl -s --max-time $TIMEOUT "$FRONTEND_URL" > /dev/null 2>&1; then
        end_test
        record_test "Frontend Accessibility" "PASS" "$TEST_DURATION" "前端页面可访问"
    else
        end_test
        record_test "Frontend Accessibility" "FAIL" "$TEST_DURATION" "前端页面不可访问"
        return 1
    fi
}

# 生成 JUnit XML 报告
generate_junit_report() {
    local report_file="$OUTPUT_DIR/synthetic-test-results.xml"
    
    mkdir -p "$OUTPUT_DIR"
    
    cat > "$report_file" << EOF
<?xml version="1.0" encoding="UTF-8"?>
<testsuite name="Synthetic Monitoring" tests="$TESTS_TOTAL" failures="$TESTS_FAILED" time="$(date +%s)">
EOF

    for result in "${TEST_RESULTS[@]}"; do
        IFS='|' read -r test_name status duration message <<< "$result"
        
        if [ "$status" = "PASS" ]; then
            cat >> "$report_file" << EOF
    <testcase name="$test_name" time="$duration"/>
EOF
        else
            cat >> "$report_file" << EOF
    <testcase name="$test_name" time="$duration">
        <failure message="$message">$message</failure>
    </testcase>
EOF
        fi
    done
    
    cat >> "$report_file" << EOF
</testsuite>
EOF

    log_success "JUnit 报告已生成: $report_file"
}

# 生成摘要报告
generate_summary_report() {
    local report_file="$OUTPUT_DIR/synthetic-summary.txt"
    
    cat > "$report_file" << EOF
========================================
合成监控测试摘要
========================================
测试时间: $(date)
API 基础 URL: $API_BASE_URL
前端 URL: $FRONTEND_URL

========================================
测试结果
========================================
总测试数: $TESTS_TOTAL
通过: $TESTS_PASSED
失败: $TESTS_FAILED
成功率: $(( (TESTS_PASSED * 100) / TESTS_TOTAL ))%

========================================
详细结果
========================================
EOF

    for result in "${TEST_RESULTS[@]}"; do
        IFS='|' read -r test_name status duration message <<< "$result"
        echo "$test_name: $status ($duration 秒) - $message" >> "$report_file"
    done
    
    cat >> "$report_file" << EOF

========================================
建议
========================================
EOF

    if [ $TESTS_FAILED -eq 0 ]; then
        echo "✅ 所有测试通过，系统运行正常" >> "$report_file"
    else
        echo "❌ 存在 $TESTS_FAILED 个失败测试，需要检查系统状态" >> "$report_file"
    fi
    
    log_success "摘要报告已生成: $report_file"
}

# 主函数
main() {
    log "🧪 开始合成监控测试..."
    
    # 等待服务启动
    wait_for_service "$API_BASE_URL/healthz" "后端服务"
    wait_for_service "$FRONTEND_URL" "前端服务"
    
    # 执行测试序列
    test_health_check
    test_user_registration
    test_user_login
    test_get_user_info
    test_create_task
    test_get_tasks
    test_update_task
    test_generate_insights
    test_delete_task
    test_user_logout
    test_frontend_accessibility
    
    # 生成报告
    generate_junit_report
    generate_summary_report
    
    # 输出测试结果
    echo ""
    echo "=========================================="
    echo "📊 合成监控测试结果"
    echo "=========================================="
    echo "✅ 通过: $TESTS_PASSED"
    echo "❌ 失败: $TESTS_FAILED"
    echo "📈 成功率: $(( (TESTS_PASSED * 100) / TESTS_TOTAL ))%"
    echo "=========================================="
    
    if [ $TESTS_FAILED -eq 0 ]; then
        log_success "🎉 所有合成监控测试通过！"
        exit 0
    else
        log_error "❌ 存在 $TESTS_FAILED 个失败测试"
        exit 1
    fi
}

# 显示帮助信息
show_help() {
    echo "用法: $0 [选项]"
    echo ""
    echo "选项:"
    echo "  -h, --help         显示帮助信息"
    echo ""
    echo "环境变量:"
    echo "  API_BASE_URL       后端 API 基础 URL (默认: http://localhost:3001)"
    echo "  FRONTEND_URL       前端应用 URL (默认: http://localhost:5173)"
    echo "  OUTPUT_DIR         测试结果输出目录 (默认: ./test-results)"
    echo "  TIMEOUT            HTTP 请求超时时间 (默认: 30 秒)"
    echo ""
    echo "示例:"
    echo "  $0                                    # 运行合成监控测试"
    echo "  API_BASE_URL=https://api.example.com $0  # 指定 API URL"
    echo "  OUTPUT_DIR=/tmp/results $0            # 指定输出目录"
}

# 解析命令行参数
while [[ $# -gt 0 ]]; do
    case $1 in
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
EOF
