#!/usr/bin/env node
/**
 * 数据保留与清理脚本
 * 按 GDPR 要求和成本控制清理过期数据
 */

import { PrismaClient } from '@prisma/client';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { logger } from '../src/middleware/logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 环境变量配置
const LOGS_RETENTION_DAYS = parseInt(process.env.LOGS_RETENTION_DAYS || '30', 10);
const AI_USAGE_RETENTION_DAYS = parseInt(process.env.AI_USAGE_RETENTION_DAYS || '90', 10);
const LOGS_DIR = process.env.LOGS_DIR || path.join(__dirname, '../logs');
const DRY_RUN = process.env.DRY_RUN === 'true';

const prisma = new PrismaClient();

// 统计信息
const stats = {
  logsDeleted: 0,
  aiUsageDeleted: 0,
  filesCompressed: 0,
  filesDeleted: 0,
  errors: 0,
  startTime: new Date()
};

/**
 * 清理结构化日志表
 */
async function cleanupStructuredLogs() {
  try {
    logger.info('开始清理结构化日志...');
    
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - LOGS_RETENTION_DAYS);
    
    // 检查是否有日志表（这里假设有一个 logs 表，实际项目中需要根据实际情况调整）
    const tableExists = await prisma.$queryRaw`
      SELECT name FROM sqlite_master 
      WHERE type='table' AND name='logs'
    `.catch(() => null);
    
    if (tableExists && tableExists.length > 0) {
      const result = await prisma.$executeRaw`
        DELETE FROM logs 
        WHERE created_at < ${cutoffDate}
      `;
      
      stats.logsDeleted = result;
      logger.info(`清理了 ${result} 条结构化日志记录`);
    } else {
      logger.info('未找到结构化日志表，跳过清理');
    }
  } catch (error) {
    logger.error('清理结构化日志失败:', error);
    stats.errors++;
  }
}

/**
 * 清理 AI 使用记录
 */
async function cleanupAiUsage() {
  try {
    logger.info('开始清理 AI 使用记录...');
    
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - AI_USAGE_RETENTION_DAYS);
    
    // 分批删除，避免一次性删除过多数据
    const batchSize = 1000;
    let totalDeleted = 0;
    
    while (true) {
      const result = await prisma.aiUsage.deleteMany({
        where: {
          created_at: {
            lt: cutoffDate
          }
        },
        take: batchSize
      });
      
      if (result.count === 0) {
        break;
      }
      
      totalDeleted += result.count;
      logger.info(`已删除 ${totalDeleted} 条 AI 使用记录...`);
      
      // 避免阻塞数据库
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    stats.aiUsageDeleted = totalDeleted;
    logger.info(`清理了 ${totalDeleted} 条 AI 使用记录`);
  } catch (error) {
    logger.error('清理 AI 使用记录失败:', error);
    stats.errors++;
  }
}

/**
 * 清理日志文件
 */
async function cleanupLogFiles() {
  try {
    logger.info('开始清理日志文件...');
    
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - LOGS_RETENTION_DAYS);
    
    // 检查日志目录是否存在
    try {
      await fs.access(LOGS_DIR);
    } catch {
      logger.info('日志目录不存在，跳过文件清理');
      return;
    }
    
    const files = await fs.readdir(LOGS_DIR);
    let compressedCount = 0;
    let deletedCount = 0;
    
    for (const file of files) {
      const filePath = path.join(LOGS_DIR, file);
      const stats = await fs.stat(filePath);
      
      // 跳过目录
      if (stats.isDirectory()) {
        continue;
      }
      
      // 检查文件修改时间
      if (stats.mtime < cutoffDate) {
        if (file.endsWith('.log') && !file.endsWith('.gz')) {
          // 压缩日志文件
          if (!DRY_RUN) {
            const { exec } = await import('child_process');
            const { promisify } = await import('util');
            const execAsync = promisify(exec);
            
            try {
              await execAsync(`gzip "${filePath}"`);
              compressedCount++;
              logger.info(`压缩日志文件: ${file}`);
            } catch (error) {
              logger.error(`压缩日志文件失败 ${file}:`, error);
            }
          } else {
            compressedCount++;
            logger.info(`[DRY RUN] 将压缩日志文件: ${file}`);
          }
        } else if (file.endsWith('.gz')) {
          // 删除压缩的日志文件
          if (!DRY_RUN) {
            await fs.unlink(filePath);
            deletedCount++;
            logger.info(`删除压缩日志文件: ${file}`);
          } else {
            deletedCount++;
            logger.info(`[DRY RUN] 将删除压缩日志文件: ${file}`);
          }
        }
      }
    }
    
    stats.filesCompressed = compressedCount;
    stats.filesDeleted = deletedCount;
    logger.info(`压缩了 ${compressedCount} 个日志文件，删除了 ${deletedCount} 个压缩文件`);
  } catch (error) {
    logger.error('清理日志文件失败:', error);
    stats.errors++;
  }
}

/**
 * 清理临时文件
 */
async function cleanupTempFiles() {
  try {
    logger.info('开始清理临时文件...');
    
    const tempDirs = [
      path.join(__dirname, '../temp'),
      path.join(__dirname, '../uploads/temp'),
      '/tmp/aura-flow'
    ];
    
    for (const tempDir of tempDirs) {
      try {
        await fs.access(tempDir);
        const files = await fs.readdir(tempDir);
        
        for (const file of files) {
          const filePath = path.join(tempDir, file);
          const fileStats = await fs.stat(filePath);
          
          // 删除超过 7 天的临时文件
          const sevenDaysAgo = new Date();
          sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
          
          if (fileStats.mtime < sevenDaysAgo) {
            if (!DRY_RUN) {
              await fs.unlink(filePath);
              logger.info(`删除临时文件: ${file}`);
            } else {
              logger.info(`[DRY RUN] 将删除临时文件: ${file}`);
            }
          }
        }
      } catch {
        // 目录不存在，跳过
        continue;
      }
    }
  } catch (error) {
    logger.error('清理临时文件失败:', error);
    stats.errors++;
  }
}

/**
 * 生成清理报告
 */
function generateReport() {
  const endTime = new Date();
  const duration = endTime - stats.startTime;
  
  const report = {
    timestamp: endTime.toISOString(),
    duration: `${duration}ms`,
    dryRun: DRY_RUN,
    retention: {
      logsRetentionDays: LOGS_RETENTION_DAYS,
      aiUsageRetentionDays: AI_USAGE_RETENTION_DAYS
    },
    results: {
      logsDeleted: stats.logsDeleted,
      aiUsageDeleted: stats.aiUsageDeleted,
      filesCompressed: stats.filesCompressed,
      filesDeleted: stats.filesDeleted,
      errors: stats.errors
    }
  };
  
  return report;
}

/**
 * 主函数
 */
async function main() {
  try {
    logger.info('开始数据保留清理任务...');
    logger.info(`保留策略: 日志 ${LOGS_RETENTION_DAYS} 天, AI 使用记录 ${AI_USAGE_RETENTION_DAYS} 天`);
    logger.info(`运行模式: ${DRY_RUN ? 'DRY RUN' : '实际执行'}`);
    
    // 执行清理任务
    await cleanupStructuredLogs();
    await cleanupAiUsage();
    await cleanupLogFiles();
    await cleanupTempFiles();
    
    // 生成报告
    const report = generateReport();
    
    logger.info('数据保留清理任务完成');
    logger.info('清理结果:', report);
    
    // 输出 JSON 格式报告（供 CI 使用）
    console.log(JSON.stringify(report, null, 2));
    
    // 如果有错误，退出码为 1
    if (stats.errors > 0) {
      process.exit(1);
    }
    
  } catch (error) {
    logger.error('数据保留清理任务失败:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// 处理命令行参数
if (process.argv.includes('--help') || process.argv.includes('-h')) {
  console.log(`
数据保留与清理脚本

用法: node retention.js [选项]

选项:
  --dry-run          仅模拟执行，不实际删除数据
  --help, -h         显示帮助信息

环境变量:
  LOGS_RETENTION_DAYS        日志保留天数 (默认: 30)
  AI_USAGE_RETENTION_DAYS    AI 使用记录保留天数 (默认: 90)
  LOGS_DIR                   日志目录路径 (默认: ../logs)
  DRY_RUN                    是否仅模拟执行 (默认: false)

示例:
  node retention.js
  node retention.js --dry-run
  DRY_RUN=true node retention.js
  `);
  process.exit(0);
}

if (process.argv.includes('--dry-run')) {
  process.env.DRY_RUN = 'true';
}

// 运行主函数
main().catch(error => {
  logger.error('脚本执行失败:', error);
  process.exit(1);
});
