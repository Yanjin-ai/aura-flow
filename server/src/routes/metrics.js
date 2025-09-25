/**
 * AI 监控指标端点
 * 使用 prom-client 暴露 Prometheus 格式的指标
 */

import express from 'express';
import { PrismaClient } from '@prisma/client';
import { register, collectDefaultMetrics, Counter, Histogram, Gauge } from 'prom-client';
import { logger } from '../middleware/logger.js';

const router = express.Router();
const prisma = new PrismaClient();

// 收集默认指标
collectDefaultMetrics();

// 自定义 AI 指标
const aiRequestsTotal = new Counter({
  name: 'ai_requests_total',
  help: 'Total number of AI requests',
  labelNames: ['route', 'provider', 'status']
});

const aiLatencySeconds = new Histogram({
  name: 'ai_latency_seconds',
  help: 'AI request latency in seconds',
  labelNames: ['route', 'provider'],
  buckets: [0.1, 0.5, 1, 2, 5, 10, 30]
});

const aiDegradedTotal = new Counter({
  name: 'ai_degraded_total',
  help: 'Total number of degraded AI requests',
  labelNames: ['reason']
});

const aiCostUsdTotal = new Counter({
  name: 'ai_cost_usd_total',
  help: 'Total AI cost in USD',
  labelNames: ['provider']
});

const aiCostUsdGauge = new Gauge({
  name: 'ai_cost_usd_current',
  help: 'Current AI cost in USD',
  labelNames: ['period']
});

const aiCircuitBreakerState = new Gauge({
  name: 'ai_circuit_breaker_state',
  help: 'AI circuit breaker state (0=CLOSED, 1=OPEN, 2=HALF_OPEN)'
});

const aiActiveConnections = new Gauge({
  name: 'ai_active_connections',
  help: 'Number of active AI connections'
});

// 获取 AI 使用统计
async function getAIUsageStats() {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const weekStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  const [
    dailyStats,
    monthlyStats,
    weeklyStats,
    totalStats,
    providerStats,
    routeStats,
    statusStats
  ] = await Promise.all([
    // 今日统计
    prisma.aiUsage.aggregate({
      where: { created_at: { gte: today } },
      _count: { id: true },
      _sum: { cost_usd: true }
    }),
    
    // 本月统计
    prisma.aiUsage.aggregate({
      where: { created_at: { gte: monthStart } },
      _count: { id: true },
      _sum: { cost_usd: true }
    }),
    
    // 本周统计
    prisma.aiUsage.aggregate({
      where: { created_at: { gte: weekStart } },
      _count: { id: true },
      _sum: { cost_usd: true }
    }),
    
    // 总统计
    prisma.aiUsage.aggregate({
      _count: { id: true },
      _sum: { cost_usd: true }
    }),
    
    // 按提供商统计
    prisma.aiUsage.groupBy({
      by: ['provider'],
      _count: { id: true },
      _sum: { cost_usd: true }
    }),
    
    // 按路由统计
    prisma.aiUsage.groupBy({
      by: ['route'],
      _count: { id: true },
      _sum: { cost_usd: true }
    }),
    
    // 按状态统计
    prisma.aiUsage.groupBy({
      by: ['status'],
      _count: { id: true }
    })
  ]);

  return {
    daily: dailyStats,
    monthly: monthlyStats,
    weekly: weeklyStats,
    total: totalStats,
    byProvider: providerStats,
    byRoute: routeStats,
    byStatus: statusStats
  };
}

// 更新指标
async function updateMetrics() {
  try {
    const stats = await getAIUsageStats();
    
    // 更新成本指标
    aiCostUsdGauge.set({ period: 'daily' }, stats.daily._sum.cost_usd || 0);
    aiCostUsdGauge.set({ period: 'monthly' }, stats.monthly._sum.cost_usd || 0);
    aiCostUsdGauge.set({ period: 'weekly' }, stats.weekly._sum.cost_usd || 0);
    
    // 更新提供商成本
    stats.byProvider.forEach(provider => {
      aiCostUsdTotal.inc({ provider: provider.provider }, provider._sum.cost_usd || 0);
    });
    
    // 更新请求计数
    stats.byProvider.forEach(provider => {
      aiRequestsTotal.inc({ 
        provider: provider.provider, 
        route: 'all', 
        status: 'all' 
      }, provider._count.id);
    });
    
    // 更新状态计数
    stats.byStatus.forEach(status => {
      aiRequestsTotal.inc({ 
        provider: 'all', 
        route: 'all', 
        status: status.status 
      }, status._count.id);
    });
    
  } catch (error) {
    logger.error('更新 AI 指标失败', { error: error.message });
  }
}

// 指标端点
router.get('/ai', async (req, res) => {
  try {
    // 更新指标
    await updateMetrics();
    
    // 返回 Prometheus 格式的指标
    res.set('Content-Type', register.contentType);
    res.end(await register.metrics());
    
  } catch (error) {
    logger.error('获取 AI 指标失败', { error: error.message });
    res.status(500).json({ error: '获取指标失败' });
  }
});

// AI 使用统计端点
router.get('/ai/stats', async (req, res) => {
  try {
    const stats = await getAIUsageStats();
    
    // 计算成功率
    const successCount = stats.byStatus.find(s => s.status === 'success')?._count.id || 0;
    const totalCount = stats.total._count.id || 0;
    const successRate = totalCount > 0 ? (successCount / totalCount) * 100 : 0;
    
    // 计算平均成本
    const avgCost = totalCount > 0 ? (stats.total._sum.cost_usd || 0) / totalCount : 0;
    
    res.json({
      summary: {
        totalRequests: totalCount,
        successRate: Math.round(successRate * 100) / 100,
        totalCost: stats.total._sum.cost_usd || 0,
        averageCost: Math.round(avgCost * 10000) / 10000,
        dailyCost: stats.daily._sum.cost_usd || 0,
        monthlyCost: stats.monthly._sum.cost_usd || 0
      },
      breakdown: {
        byProvider: stats.byProvider,
        byRoute: stats.byRoute,
        byStatus: stats.byStatus
      },
      trends: {
        daily: stats.daily,
        weekly: stats.weekly,
        monthly: stats.monthly
      }
    });
    
  } catch (error) {
    logger.error('获取 AI 统计失败', { error: error.message });
    res.status(500).json({ error: '获取统计失败' });
  }
});

// 健康检查端点
router.get('/health', async (req, res) => {
  try {
    // 检查数据库连接
    await prisma.$queryRaw`SELECT 1`;
    
    // 检查最近 AI 使用情况
    const recentUsage = await prisma.aiUsage.findFirst({
      orderBy: { created_at: 'desc' }
    });
    
    res.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      database: 'connected',
      lastAIUsage: recentUsage?.created_at || null,
      metrics: {
        totalRequests: await prisma.aiUsage.count(),
        totalCost: (await prisma.aiUsage.aggregate({
          _sum: { cost_usd: true }
        }))._sum.cost_usd || 0
      }
    });
    
  } catch (error) {
    logger.error('AI 指标健康检查失败', { error: error.message });
    res.status(500).json({ 
      status: 'unhealthy',
      error: error.message 
    });
  }
});

export default router;
