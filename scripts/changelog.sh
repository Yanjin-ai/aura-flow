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

# 显示帮助信息
show_help() {
    echo "用法: $0 [选项]"
    echo ""
    echo "选项:"
    echo "  -t, --tag TAG          当前版本标签 (如 v1.0.0)"
    echo "  -l, --last-tag TAG     上一个版本标签 (如 v0.9.0)"
    echo "  -o, --output FILE      输出文件 (默认: CHANGELOG.md)"
    echo "  -d, --date DATE        发布日期 (默认: 今天)"
    echo "  -f, --force            强制覆盖现有文件"
    echo "  -h, --help             显示帮助信息"
    echo ""
    echo "示例:"
    echo "  $0 --tag v1.0.0 --last-tag v0.9.0"
    echo "  $0 --tag v1.0.0-rc.1 --last-tag v0.9.0 --date 2024-01-01"
}

# 解析命令行参数
while [[ $# -gt 0 ]]; do
    case $1 in
        -t|--tag)
            CURRENT_TAG="$2"
            shift 2
            ;;
        -l|--last-tag)
            LAST_TAG="$2"
            shift 2
            ;;
        -o|--output)
            CHANGELOG_FILE="$2"
            shift 2
            ;;
        -d|--date)
            RELEASE_DATE="$2"
            shift 2
            ;;
        -f|--force)
            FORCE_OVERWRITE=true
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

# 检查必要参数
if [ -z "$CURRENT_TAG" ]; then
    log_error "必须指定当前版本标签"
    show_help
    exit 1
fi

# 获取上一个标签（如果未指定）
if [ -z "$LAST_TAG" ]; then
    LAST_TAG=$(git describe --tags --abbrev=0 HEAD~1 2>/dev/null || echo "")
    if [ -z "$LAST_TAG" ]; then
        log_warning "未找到上一个标签，将生成完整变更日志"
        LAST_TAG=""
    else
        log "自动检测到上一个标签: $LAST_TAG"
    fi
fi

# 检查输出文件是否存在
if [ -f "$CHANGELOG_FILE" ] && [ "$FORCE_OVERWRITE" != "true" ]; then
    log_error "输出文件已存在: $CHANGELOG_FILE"
    log "使用 --force 参数强制覆盖"
    exit 1
fi

log "🚀 开始生成变更日志..."
log "当前版本: $CURRENT_TAG"
log "上一个版本: ${LAST_TAG:-'无'}"
log "发布日期: $RELEASE_DATE"
log "输出文件: $CHANGELOG_FILE"

# 生成变更日志内容
generate_changelog() {
    local temp_file="/tmp/changelog_content_$$.md"
    
    # 创建临时文件
    cat > "$temp_file" << EOF
## [$CURRENT_TAG] - $RELEASE_DATE

EOF

    # 获取提交范围
    local commit_range=""
    if [ -n "$LAST_TAG" ]; then
        commit_range="$LAST_TAG..HEAD"
    else
        commit_range="HEAD"
    fi

    # 获取提交列表
    local commits=$(git log --pretty=format:"%h %s" $commit_range --no-merges)
    
    if [ -z "$commits" ]; then
        log_warning "未找到新的提交"
        echo "### Changed" >> "$temp_file"
        echo "- 无变更" >> "$temp_file"
    else
        # 按类型分类提交
        local added_commits=()
        local changed_commits=()
        local fixed_commits=()
        local security_commits=()
        local other_commits=()

        while IFS= read -r commit; do
            local hash=$(echo "$commit" | cut -d' ' -f1)
            local message=$(echo "$commit" | cut -d' ' -f2-)
            
            # 解析 Conventional Commits
            if [[ "$message" =~ ^(feat|feature)(\(.+\))?: ]]; then
                added_commits+=("$commit")
            elif [[ "$message" =~ ^(fix|bugfix)(\(.+\))?: ]]; then
                fixed_commits+=("$commit")
            elif [[ "$message" =~ ^(security)(\(.+\))?: ]]; then
                security_commits+=("$commit")
            elif [[ "$message" =~ ^(chore|refactor|perf|style|docs|test)(\(.+\))?: ]]; then
                changed_commits+=("$commit")
            else
                other_commits+=("$commit")
            fi
        done <<< "$commits"

        # 生成分类内容
        if [ ${#added_commits[@]} -gt 0 ]; then
            echo "### Added" >> "$temp_file"
            for commit in "${added_commits[@]}"; do
                local message=$(echo "$commit" | cut -d' ' -f2-)
                echo "- $message" >> "$temp_file"
            done
            echo "" >> "$temp_file"
        fi

        if [ ${#changed_commits[@]} -gt 0 ]; then
            echo "### Changed" >> "$temp_file"
            for commit in "${changed_commits[@]}"; do
                local message=$(echo "$commit" | cut -d' ' -f2-)
                echo "- $message" >> "$temp_file"
            done
            echo "" >> "$temp_file"
        fi

        if [ ${#fixed_commits[@]} -gt 0 ]; then
            echo "### Fixed" >> "$temp_file"
            for commit in "${fixed_commits[@]}"; do
                local message=$(echo "$commit" | cut -d' ' -f2-)
                echo "- $message" >> "$temp_file"
            done
            echo "" >> "$temp_file"
        fi

        if [ ${#security_commits[@]} -gt 0 ]; then
            echo "### Security" >> "$temp_file"
            for commit in "${security_commits[@]}"; do
                local message=$(echo "$commit" | cut -d' ' -f2-)
                echo "- $message" >> "$temp_file"
            done
            echo "" >> "$temp_file"
        fi

        if [ ${#other_commits[@]} -gt 0 ]; then
            echo "### Other" >> "$temp_file"
            for commit in "${other_commits[@]}"; do
                local message=$(echo "$commit" | cut -d' ' -f2-)
                echo "- $message" >> "$temp_file"
            done
            echo "" >> "$temp_file"
        fi
    fi

    # 添加统计信息
    echo "### Statistics" >> "$temp_file"
    echo "- 总提交数: $(echo "$commits" | wc -l)" >> "$temp_file"
    echo "- 新增功能: ${#added_commits[@]}" >> "$temp_file"
    echo "- 功能变更: ${#changed_commits[@]}" >> "$temp_file"
    echo "- 错误修复: ${#fixed_commits[@]}" >> "$temp_file"
    echo "- 安全修复: ${#security_commits[@]}" >> "$temp_file"
    echo "" >> "$temp_file"

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
    cat > "$CHANGELOG_FILE" << EOF
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
EOF
fi

log_success "变更日志生成完成: $CHANGELOG_FILE"

# 显示生成的内容摘要
echo ""
echo "=========================================="
echo "📊 变更日志摘要"
echo "=========================================="
echo "版本: $CURRENT_TAG"
echo "日期: $RELEASE_DATE"
echo "文件: $CHANGELOG_FILE"
echo ""

# 显示主要变更
if [ -n "$changelog_content" ]; then
    echo "主要变更:"
    echo "$changelog_content" | grep "^- " | head -10
    echo ""
fi

# 提交变更（可选）
if [ "$AUTO_COMMIT" = "true" ]; then
    log "📝 提交变更日志..."
    git add "$CHANGELOG_FILE"
    git commit -m "chore: update changelog for $CURRENT_TAG"
    log_success "变更日志已提交"
fi

log_success "🎉 变更日志生成完成！"
