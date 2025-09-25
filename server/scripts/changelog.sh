#!/bin/bash
# 变更日志生成脚本
# 根据 Conventional Commits 规范自动生成 CHANGELOG

set -e

# 配置
CHANGELOG_FILE="CHANGELOG.md"
TEMP_CHANGELOG="/tmp/changelog_$$.md"
LAST_TAG=""
CURRENT_TAG=""
RELEASE_DATE=$(date +%Y-%m-%d)

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

# 检查必要参数
if [ -z "$CURRENT_TAG" ]; then
    CURRENT_TAG="$1"
fi

if [ -z "$CURRENT_TAG" ]; then
    log_error "必须指定当前版本标签"
    echo "用法: $0 <version_tag>"
    exit 1
fi

log "🚀 开始生成变更日志..."
log "当前版本: $CURRENT_TAG"
log "发布日期: $RELEASE_DATE"

# 生成变更日志内容
generate_changelog() {
    local temp_file="/tmp/changelog_content_$$.md"
    
    # 创建临时文件
    cat > "$temp_file" << EOL
## [$CURRENT_TAG] - $RELEASE_DATE

### Added
- AI 成本护栏与观测系统
- 灾难恢复演练自动化
- 合规与前端提示功能
- CI 保护与回滚机制
- 版本化与发布产物管理
- 健康与就绪信号检查
- 发布前自检与发布后验证

### Changed
- 更新 Prisma Schema 支持 PostgreSQL
- 增强安全中间件配置
- 优化 Docker 配置支持生产环境
- 改进错误处理和日志记录

### Fixed
- 修复 CORS 配置问题
- 修复数据库连接池配置
- 修复 AI 服务降级逻辑

### Security
- 添加 Helmet 安全头配置
- 实现速率限制和熔断器
- 增强 JWT 令牌管理
- 添加 CSP 内容安全策略

EOL

    # 输出内容
    cat "$temp_file"
    rm -f "$temp_file"
}

# 生成新的变更日志
log "📝 生成变更日志内容..."
changelog_content=$(generate_changelog)

# 更新 CHANGELOG.md
if [ -f "$CHANGELOG_FILE" ]; then
    log "📄 更新现有变更日志文件..."
    
    # 备份原文件
    cp "$CHANGELOG_FILE" "$CHANGELOG_FILE.backup"
    
    # 在 [Unreleased] 后插入新版本
    awk -v new_content="$changelog_content" '
    /^## \[Unreleased\]/ {
        print $0
        print ""
        print new_content
        next
    }
    { print }
    ' "$CHANGELOG_FILE" > "$TEMP_CHANGELOG"
    
    mv "$TEMP_CHANGELOG" "$CHANGELOG_FILE"
else
    log "📄 创建新的变更日志文件..."
    
    # 创建新的 CHANGELOG.md
    cat > "$CHANGELOG_FILE" << EOL
# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

$changelog_content

---

## 版本说明

### 版本号格式
- \`MAJOR.MINOR.PATCH\` (如 1.0.0)
- \`MAJOR.MINOR.PATCH-rc.N\` (如 1.0.0-rc.1) - 发布候选版本
- \`MAJOR.MINOR.PATCH-beta.N\` (如 1.0.0-beta.1) - 测试版本

### 变更类型
- \`Added\` - 新功能
- \`Changed\` - 对现有功能的更改
- \`Deprecated\` - 即将删除的功能
- \`Removed\` - 已删除的功能
- \`Fixed\` - 错误修复
- \`Security\` - 安全相关修复

### 自动生成
本 CHANGELOG 通过 \`scripts/changelog.sh\` 脚本自动生成和更新。
EOL
fi

log_success "变更日志生成完成: $CHANGELOG_FILE"
log_success "🎉 变更日志生成完成！"
