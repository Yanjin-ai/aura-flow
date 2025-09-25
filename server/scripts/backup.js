#!/usr/bin/env node

/**
 * 数据库备份脚本
 * 支持 PostgreSQL 和 SQLite 数据库备份
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 加载环境变量
import dotenv from 'dotenv';
dotenv.config({ path: path.join(__dirname, '../.env') });

const DATABASE_URL = process.env.DATABASE_URL;
const BACKUP_DIR = process.env.BACKUP_DIR || path.join(__dirname, '../backups');

// 确保备份目录存在
if (!fs.existsSync(BACKUP_DIR)) {
  fs.mkdirSync(BACKUP_DIR, { recursive: true });
}

function getBackupFileName() {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  return `aura-flow-backup-${timestamp}`;
}

function backupPostgreSQL() {
  console.log('🔄 开始 PostgreSQL 数据库备份...');
  
  const backupFile = path.join(BACKUP_DIR, `${getBackupFileName()}.sql`);
  
  try {
    // 解析 DATABASE_URL
    const url = new URL(DATABASE_URL);
    const host = url.hostname;
    const port = url.port || '5432';
    const database = url.pathname.slice(1);
    const username = url.username;
    const password = url.password;
    
    // 设置环境变量
    process.env.PGPASSWORD = password;
    
    // 执行 pg_dump
    const command = `pg_dump -h ${host} -p ${port} -U ${username} -d ${database} --no-password --verbose --clean --if-exists > "${backupFile}"`;
    
    execSync(command, { stdio: 'inherit' });
    
    console.log(`✅ PostgreSQL 备份完成: ${backupFile}`);
    return backupFile;
  } catch (error) {
    console.error('❌ PostgreSQL 备份失败:', error.message);
    process.exit(1);
  }
}

function backupSQLite() {
  console.log('🔄 开始 SQLite 数据库备份...');
  
  const backupFile = path.join(BACKUP_DIR, `${getBackupFileName()}.db`);
  
  try {
    // 简单的文件复制
    fs.copyFileSync(DATABASE_URL.replace('file:', ''), backupFile);
    
    console.log(`✅ SQLite 备份完成: ${backupFile}`);
    return backupFile;
  } catch (error) {
    console.error('❌ SQLite 备份失败:', error.message);
    process.exit(1);
  }
}

function main() {
  console.log('🚀 Aura Flow 数据库备份工具');
  console.log(`📁 备份目录: ${BACKUP_DIR}`);
  console.log(`🔗 数据库: ${DATABASE_URL}`);
  
  if (!DATABASE_URL) {
    console.error('❌ 未找到 DATABASE_URL 环境变量');
    process.exit(1);
  }
  
  let backupFile;
  
  if (DATABASE_URL.startsWith('postgresql://') || DATABASE_URL.startsWith('postgres://')) {
    backupFile = backupPostgreSQL();
  } else if (DATABASE_URL.startsWith('file:')) {
    backupFile = backupSQLite();
  } else {
    console.error('❌ 不支持的数据库类型');
    process.exit(1);
  }
  
  // 显示备份文件信息
  const stats = fs.statSync(backupFile);
  console.log(`📊 备份文件大小: ${(stats.size / 1024 / 1024).toFixed(2)} MB`);
  console.log(`📅 备份时间: ${stats.mtime.toISOString()}`);
  
  console.log('🎉 备份完成！');
}

main();
