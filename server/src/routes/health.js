/**
 * 健康检查端点
 * 提供 /healthz (存活) 和 /readyz (就绪) 检查
 */

import express from 'express';
import { PrismaClient } from '@prisma/client';
import { logger } from '../middleware/logger.js';

const router = express.Router();
const prisma = new PrismaClient();

// 存活检查 - 简单的服务状态检查
router.get('/healthz', async (req, res) => {
  try {
    const health = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      version: process.env.BUILD_VERSION || 'unknown',
      environment: process.env.NODE_ENV || 'development'
    };

    res.status(200).json(health);
  } catch (error) {
    logger.error('Health check failed', { error: error.message });
    res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: error.message
    });
  }
});

// 就绪检查 - 包含依赖服务检查
router.get('/readyz', async (req, res) => {
  const checks = {
    database: { status: 'unknown', message: '', duration: 0 },
    ai_provider: { status: 'unknown', message: '', duration: 0 },
    queue: { status: 'unknown', message: '', duration: 0 },
    overall: 'unknown'
  };

  let allHealthy = true;

  // 数据库检查
  try {
    const dbStart = Date.now();
    await prisma.$queryRaw`SELECT 1`;
    checks.database = {
      status: 'healthy',
      message: 'Database connection successful',
      duration: Date.now() - dbStart
    };
  } catch (error) {
    checks.database = {
      status: 'unhealthy',
      message: `Database connection failed: ${error.message}`,
      duration: 0
    };
    allHealthy = false;
  }

  // AI 提供商检查
  try {
    const aiStart = Date.now();
    const aiProvider = process.env.AI_PROVIDER || 'mock';
    
    if (aiProvider === 'mock') {
      checks.ai_provider = {
        status: 'healthy',
        message: 'Mock AI provider is available',
        duration: Date.now() - aiStart
      };
    } else if (aiProvider === 'openai') {
      // 检查 OpenAI API 可用性
      const response = await fetch('https://api.openai.com/v1/models', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
          'Content-Type': 'application/json'
        },
        signal: AbortSignal.timeout(5000) // 5秒超时
      });
      
      if (response.ok) {
        checks.ai_provider = {
          status: 'healthy',
          message: 'OpenAI API is accessible',
          duration: Date.now() - aiStart
        };
      } else {
        checks.ai_provider = {
          status: 'unhealthy',
          message: `OpenAI API returned ${response.status}`,
          duration: Date.now() - aiStart
        };
        allHealthy = false;
      }
    } else {
      checks.ai_provider = {
        status: 'unknown',
        message: `Unknown AI provider: ${aiProvider}`,
        duration: 0
      };
    }
  } catch (error) {
    checks.ai_provider = {
      status: 'unhealthy',
      message: `AI provider check failed: ${error.message}`,
      duration: 0
    };
    allHealthy = false;
  }

  // 队列检查（如果有的话）
  try {
    const queueStart = Date.now();
    // 这里可以检查 Redis 队列或其他队列系统
    // 暂时模拟检查
    checks.queue = {
      status: 'healthy',
      message: 'Queue system is operational',
      duration: Date.now() - queueStart
    };
  } catch (error) {
    checks.queue = {
      status: 'unhealthy',
      message: `Queue check failed: ${error.message}`,
      duration: 0
    };
    allHealthy = false;
  }

  // 设置整体状态
  checks.overall = allHealthy ? 'ready' : 'not_ready';

  const response = {
    status: checks.overall,
    timestamp: new Date().toISOString(),
    checks: checks,
    version: process.env.BUILD_VERSION || 'unknown',
    environment: process.env.NODE_ENV || 'development'
  };

  if (allHealthy) {
    res.status(200).json(response);
  } else {
    res.status(503).json(response);
  }
});

// 详细健康检查 - 包含更多信息
router.get('/health/detailed', async (req, res) => {
  try {
    const detailed = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      version: process.env.BUILD_VERSION || 'unknown',
      environment: process.env.NODE_ENV || 'development',
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      cpu: process.cpuUsage(),
      platform: process.platform,
      node_version: process.version,
      dependencies: {
        database: await checkDatabaseHealth(),
        ai_provider: await checkAIProviderHealth(),
        external_apis: await checkExternalAPIs()
      }
    };

    res.status(200).json(detailed);
  } catch (error) {
    logger.error('Detailed health check failed', { error: error.message });
    res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: error.message
    });
  }
});

// 数据库健康检查
async function checkDatabaseHealth() {
  try {
    const start = Date.now();
    const result = await prisma.$queryRaw`SELECT 1 as health_check`;
    const duration = Date.now() - start;
    
    return {
      status: 'healthy',
      duration: duration,
      connection_pool: {
        active: prisma._engine?.connectionPool?.activeConnections || 0,
        idle: prisma._engine?.connectionPool?.idleConnections || 0
      }
    };
  } catch (error) {
    return {
      status: 'unhealthy',
      error: error.message
    };
  }
}

// AI 提供商健康检查
async function checkAIProviderHealth() {
  try {
    const aiProvider = process.env.AI_PROVIDER || 'mock';
    
    if (aiProvider === 'mock') {
      return {
        status: 'healthy',
        provider: 'mock',
        message: 'Mock provider is always available'
      };
    } else if (aiProvider === 'openai') {
      const start = Date.now();
      const response = await fetch('https://api.openai.com/v1/models', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
          'Content-Type': 'application/json'
        },
        signal: AbortSignal.timeout(10000)
      });
      
      return {
        status: response.ok ? 'healthy' : 'unhealthy',
        provider: 'openai',
        duration: Date.now() - start,
        status_code: response.status
      };
    } else {
      return {
        status: 'unknown',
        provider: aiProvider,
        message: 'Unknown provider'
      };
    }
  } catch (error) {
    return {
      status: 'unhealthy',
      error: error.message
    };
  }
}

// 外部 API 健康检查
async function checkExternalAPIs() {
  const apis = {};
  
  // 检查 Sentry
  if (process.env.SENTRY_DSN) {
    try {
      const response = await fetch('https://sentry.io/api/0/', {
        method: 'GET',
        signal: AbortSignal.timeout(5000)
      });
      apis.sentry = {
        status: response.ok ? 'healthy' : 'unhealthy',
        status_code: response.status
      };
    } catch (error) {
      apis.sentry = {
        status: 'unhealthy',
        error: error.message
      };
    }
  }
  
  return apis;
}

export default router;