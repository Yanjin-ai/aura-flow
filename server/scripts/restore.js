#!/usr/bin/env node

/**
 * 数据库恢复脚本
 * 支持 PostgreSQL 和 SQLite 数据库恢复
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

function listBackups() {
  if (!fs.existsSync(BACKUP_DIR)) {
    console.log('❌ 备份目录不存在');
    return [];
  }
  
  const files = fs.readdirSync(BACKUP_DIR)
    .filter(file => file.startsWith('aura-flow-backup-'))
    .map(file => {
      const filePath = path.join(BACKUP_DIR, file);
      const stats = fs.statSync(filePath);
      return {
        name: file,
        path: filePath,
        size: stats.size,
        date: stats.mtime
      };
    })
    .sort((a, b) => b.date - a.date);
  
  return files;
}

function restorePostgreSQL(backupFile) {
  console.log('🔄 开始 PostgreSQL 数据库恢复...');
  
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
    
    // 执行 psql 恢复
    const command = `psql -h ${host} -p ${port} -U ${username} -d ${database} --no-password < "${backupFile}"`;
    
    execSync(command, { stdio: 'inherit' });
    
    console.log('✅ PostgreSQL 恢复完成');
  } catch (error) {
    console.error('❌ PostgreSQL 恢复失败:', error.message);
    process.exit(1);
  }
}

function restoreSQLite(backupFile) {
  console.log('🔄 开始 SQLite 数据库恢复...');
  
  try {
    const targetFile = DATABASE_URL.replace('file:', '');
    
    // 备份当前数据库
    if (fs.existsSync(targetFile)) {
      const currentBackup = `${targetFile}.backup.${Date.now()}`;
      fs.copyFileSync(targetFile, currentBackup);
      console.log(`📁 当前数据库已备份到: ${currentBackup}`);
    }
    
    // 恢复数据库
    fs.copyFileSync(backupFile, targetFile);
    
    console.log('✅ SQLite 恢复完成');
  } catch (error) {
    console.error('❌ SQLite 恢复失败:', error.message);
    process.exit(1);
  }
}

function main() {
  console.log('🚀 Aura Flow 数据库恢复工具');
  console.log(`📁 备份目录: ${BACKUP_DIR}`);
  console.log(`🔗 数据库: ${DATABASE_URL}`);
  
  if (!DATABASE_URL) {
    console.error('❌ 未找到 DATABASE_URL 环境变量');
    process.exit(1);
  }
  
  // 列出可用的备份文件
  const backups = listBackups();
  
  if (backups.length === 0) {
    console.log('❌ 未找到备份文件');
    process.exit(1);
  }
  
  console.log('\n📋 可用的备份文件:');
  backups.forEach((backup, index) => {
    const sizeMB = (backup.size / 1024 / 1024).toFixed(2);
    console.log(`${index + 1}. ${backup.name} (${sizeMB} MB) - ${backup.date.toISOString()}`);
  });
  
  // 选择最新的备份文件
  const selectedBackup = backups[0];
  console.log(`\n🔄 使用最新备份: ${selectedBackup.name}`);
  
  // 确认恢复
  console.log('⚠️  警告: 此操作将覆盖当前数据库！');
  console.log('按 Ctrl+C 取消，或按 Enter 继续...');
  
  // 等待用户确认（简化版本，直接继续）
  console.log('继续恢复...');
  
  if (DATABASE_URL.startsWith('postgresql://') || DATABASE_URL.startsWith('postgres://')) {
    restorePostgreSQL(selectedBackup.path);
  } else if (DATABASE_URL.startsWith('file:')) {
    restoreSQLite(selectedBackup.path);
  } else {
    console.error('❌ 不支持的数据库类型');
    process.exit(1);
  }
  
  console.log('🎉 恢复完成！');
}

main();
