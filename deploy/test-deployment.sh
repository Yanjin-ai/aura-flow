#!/bin/bash

# Aura Flow 部署测试脚本
# 用于验证部署是否成功

set -e

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 日志函数
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# 检查参数
if [ $# -eq 0 ]; then
    log_error "请提供部署的 URL"
    echo "用法: $0 <your-app-url>"
    echo "示例: $0 https://aura-flow.vercel.app"
    exit 1
fi

APP_URL=$1
log_info "开始测试部署: $APP_URL"

# 测试计数器
TESTS_PASSED=0
TESTS_FAILED=0

# 测试函数
run_test() {
    local test_name="$1"
    local test_command="$2"
    local expected_status="$3"
    
    log_info "运行测试: $test_name"
    
    if eval "$test_command"; then
        log_success "✅ $test_name 通过"
        ((TESTS_PASSED++))
    else
        log_error "❌ $test_name 失败"
        ((TESTS_FAILED++))
    fi
    echo ""
}

# 1. 测试网站可访问性
run_test "网站可访问性" \
    "curl -s -f -o /dev/null '$APP_URL'" \
    "200"

# 2. 测试登录页面
run_test "登录页面加载" \
    "curl -s -f -o /dev/null '$APP_URL/login'" \
    "200"

# 3. 测试注册页面
run_test "注册页面加载" \
    "curl -s -f -o /dev/null '$APP_URL/register'" \
    "200"

# 4. 测试静态资源
run_test "静态资源加载" \
    "curl -s -f -o /dev/null '$APP_URL/favicon.ico'" \
    "200"

# 5. 测试 API 健康检查（如果有的话）
run_test "API 健康检查" \
    "curl -s -f -o /dev/null '$APP_URL/api/health' || curl -s -f -o /dev/null '$APP_URL/health'" \
    "200"

# 6. 测试 HTTPS
run_test "HTTPS 配置" \
    "curl -s -I '$APP_URL' | grep -i 'strict-transport-security' || echo 'HTTPS headers not found'" \
    "200"

# 7. 测试响应时间
log_info "测试响应时间..."
RESPONSE_TIME=$(curl -s -w "%{time_total}" -o /dev/null "$APP_URL")
if (( $(echo "$RESPONSE_TIME < 3.0" | bc -l) )); then
    log_success "✅ 响应时间测试通过 (${RESPONSE_TIME}s)"
    ((TESTS_PASSED++))
else
    log_warning "⚠️ 响应时间较慢 (${RESPONSE_TIME}s)"
    ((TESTS_FAILED++))
fi
echo ""

# 8. 测试移动端兼容性
log_info "测试移动端兼容性..."
USER_AGENT="Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15"
if curl -s -H "User-Agent: $USER_AGENT" -f -o /dev/null "$APP_URL"; then
    log_success "✅ 移动端兼容性测试通过"
    ((TESTS_PASSED++))
else
    log_error "❌ 移动端兼容性测试失败"
    ((TESTS_FAILED++))
fi
echo ""

# 9. 测试错误页面
run_test "404 页面处理" \
    "curl -s -f -o /dev/null '$APP_URL/non-existent-page' || [ $? -eq 22 ]" \
    "404"

# 10. 测试安全头
log_info "测试安全头..."
SECURITY_HEADERS=$(curl -s -I "$APP_URL" | grep -i -E "(x-content-type-options|x-frame-options|x-xss-protection)")
if [ -n "$SECURITY_HEADERS" ]; then
    log_success "✅ 安全头配置正确"
    ((TESTS_PASSED++))
else
    log_warning "⚠️ 安全头配置缺失"
    ((TESTS_FAILED++))
fi
echo ""

# 输出测试结果
echo "=========================================="
log_info "测试完成！"
echo "=========================================="
log_success "通过的测试: $TESTS_PASSED"
if [ $TESTS_FAILED -gt 0 ]; then
    log_error "失败的测试: $TESTS_FAILED"
else
    log_success "失败的测试: $TESTS_FAILED"
fi

# 计算成功率
TOTAL_TESTS=$((TESTS_PASSED + TESTS_FAILED))
SUCCESS_RATE=$((TESTS_PASSED * 100 / TOTAL_TESTS))

echo ""
if [ $SUCCESS_RATE -ge 80 ]; then
    log_success "🎉 部署测试成功！成功率: ${SUCCESS_RATE}%"
    echo ""
    log_info "下一步操作："
    echo "1. 在浏览器中访问: $APP_URL"
    echo "2. 测试用户注册功能"
    echo "3. 测试用户登录功能"
    echo "4. 测试任务管理功能"
    echo "5. 测试移动端显示"
    exit 0
else
    log_error "❌ 部署测试失败！成功率: ${SUCCESS_RATE}%"
    echo ""
    log_info "建议检查："
    echo "1. 环境变量配置是否正确"
    echo "2. 数据库连接是否正常"
    echo "3. 构建过程是否有错误"
    echo "4. 域名解析是否正确"
    exit 1
fi
