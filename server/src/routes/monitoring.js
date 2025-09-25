/**
 * 监控路由
 * 提供系统监控和告警 API
 */

import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import { isAdmin } from '../middleware/admin.js';
import monitoringService from '../services/monitoring.js';
import { logger } from '../middleware/logger.js';

const router = express.Router();

// 启动监控服务
monitoringService.start();

/**
 * 获取系统健康状态
 */
router.get('/health', async (req, res) => {
  try {
    const healthStatus = monitoringService.getHealthStatus();
    
    res.json({
      status: 'success',
      data: healthStatus
    });
  } catch (error) {
    logger.error('获取健康状态失败', { error: error.message });
    res.status(500).json({
      status: 'error',
      message: '获取健康状态失败'
    });
  }
});

/**
 * 获取系统概览（需要认证）
 */
router.get('/overview', authenticateToken, async (req, res) => {
  try {
    const overview = monitoringService.getSystemOverview();
    
    res.json({
      status: 'success',
      data: overview
    });
  } catch (error) {
    logger.error('获取系统概览失败', { error: error.message });
    res.status(500).json({
      status: 'error',
      message: '获取系统概览失败'
    });
  }
});

/**
 * 获取指标数据（需要管理员权限）
 */
router.get('/metrics/:name', authenticateToken, isAdmin, async (req, res) => {
  try {
    const { name } = req.params;
    const { limit = 100, from, to } = req.query;
    
    let metrics = monitoringService.getMetrics(name);
    
    // 时间范围过滤
    if (from) {
      const fromDate = new Date(from);
      metrics = metrics.filter(m => m.timestamp >= fromDate);
    }
    
    if (to) {
      const toDate = new Date(to);
      metrics = metrics.filter(m => m.timestamp <= toDate);
    }
    
    // 限制数量
    const limitNum = parseInt(limit);
    if (limitNum > 0) {
      metrics = metrics.slice(-limitNum);
    }
    
    res.json({
      status: 'success',
      data: {
        name,
        metrics,
        count: metrics.length
      }
    });
  } catch (error) {
    logger.error('获取指标数据失败', { error: error.message });
    res.status(500).json({
      status: 'error',
      message: '获取指标数据失败'
    });
  }
});

/**
 * 获取所有指标列表（需要管理员权限）
 */
router.get('/metrics', authenticateToken, isAdmin, async (req, res) => {
  try {
    const metrics = monitoringService.metrics;
    const metricNames = Array.from(metrics.keys());
    
    res.json({
      status: 'success',
      data: {
        metrics: metricNames,
        count: metricNames.length
      }
    });
  } catch (error) {
    logger.error('获取指标列表失败', { error: error.message });
    res.status(500).json({
      status: 'error',
      message: '获取指标列表失败'
    });
  }
});

/**
 * 获取告警列表（需要管理员权限）
 */
router.get('/alerts', authenticateToken, isAdmin, async (req, res) => {
  try {
    const { limit = 50, severity, type } = req.query;
    
    let alerts = monitoringService.getAlerts(parseInt(limit));
    
    // 按严重程度过滤
    if (severity) {
      alerts = alerts.filter(alert => alert.severity === severity);
    }
    
    // 按类型过滤
    if (type) {
      alerts = alerts.filter(alert => alert.type === type);
    }
    
    res.json({
      status: 'success',
      data: {
        alerts,
        count: alerts.length
      }
    });
  } catch (error) {
    logger.error('获取告警列表失败', { error: error.message });
    res.status(500).json({
      status: 'error',
      message: '获取告警列表失败'
    });
  }
});

/**
 * 手动触发健康检查（需要管理员权限）
 */
router.post('/health-check/:check', authenticateToken, isAdmin, async (req, res) => {
  try {
    const { check } = req.params;
    const healthCheck = monitoringService.healthChecks.get(check);
    
    if (!healthCheck) {
      return res.status(404).json({
        status: 'error',
        message: '健康检查不存在'
      });
    }
    
    const result = await monitoringService.runHealthCheck(check, healthCheck);
    monitoringService.processHealthCheckResult(check, result);
    
    res.json({
      status: 'success',
      data: result
    });
  } catch (error) {
    logger.error('手动健康检查失败', { error: error.message });
    res.status(500).json({
      status: 'error',
      message: '手动健康检查失败'
    });
  }
});

/**
 * 获取系统性能指标（需要管理员权限）
 */
router.get('/performance', authenticateToken, isAdmin, async (req, res) => {
  try {
    const { duration = 3600 } = req.query; // 默认1小时
    const durationMs = parseInt(duration) * 1000;
    const from = new Date(Date.now() - durationMs);
    
    const performanceMetrics = {
      memory: monitoringService.getMetrics('system.memory.heap_used').filter(m => m.timestamp >= from),
      cpu: monitoringService.getMetrics('system.cpu.user').filter(m => m.timestamp >= from),
      uptime: monitoringService.getMetrics('system.uptime').filter(m => m.timestamp >= from),
      healthChecks: {}
    };
    
    // 获取健康检查指标
    for (const [key] of monitoringService.healthChecks) {
      performanceMetrics.healthChecks[key] = {
        status: monitoringService.getMetrics(`health_check.${key}.status`).filter(m => m.timestamp >= from),
        duration: monitoringService.getMetrics(`health_check.${key}.duration`).filter(m => m.timestamp >= from)
      };
    }
    
    res.json({
      status: 'success',
      data: performanceMetrics
    });
  } catch (error) {
    logger.error('获取性能指标失败', { error: error.message });
    res.status(500).json({
      status: 'error',
      message: '获取性能指标失败'
    });
  }
});

/**
 * 获取应用指标（需要管理员权限）
 */
router.get('/application', authenticateToken, isAdmin, async (req, res) => {
  try {
    const { duration = 3600 } = req.query; // 默认1小时
    const durationMs = parseInt(duration) * 1000;
    const from = new Date(Date.now() - durationMs);
    
    const appMetrics = {
      users: monitoringService.getMetrics('app.users.total').filter(m => m.timestamp >= from),
      tasks: monitoringService.getMetrics('app.tasks.total').filter(m => m.timestamp >= from),
      sessions: monitoringService.getMetrics('app.sessions.active').filter(m => m.timestamp >= from)
    };
    
    res.json({
      status: 'success',
      data: appMetrics
    });
  } catch (error) {
    logger.error('获取应用指标失败', { error: error.message });
    res.status(500).json({
      status: 'error',
      message: '获取应用指标失败'
    });
  }
});

/**
 * 清除告警（需要管理员权限）
 */
router.delete('/alerts', authenticateToken, isAdmin, async (req, res) => {
  try {
    monitoringService.alerts = [];
    
    res.json({
      status: 'success',
      message: '告警已清除'
    });
  } catch (error) {
    logger.error('清除告警失败', { error: error.message });
    res.status(500).json({
      status: 'error',
      message: '清除告警失败'
    });
  }
});

export default router;
