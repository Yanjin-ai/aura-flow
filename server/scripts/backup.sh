#!/bin/bash
# PostgreSQL Database Backup Script with S3 Support

set -e

# Load environment variables from server/.env
if [ -f "$(dirname "$0")/../.env" ]; then
  export $(grep -v '^#' "$(dirname "$0")/../.env" | xargs)
fi

# Database configuration
DB_USER=${DB_USER:-aura_flow_user}
DB_NAME=${DB_NAME:-aura_flow}
DB_HOST=${DB_HOST:-localhost}
DB_PORT=${DB_PORT:-5432}

# Backup configuration
BACKUP_DIR=${BACKUP_DIR:-$(dirname "$0")/../backups}
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/$DB_NAME-$TIMESTAMP.sql"
COMPRESSED_FILE="$BACKUP_FILE.gz"

# S3 configuration
S3_BUCKET=${S3_BUCKET:-}
S3_PREFIX=${S3_PREFIX:-backups/}
S3_REGION=${S3_REGION:-us-east-1}

# Retention configuration
RETENTION_DAYS=${BACKUP_RETENTION_DAYS:-30}

echo "🚀 Starting PostgreSQL backup for database '$DB_NAME' on host '$DB_HOST:$DB_PORT'..."

# Create backup directory if it doesn't exist
mkdir -p "$BACKUP_DIR"

# Perform the backup
echo "📦 Creating database backup..."
PGPASSWORD=$DB_PASSWORD pg_dump -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" --verbose --no-password > "$BACKUP_FILE"

if [ $? -ne 0 ]; then
  echo "❌ Database backup failed!"
  exit 1
fi

# Compress the backup
echo "🗜️  Compressing backup..."
gzip "$BACKUP_FILE"
BACKUP_FILE="$COMPRESSED_FILE"

# Calculate SHA256 checksum
echo "🔍 Calculating checksum..."
CHECKSUM=$(sha256sum "$BACKUP_FILE" | cut -d' ' -f1)
echo "$CHECKSUM" > "$BACKUP_FILE.sha256"

# Upload to S3 if configured
if [ -n "$S3_BUCKET" ]; then
  echo "☁️  Uploading to S3..."
  
  # Check if AWS CLI is available
  if ! command -v aws &> /dev/null; then
    echo "⚠️  AWS CLI not found, skipping S3 upload"
  else
    # Upload backup file
    aws s3 cp "$BACKUP_FILE" "s3://$S3_BUCKET/$S3_PREFIX$(basename "$BACKUP_FILE")" --region "$S3_REGION"
    
    # Upload checksum file
    aws s3 cp "$BACKUP_FILE.sha256" "s3://$S3_BUCKET/$S3_PREFIX$(basename "$BACKUP_FILE.sha256")" --region "$S3_REGION"
    
    echo "✅ Backup uploaded to S3: s3://$S3_BUCKET/$S3_PREFIX$(basename "$BACKUP_FILE")"
  fi
fi

# Clean up old backups
echo "🧹 Cleaning up old backups..."
find "$BACKUP_DIR" -name "$DB_NAME-*.sql.gz" -mtime +$RETENTION_DAYS -delete
find "$BACKUP_DIR" -name "$DB_NAME-*.sql.gz.sha256" -mtime +$RETENTION_DAYS -delete

# Clean up S3 old backups if configured
if [ -n "$S3_BUCKET" ] && command -v aws &> /dev/null; then
  echo "🧹 Cleaning up old S3 backups..."
  CUTOFF_DATE=$(date -d "$RETENTION_DAYS days ago" +%Y%m%d)
  
  # List and delete old backups
  aws s3 ls "s3://$S3_BUCKET/$S3_PREFIX" --region "$S3_REGION" | while read -r line; do
    FILE_DATE=$(echo "$line" | awk '{print $1}' | tr -d '-')
    FILE_NAME=$(echo "$line" | awk '{print $4}')
    
    if [ "$FILE_DATE" -lt "$CUTOFF_DATE" ] && [[ "$FILE_NAME" == $DB_NAME-*.sql.gz* ]]; then
      echo "Deleting old backup: $FILE_NAME"
      aws s3 rm "s3://$S3_BUCKET/$S3_PREFIX$FILE_NAME" --region "$S3_REGION"
    fi
  done
fi

# Verify backup integrity
echo "🔍 Verifying backup integrity..."
if [ -f "$BACKUP_FILE" ]; then
  BACKUP_SIZE=$(stat -c%s "$BACKUP_FILE")
  echo "📊 Backup size: $BACKUP_SIZE bytes"
  
  # Test decompression
  if gunzip -t "$BACKUP_FILE"; then
    echo "✅ Backup integrity verified"
  else
    echo "❌ Backup integrity check failed!"
    exit 1
  fi
fi

echo "🎉 Backup completed successfully!"
echo "📁 Local backup: $BACKUP_FILE"
echo "🔐 Checksum: $CHECKSUM"
echo "📅 Timestamp: $TIMESTAMP"

# Log backup completion
echo "$(date): Backup completed - $BACKUP_FILE (Size: $BACKUP_SIZE bytes, Checksum: $CHECKSUM)" >> "$BACKUP_DIR/backup.log"