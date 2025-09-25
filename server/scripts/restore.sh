#!/bin/bash
# PostgreSQL 数据库恢复脚本
# 用法: ./restore.sh <backup_file>

set -e

# 检查参数
if [ $# -eq 0 ]; then
    echo "用法: $0 <backup_file>"
    echo "示例: $0 backups/backup_20241220_143022.sql.gz"
    exit 1
fi

BACKUP_FILE="$1"

# 检查备份文件是否存在
if [ ! -f "$BACKUP_FILE" ]; then
    echo "错误: 备份文件不存在: $BACKUP_FILE"
    exit 1
fi

# 检查环境变量
if [ -z "$DATABASE_URL" ]; then
    echo "错误: 未设置 DATABASE_URL 环境变量"
    exit 1
fi

# 解析数据库连接信息
DB_URL_REGEX="postgresql://([^:]+):([^@]+)@([^:]+):([^/]+)/(.+)"
if [[ $DATABASE_URL =~ $DB_URL_REGEX ]]; then
    DB_USER="${BASH_REMATCH[1]}"
    DB_PASS="${BASH_REMATCH[2]}"
    DB_HOST="${BASH_REMATCH[3]}"
    DB_PORT="${BASH_REMATCH[4]}"
    DB_NAME="${BASH_REMATCH[5]}"
else
    echo "错误: 无法解析 DATABASE_URL"
    exit 1
fi

echo "开始恢复数据库..."
echo "数据库: $DB_NAME"
echo "主机: $DB_HOST:$DB_PORT"
echo "备份文件: $BACKUP_FILE"

# 确认操作
read -p "⚠️  这将完全替换当前数据库，是否继续？(y/N): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "操作已取消"
    exit 0
fi

# 检查备份文件类型并恢复
if [[ "$BACKUP_FILE" == *.gz ]]; then
    echo "检测到压缩备份文件，正在解压并恢复..."
    gunzip -c "$BACKUP_FILE" | PGPASSWORD="$DB_PASS" psql \
        --host="$DB_HOST" \
        --port="$DB_PORT" \
        --username="$DB_USER" \
        --dbname="postgres" \
        --verbose
else
    echo "检测到未压缩备份文件，正在恢复..."
    PGPASSWORD="$DB_PASS" psql \
        --host="$DB_HOST" \
        --port="$DB_PORT" \
        --username="$DB_USER" \
        --dbname="postgres" \
        --verbose \
        --file="$BACKUP_FILE"
fi

# 检查恢复是否成功
if [ $? -eq 0 ]; then
    echo "✅ 数据库恢复成功"
    
    # 验证恢复结果
    echo "正在验证恢复结果..."
    PGPASSWORD="$DB_PASS" psql \
        --host="$DB_HOST" \
        --port="$DB_PORT" \
        --username="$DB_USER" \
        --dbname="$DB_NAME" \
        --command="SELECT COUNT(*) as user_count FROM users;"
    
    echo "✅ 恢复验证完成"
else
    echo "❌ 数据库恢复失败"
    exit 1
fi

echo "恢复完成！"
