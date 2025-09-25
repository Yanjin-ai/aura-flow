#!/bin/bash
# 生产环境回滚脚本
# 将 stable 标签的镜像恢复上线

set -e

# 配置
DOCKER_REGISTRY=${DOCKER_REGISTRY:-"your-registry.com"}
IMAGE_NAME=${IMAGE_NAME:-"aura-flow-backend"}
CURRENT_TAG=${CURRENT_TAG:-"latest"}
STABLE_TAG=${STABLE_TAG:-"stable"}
COMPOSE_FILE=${COMPOSE_FILE:-"docker-compose.prod.yml"}
BACKUP_COMPOSE_FILE=${BACKUP_COMPOSE_FILE:-"docker-compose.prod.backup.yml"}
NGINX_CONF=${NGINX_CONF:-"/etc/nginx/nginx.conf"}
ROLLBACK_TYPE=${ROLLBACK_TYPE:-"image"}  # image, nginx, database

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

# 检查 Docker 是否运行
check_docker() {
    if ! docker info > /dev/null 2>&1; then
        log_error "Docker 未运行或无法访问"
        exit 1
    fi
    log_success "Docker 检查通过"
}

# 检查当前部署状态
check_current_deployment() {
    log "🔍 检查当前部署状态..."
    
    if [ -f "$COMPOSE_FILE" ]; then
        CURRENT_IMAGE=$(grep -o "image:.*" "$COMPOSE_FILE" | head -1 | cut -d' ' -f2)
        log "当前镜像: $CURRENT_IMAGE"
    else
        log_warning "未找到 $COMPOSE_FILE"
    fi
    
    # 检查运行中的容器
    RUNNING_CONTAINERS=$(docker ps --filter "name=aura-flow" --format "table {{.Names}}\t{{.Image}}\t{{.Status}}")
    if [ -n "$RUNNING_CONTAINERS" ]; then
        log "运行中的容器:"
        echo "$RUNNING_CONTAINERS"
    else
        log_warning "未发现运行中的 Aura Flow 容器"
    fi
}

# 备份当前配置
backup_current_config() {
    log "💾 备份当前配置..."
    
    if [ -f "$COMPOSE_FILE" ]; then
        cp "$COMPOSE_FILE" "$BACKUP_COMPOSE_FILE"
        log_success "当前配置已备份到: $BACKUP_COMPOSE_FILE"
    else
        log_warning "未找到 $COMPOSE_FILE，跳过备份"
    fi
}

# 拉取稳定版本镜像
pull_stable_image() {
    log "📥 拉取稳定版本镜像..."
    
    STABLE_IMAGE="$DOCKER_REGISTRY/$IMAGE_NAME:$STABLE_TAG"
    
    if docker pull "$STABLE_IMAGE"; then
        log_success "稳定版本镜像拉取成功: $STABLE_IMAGE"
    else
        log_error "稳定版本镜像拉取失败"
        exit 1
    fi
}

# 更新 Docker Compose 配置
update_compose_config() {
    log "🔧 更新 Docker Compose 配置..."
    
    if [ ! -f "$COMPOSE_FILE" ]; then
        log_error "未找到 $COMPOSE_FILE"
        exit 1
    fi
    
    # 备份原文件
    cp "$COMPOSE_FILE" "$COMPOSE_FILE.rollback.backup"
    
    # 更新镜像标签
    sed -i.bak "s|image:.*$IMAGE_NAME:.*|image: $DOCKER_REGISTRY/$IMAGE_NAME:$STABLE_TAG|g" "$COMPOSE_FILE"
    
    log_success "Docker Compose 配置已更新"
}

# 执行回滚
execute_rollback() {
    log "🔄 执行回滚..."
    
    # 停止当前服务
    log "停止当前服务..."
    docker-compose -f "$COMPOSE_FILE" down || {
        log_warning "停止服务时出现警告，继续执行..."
    }
    
    # 启动稳定版本
    log "启动稳定版本服务..."
    if docker-compose -f "$COMPOSE_FILE" up -d; then
        log_success "稳定版本服务启动成功"
    else
        log_error "稳定版本服务启动失败"
        log "尝试恢复原配置..."
        cp "$COMPOSE_FILE.rollback.backup" "$COMPOSE_FILE"
        exit 1
    fi
}

# 验证回滚结果
verify_rollback() {
    log "🔍 验证回滚结果..."
    
    # 等待服务启动
    sleep 10
    
    # 检查容器状态
    log "检查容器状态..."
    docker-compose -f "$COMPOSE_FILE" ps
    
    # 健康检查
    log "执行健康检查..."
    if curl -f http://localhost:3001/health > /dev/null 2>&1; then
        log_success "健康检查通过"
    else
        log_warning "健康检查失败，请手动验证服务状态"
    fi
    
    # 检查当前镜像
    CURRENT_IMAGE=$(docker-compose -f "$COMPOSE_FILE" config | grep "image:" | head -1 | cut -d' ' -f2)
    log "当前运行镜像: $CURRENT_IMAGE"
}

# Nginx 回滚
rollback_nginx() {
    log "🌐 执行 Nginx 回滚..."
    
    if [ ! -f "$NGINX_CONF" ]; then
        log_error "Nginx 配置文件不存在: $NGINX_CONF"
        return 1
    fi
    
    # 检查是否有备份配置
    if [ -f "$NGINX_CONF.backup" ]; then
        log "恢复 Nginx 备份配置..."
        cp "$NGINX_CONF.backup" "$NGINX_CONF"
        
        # 测试配置
        if nginx -t; then
            # 重新加载配置
            if nginx -s reload; then
                log_success "Nginx 配置回滚成功"
            else
                log_error "Nginx 重新加载失败"
                return 1
            fi
        else
            log_error "Nginx 配置测试失败"
            return 1
        fi
    else
        log_error "Nginx 备份配置文件不存在"
        return 1
    fi
}

# 数据库回滚
rollback_database() {
    log "🗄️  执行数据库回滚..."
    
    if [ ! -d "server" ]; then
        log_error "server 目录不存在"
        return 1
    fi
    
    cd server
    
    # 检查 Prisma 迁移状态
    if [ -d "prisma/migrations" ]; then
        log "检查数据库迁移状态..."
        pnpm prisma migrate status || {
            log_warning "无法检查迁移状态"
        }
        
        # 标记回滚的迁移
        log "标记回滚的迁移..."
        pnpm prisma migrate resolve --rolled-back || {
            log_warning "无法标记回滚的迁移"
        }
    fi
    
    cd ..
    log_success "数据库回滚完成"
}

# 一键切回 api_v1
switch_to_api_v1() {
    log "🔄 切换 Nginx upstream 到 api_v1..."
    
    if [ ! -f "$NGINX_CONF" ]; then
        log_error "Nginx 配置文件不存在: $NGINX_CONF"
        return 1
    fi
    
    # 备份当前配置
    cp "$NGINX_CONF" "$NGINX_CONF.rollback.backup"
    
    # 替换 upstream 为 api_v1
    sed -i.bak 's|proxy_pass http://api_v2|proxy_pass http://api_v1|g' "$NGINX_CONF"
    
    # 测试配置
    if nginx -t; then
        # 重新加载配置
        if nginx -s reload; then
            log_success "Nginx upstream 已切换到 api_v1"
        else
            log_error "Nginx 重新加载失败"
            return 1
        fi
    else
        log_error "Nginx 配置测试失败"
        return 1
    fi
}

# 生成回滚报告
generate_rollback_report() {
    log "📊 生成回滚报告..."
    
    REPORT_FILE="rollback_report_$(date +%Y%m%d_%H%M%S).txt"
    
    cat > "$REPORT_FILE" << EOF
========================================
生产环境回滚报告
========================================
回滚时间: $(date)
回滚原因: $ROLLBACK_REASON
目标镜像: $DOCKER_REGISTRY/$IMAGE_NAME:$STABLE_TAG

========================================
回滚前状态
========================================
$(if [ -f "$BACKUP_COMPOSE_FILE" ]; then echo "原配置已备份到: $BACKUP_COMPOSE_FILE"; fi)

========================================
回滚后状态
========================================
当前镜像: $(docker-compose -f "$COMPOSE_FILE" config | grep "image:" | head -1 | cut -d' ' -f2)
容器状态:
$(docker-compose -f "$COMPOSE_FILE" ps)

========================================
验证结果
========================================
健康检查: $(curl -f http://localhost:3001/health > /dev/null 2>&1 && echo "通过" || echo "失败")
服务状态: $(docker-compose -f "$COMPOSE_FILE" ps --services --filter "status=running" | wc -l) 个服务运行中

========================================
后续操作建议
========================================
1. 监控服务运行状态
2. 检查应用日志
3. 验证核心功能
4. 通知相关团队
5. 分析回滚原因

回滚完成时间: $(date)
EOF

    log_success "回滚报告已生成: $REPORT_FILE"
}

# 主函数
main() {
    log "🚀 开始生产环境回滚流程..."
    
    # 检查参数
    if [ -z "$ROLLBACK_REASON" ]; then
        ROLLBACK_REASON="手动回滚"
    fi
    
    log "回滚原因: $ROLLBACK_REASON"
    log "目标镜像: $DOCKER_REGISTRY/$IMAGE_NAME:$STABLE_TAG"
    
    # 确认回滚
    if [ "$AUTO_CONFIRM" != "true" ]; then
        echo ""
        log_warning "⚠️  即将执行生产环境回滚操作！"
        echo "回滚原因: $ROLLBACK_REASON"
        echo "目标镜像: $DOCKER_REGISTRY/$IMAGE_NAME:$STABLE_TAG"
        echo ""
        read -p "确认继续？(y/N): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            log "回滚操作已取消"
            exit 0
        fi
    fi
    
    # 根据回滚类型执行不同的步骤
    case "$ROLLBACK_TYPE" in
        "image")
            log "执行镜像回滚..."
            check_docker
            check_current_deployment
            backup_current_config
            pull_stable_image
            update_compose_config
            execute_rollback
            verify_rollback
            generate_rollback_report
            ;;
        "nginx")
            log "执行 Nginx 回滚..."
            rollback_nginx
            verify_rollback
            generate_rollback_report
            ;;
        "database")
            log "执行数据库回滚..."
            rollback_database
            generate_rollback_report
            ;;
        "upstream")
            log "执行 upstream 切换..."
            switch_to_api_v1
            verify_rollback
            generate_rollback_report
            ;;
        "full")
            log "执行完整回滚..."
            check_docker
            check_current_deployment
            backup_current_config
            pull_stable_image
            update_compose_config
            execute_rollback
            rollback_database
            verify_rollback
            generate_rollback_report
            ;;
        *)
            log_error "未知的回滚类型: $ROLLBACK_TYPE"
            log "支持的类型: image, nginx, database, upstream, full"
            exit 1
            ;;
    esac
    
    log_success "🎉 回滚操作完成！"
    log "📁 回滚报告: rollback_report_*.txt"
    log "💾 配置备份: $BACKUP_COMPOSE_FILE"
}

# 显示帮助信息
show_help() {
    echo "用法: $0 [选项]"
    echo ""
    echo "选项:"
    echo "  -r, --reason REASON     回滚原因"
    echo "  -t, --tag TAG          稳定版本标签 (默认: stable)"
    echo "  -f, --file FILE        Docker Compose 文件 (默认: docker-compose.prod.yml)"
    echo "  -T, --type TYPE        回滚类型: image, nginx, database, upstream, full (默认: image)"
    echo "  -y, --yes              自动确认，不询问"
    echo "  -h, --help             显示帮助信息"
    echo ""
    echo "环境变量:"
    echo "  DOCKER_REGISTRY         Docker 镜像仓库地址"
    echo "  IMAGE_NAME              镜像名称"
    echo "  ROLLBACK_REASON         回滚原因"
    echo "  AUTO_CONFIRM           自动确认 (true/false)"
    echo ""
    echo "示例:"
    echo "  $0 --reason '修复关键bug' --tag v1.2.3"
    echo "  $0 --reason '性能问题' --database --yes"
}

# 解析命令行参数
while [[ $# -gt 0 ]]; do
    case $1 in
        -r|--reason)
            ROLLBACK_REASON="$2"
            shift 2
            ;;
        -t|--tag)
            STABLE_TAG="$2"
            shift 2
            ;;
        -f|--file)
            COMPOSE_FILE="$2"
            shift 2
            ;;
        -T|--type)
            ROLLBACK_TYPE="$2"
            shift 2
            ;;
        -y|--yes)
            AUTO_CONFIRM="true"
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
main
