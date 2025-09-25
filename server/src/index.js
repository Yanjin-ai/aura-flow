/**
 * Aura Flow 后端服务入口文件
 * 提供 RESTful API 接口，支持任务管理、AI 洞察生成等功能
 */

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';

// 导入路由
import authRoutes from './routes/auth.js';
import taskRoutes from './routes/tasks.js';
import insightRoutes from './routes/insights.js';
import reflectionRoutes from './routes/reflections.js';
import healthRoutes from './routes/health.js';
import dataManagementRoutes from './routes/dataManagement.js';
import monitoringRoutes from './routes/monitoring.js';
import metricsRoutes from './routes/metrics.js';

// 导入中间件
import { errorHandler } from './middleware/errorHandler.js';
import { logger } from './middleware/logger.js';
import { 
  generalLimiter, 
  loginLimiter, 
  registerLimiter, 
  passwordResetLimiter,
  uploadLimiter 
} from './middleware/rateLimiter.js';
import { aiCostControl } from './middleware/aiCostControl.js';

// 导入新的安全中间件
import {
  helmetConfig,
  corsConfig,
  generalRateLimit,
  loginRateLimit,
  registerRateLimit,
  passwordResetRateLimit,
  uploadRateLimit,
  requestIdMiddleware,
  securityHeadersMiddleware
} from './middleware/security.js';

// 加载环境变量
dotenv.config();

// 初始化 Prisma 客户端
const prisma = new PrismaClient();

// 创建 Express 应用
const app = express();
const PORT = process.env.PORT || 3001;

// 信任代理（生产环境）
if (process.env.TRUST_PROXY === 'true') {
  app.set('trust proxy', 1);
}

// 请求 ID 中间件
app.use(requestIdMiddleware);

// 安全响应头中间件
app.use(securityHeadersMiddleware);

// Helmet 安全头配置
app.use(helmetConfig);

// CORS 配置
app.use(corsConfig);

// 应用通用速率限制
app.use(generalRateLimit);

// 应用 AI 成本控制中间件
app.use(aiCostControl);

// 压缩响应
app.use(compression());

// 请求日志
app.use(morgan('combined', {
  stream: {
    write: (message) => logger.info(message.trim())
  }
}));

// 解析 JSON 请求体
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// 健康检查路由（不需要认证）
app.use('/health', healthRoutes);

// 监控路由
app.use('/monitoring', monitoringRoutes);
app.use('/metrics', metricsRoutes);

// API 路由 - 应用特定速率限制
app.use('/auth/login', loginRateLimit);
app.use('/auth/register', registerRateLimit);
app.use('/auth/password-reset', passwordResetRateLimit);
app.use('/auth', authRoutes);
app.use('/tasks', taskRoutes);
app.use('/insights', insightRoutes);
app.use('/reflections', reflectionRoutes);
app.use('/data-management', dataManagementRoutes);
app.use('/upload', uploadRateLimit);

// 根路径
app.get('/', (req, res) => {
  res.json({
    message: 'Aura Flow API 服务正在运行',
    version: process.env.VITE_BUILD_VERSION || '1.0.0',
    environment: process.env.NODE_ENV || 'development',
    timestamp: new Date().toISOString()
  });
});

// 404 处理
app.use('*', (req, res) => {
  res.status(404).json({
    error: '接口不存在',
    path: req.originalUrl,
    method: req.method
  });
});

// 全局错误处理
app.use(errorHandler);

// 优雅关闭处理
process.on('SIGTERM', async () => {
  logger.info('收到 SIGTERM 信号，开始优雅关闭...');
  await prisma.$disconnect();
  process.exit(0);
});

process.on('SIGINT', async () => {
  logger.info('收到 SIGINT 信号，开始优雅关闭...');
  await prisma.$disconnect();
  process.exit(0);
});

// 启动服务器
app.listen(PORT, () => {
  logger.info(`🚀 Aura Flow 后端服务已启动`);
  logger.info(`📍 服务地址: http://localhost:${PORT}`);
  logger.info(`🌍 环境: ${process.env.NODE_ENV || 'development'}`);
  logger.info(`📊 数据库: ${process.env.DATABASE_URL || 'file:./dev.db'}`);
});

// 导出应用实例（用于测试）
export default app;
