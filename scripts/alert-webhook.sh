#!/bin/bash
# 告警 Webhook 脚本
# 支持推送部署成功/失败、AI 预算超限事件到 Slack Webhook 或邮箱

set -e

# 配置
SLACK_WEBHOOK_URL=${SLACK_WEBHOOK_URL:-""}
EMAIL_SMTP_SERVER=${EMAIL_SMTP_SERVER:-"smtp.gmail.com"}
EMAIL_SMTP_PORT=${EMAIL_SMTP_PORT:-"587"}
EMAIL_USERNAME=${EMAIL_USERNAME:-""}
EMAIL_PASSWORD=${EMAIL_PASSWORD:-""}
EMAIL_FROM=${EMAIL_FROM:-"alerts@yourdomain.com"}
EMAIL_TO=${EMAIL_TO:-"admin@yourdomain.com"}

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

# 发送 Slack 消息
send_slack_message() {
    local message="$1"
    local color="$2"
    local title="$3"
    local fields="$4"
    
    if [ -z "$SLACK_WEBHOOK_URL" ]; then
        log_warning "Slack Webhook URL 未配置，跳过 Slack 通知"
        return 0
    fi
    
    local payload=$(cat << EOF
{
    "attachments": [
        {
            "color": "$color",
            "title": "$title",
            "text": "$message",
            "fields": $fields,
            "footer": "Aura Flow Alert System",
            "ts": $(date +%s)
        }
    ]
}
EOF
)
    
    local response=$(curl -s -X POST -H 'Content-type: application/json' \
        --data "$payload" \
        "$SLACK_WEBHOOK_URL")
    
    if [ $? -eq 0 ]; then
        log_success "Slack 消息发送成功"
        return 0
    else
        log_error "Slack 消息发送失败: $response"
        return 1
    fi
}

# 发送邮件
send_email() {
    local subject="$1"
    local body="$2"
    
    if [ -z "$EMAIL_USERNAME" ] || [ -z "$EMAIL_PASSWORD" ]; then
        log_warning "邮件配置不完整，跳过邮件通知"
        return 0
    fi
    
    # 创建邮件内容
    local email_content=$(cat << EOF
From: $EMAIL_FROM
To: $EMAIL_TO
Subject: $subject
Content-Type: text/html; charset=UTF-8

<html>
<body>
    <h2>Aura Flow 系统告警</h2>
    <p><strong>时间:</strong> $(date '+%Y-%m-%d %H:%M:%S')</p>
    <p><strong>环境:</strong> ${NODE_ENV:-production}</p>
    <hr>
    $body
    <hr>
    <p><small>此邮件由 Aura Flow 告警系统自动发送</small></p>
</body>
</html>
EOF
)
    
    # 发送邮件
    echo "$email_content" | \
    curl -s --url "smtp://$EMAIL_SMTP_SERVER:$EMAIL_SMTP_PORT" \
        --ssl-reqd \
        --mail-from "$EMAIL_FROM" \
        --mail-rcpt "$EMAIL_TO" \
        --user "$EMAIL_USERNAME:$EMAIL_PASSWORD" \
        --upload-file - > /dev/null
    
    if [ $? -eq 0 ]; then
        log_success "邮件发送成功"
        return 0
    else
        log_error "邮件发送失败"
        return 1
    fi
}

# 部署成功通知
notify_deployment_success() {
    local version="$1"
    local environment="$2"
    local duration="$3"
    
    local message="部署成功完成！"
    local title="🚀 部署成功 - $version"
    local color="good"
    
    local fields=$(cat << EOF
[
    {"title": "版本", "value": "$version", "short": true},
    {"title": "环境", "value": "$environment", "short": true},
    {"title": "耗时", "value": "${duration}s", "short": true},
    {"title": "时间", "value": "$(date '+%Y-%m-%d %H:%M:%S')", "short": true}
]
EOF
)
    
    local email_body=$(cat << EOF
    <h3>🚀 部署成功</h3>
    <ul>
        <li><strong>版本:</strong> $version</li>
        <li><strong>环境:</strong> $environment</li>
        <li><strong>耗时:</strong> ${duration}s</li>
        <li><strong>时间:</strong> $(date '+%Y-%m-%d %H:%M:%S')</li>
    </ul>
    <p>系统已成功部署并运行正常。</p>
EOF
)
    
    log "发送部署成功通知..."
    send_slack_message "$message" "$color" "$title" "$fields"
    send_email "Aura Flow 部署成功 - $version" "$email_body"
}

# 部署失败通知
notify_deployment_failure() {
    local version="$1"
    local environment="$2"
    local error_message="$3"
    
    local message="部署失败！"
    local title="❌ 部署失败 - $version"
    local color="danger"
    
    local fields=$(cat << EOF
[
    {"title": "版本", "value": "$version", "short": true},
    {"title": "环境", "value": "$environment", "short": true},
    {"title": "错误", "value": "$error_message", "short": false},
    {"title": "时间", "value": "$(date '+%Y-%m-%d %H:%M:%S')", "short": true}
]
EOF
)
    
    local email_body=$(cat << EOF
    <h3>❌ 部署失败</h3>
    <ul>
        <li><strong>版本:</strong> $version</li>
        <li><strong>环境:</strong> $environment</li>
        <li><strong>错误:</strong> $error_message</li>
        <li><strong>时间:</strong> $(date '+%Y-%m-%d %H:%M:%S')</li>
    </ul>
    <p>请立即检查部署日志并采取相应措施。</p>
EOF
)
    
    log "发送部署失败通知..."
    send_slack_message "$message" "$color" "$title" "$fields"
    send_email "Aura Flow 部署失败 - $version" "$email_body"
}

# AI 预算超限通知
notify_ai_budget_exceeded() {
    local budget_type="$1"  # daily 或 monthly
    local used_amount="$2"
    local limit_amount="$3"
    local percentage="$4"
    
    local message="AI 预算超限！"
    local title="💰 AI 预算超限 - $budget_type"
    local color="warning"
    
    local fields=$(cat << EOF
[
    {"title": "预算类型", "value": "$budget_type", "short": true},
    {"title": "已使用", "value": "\$${used_amount}", "short": true},
    {"title": "限制", "value": "\$${limit_amount}", "short": true},
    {"title": "使用率", "value": "${percentage}%", "short": true},
    {"title": "时间", "value": "$(date '+%Y-%m-%d %H:%M:%S')", "short": true}
]
EOF
)
    
    local email_body=$(cat << EOF
    <h3>💰 AI 预算超限</h3>
    <ul>
        <li><strong>预算类型:</strong> $budget_type</li>
        <li><strong>已使用:</strong> \$${used_amount}</li>
        <li><strong>限制:</strong> \$${limit_amount}</li>
        <li><strong>使用率:</strong> ${percentage}%</li>
        <li><strong>时间:</strong> $(date '+%Y-%m-%d %H:%M:%S')</li>
    </ul>
    <p>AI 服务已自动降级为 Mock 模式。请检查使用情况并考虑调整预算限制。</p>
EOF
)
    
    log "发送 AI 预算超限通知..."
    send_slack_message "$message" "$color" "$title" "$fields"
    send_email "Aura Flow AI 预算超限 - $budget_type" "$email_body"
}

# 系统告警通知
notify_system_alert() {
    local alert_type="$1"
    local severity="$2"
    local message="$3"
    local details="$4"
    
    local color="warning"
    case "$severity" in
        "critical") color="danger" ;;
        "warning") color="warning" ;;
        "info") color="good" ;;
    esac
    
    local title="🚨 系统告警 - $alert_type"
    
    local fields=$(cat << EOF
[
    {"title": "告警类型", "value": "$alert_type", "short": true},
    {"title": "严重程度", "value": "$severity", "short": true},
    {"title": "详情", "value": "$details", "short": false},
    {"title": "时间", "value": "$(date '+%Y-%m-%d %H:%M:%S')", "short": true}
]
EOF
)
    
    local email_body=$(cat << EOF
    <h3>🚨 系统告警</h3>
    <ul>
        <li><strong>告警类型:</strong> $alert_type</li>
        <li><strong>严重程度:</strong> $severity</li>
        <li><strong>消息:</strong> $message</li>
        <li><strong>详情:</strong> $details</li>
        <li><strong>时间:</strong> $(date '+%Y-%m-%d %H:%M:%S')</li>
    </ul>
EOF
)
    
    log "发送系统告警通知..."
    send_slack_message "$message" "$color" "$title" "$fields"
    send_email "Aura Flow 系统告警 - $alert_type" "$email_body"
}

# 测试通知
test_notification() {
    log "🧪 测试通知功能..."
    
    # 测试 Slack
    if [ -n "$SLACK_WEBHOOK_URL" ]; then
        send_slack_message "这是一条测试消息" "good" "🧪 测试通知" '[]'
    fi
    
    # 测试邮件
    if [ -n "$EMAIL_USERNAME" ] && [ -n "$EMAIL_PASSWORD" ]; then
        send_email "Aura Flow 测试通知" "<p>这是一条测试消息，用于验证邮件通知功能。</p>"
    fi
    
    log_success "测试通知发送完成"
}

# 系统告警通知（增强版）
notify_system_alert_enhanced() {
    local alert_type="$1"
    local severity="$2"
    local message="$3"
    local details="$4"
    local route="$5"
    
    local color="warning"
    case "$severity" in
        "critical") color="danger" ;;
        "high") color="danger" ;;
        "medium") color="warning" ;;
        "low") color="good" ;;
    esac
    
    local title="🚨 系统告警 - $alert_type"
    local severity_emoji=""
    case "$severity" in
        "critical") severity_emoji="🔴" ;;
        "high") severity_emoji="🟠" ;;
        "medium") severity_emoji="🟡" ;;
        "low") severity_emoji="🟢" ;;
    esac
    
    local fields=$(cat << EOL
[
    {"title": "告警类型", "value": "$alert_type", "short": true},
    {"title": "严重程度", "value": "$severity_emoji $severity", "short": true},
    {"title": "路由", "value": "$route", "short": true},
    {"title": "时间", "value": "$(date '+%Y-%m-%d %H:%M:%S')", "short": true},
    {"title": "详情", "value": "$details", "short": false}
]
EOL
)
    
    local email_body=$(cat << EOL
    <h3>🚨 系统告警</h3>
    <ul>
        <li><strong>告警类型:</strong> $alert_type</li>
        <li><strong>严重程度:</strong> $severity_emoji $severity</li>
        <li><strong>路由:</strong> $route</li>
        <li><strong>消息:</strong> $message</li>
        <li><strong>详情:</strong> $details</li>
        <li><strong>时间:</strong> $(date '+%Y-%m-%d %H:%M:%S')</li>
    </ul>
EOL
)
    
    log "发送系统告警通知..."
    send_slack_message "$message" "$color" "$title" "$fields"
    send_email "Aura Flow 系统告警 - $alert_type ($severity)" "$email_body"
}

# 主函数
main() {
    local action="$1"
    shift
    
    case "$action" in
        "deployment-success")
            notify_deployment_success "$1" "$2" "$3"
            ;;
        "deployment-failure")
            notify_deployment_failure "$1" "$2" "$3"
            ;;
        "ai-budget-exceeded")
            notify_ai_budget_exceeded "$1" "$2" "$3" "$4"
            ;;
        "system-alert")
            notify_system_alert "$1" "$2" "$3" "$4"
            ;;
        "system-alert-enhanced")
            notify_system_alert_enhanced "$1" "$2" "$3" "$4" "$5"
            ;;
        "test")
            test_notification
            ;;
        *)
            echo "用法: $0 <action> [参数...]"
            echo ""
            echo "动作:"
            echo "  deployment-success <version> <environment> <duration>"
            echo "  deployment-failure <version> <environment> <error_message>"
            echo "  ai-budget-exceeded <budget_type> <used> <limit> <percentage>"
            echo "  system-alert <alert_type> <severity> <message> <details>"
            echo "  system-alert-enhanced <alert_type> <severity> <message> <details> <route>"
            echo "  test"
            echo ""
            echo "示例:"
            echo "  $0 deployment-success v1.0.0 production 120"
            echo "  $0 ai-budget-exceeded daily 3.5 3.0 116.7"
            echo "  $0 system-alert database critical \"数据库连接失败\" \"连接超时\""
            echo "  $0 system-alert-enhanced database critical \"数据库连接失败\" \"连接超时\" \"/api/database\""
            echo "  $0 test"
            exit 1
            ;;
    esac
}

# 显示帮助信息
show_help() {
    echo "Aura Flow 告警 Webhook 脚本"
    echo ""
    echo "环境变量:"
    echo "  SLACK_WEBHOOK_URL     Slack Webhook URL"
    echo "  EMAIL_SMTP_SERVER     SMTP 服务器地址"
    echo "  EMAIL_SMTP_PORT       SMTP 端口"
    echo "  EMAIL_USERNAME        SMTP 用户名"
    echo "  EMAIL_PASSWORD        SMTP 密码"
    echo "  EMAIL_FROM            发件人邮箱"
    echo "  EMAIL_TO              收件人邮箱"
    echo ""
    echo "用法: $0 <action> [参数...]"
    echo ""
    echo "动作:"
    echo "  deployment-success    部署成功通知"
    echo "  deployment-failure    部署失败通知"
    echo "  ai-budget-exceeded    AI 预算超限通知"
    echo "  system-alert          系统告警通知"
    echo "  test                  测试通知功能"
    echo ""
    echo "示例:"
    echo "  $0 deployment-success v1.0.0 production 120"
    echo "  $0 ai-budget-exceeded daily 3.5 3.0 116.7"
    echo "  $0 system-alert database critical \"数据库连接失败\" \"连接超时\""
    echo "  $0 test"
}

# 检查参数
if [ $# -eq 0 ]; then
    show_help
    exit 1
fi

# 执行主函数
main "$@"
