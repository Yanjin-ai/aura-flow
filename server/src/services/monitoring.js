/**
 * 监控服务
 * 提供系统健康检查、性能监控和告警功能
 */

import { logger } from '../middleware/logger.js';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

class MonitoringService {
  constructor() {
    this.healthChecks = new Map();
    this.metrics = new Map();
    this.alerts = [];
    this.isRunning = false;
  }

  /**
   * 启动监控服务
   */
  start() {
    if (this.isRunning) {
      logger.warn('监控服务已在运行');
      return;
    }

    this.isRunning = true;
    logger.info('启动监控服务');

    // 注册健康检查
    this.registerHealthChecks();

    // 启动定期检查
    this.startPeriodicChecks();

    // 启动指标收集
    this.startMetricsCollection();
  }

  /**
   * 停止监控服务
   */
  stop() {
    this.isRunning = false;
    logger.info('停止监控服务');
  }

  /**
   * 注册健康检查
   */
  registerHealthChecks() {
    // 数据库连接检查
    this.healthChecks.set('database', {
      name: '数据库连接',
      check: this.checkDatabase.bind(this),
      interval: 30000, // 30秒
      timeout: 5000,   // 5秒超时
      critical: true
    });

    // 内存使用检查
    this.healthChecks.set('memory', {
      name: '内存使用',
      check: this.checkMemory.bind(this),
      interval: 60000, // 1分钟
      timeout: 3000,
      critical: false
    });

    // 磁盘空间检查
    this.healthChecks.set('disk', {
      name: '磁盘空间',
      check: this.checkDiskSpace.bind(this),
      interval: 300000, // 5分钟
      timeout: 5000,
      critical: true
    });

    // API 响应时间检查
    this.healthChecks.set('api', {
      name: 'API 响应时间',
      check: this.checkApiResponse.bind(this),
      interval: 60000, // 1分钟
      timeout: 10000,
      critical: false
    });
  }

  /**
   * 启动定期检查
   */
  startPeriodicChecks() {
    for (const [key, healthCheck] of this.healthChecks) {
      setInterval(async () => {
        try {
          const result = await this.runHealthCheck(key, healthCheck);
          this.processHealthCheckResult(key, result);
        } catch (error) {
          logger.error('健康检查失败', { check: key, error: error.message });
          this.processHealthCheckResult(key, {
            status: 'error',
            message: error.message,
            timestamp: new Date()
          });
        }
      }, healthCheck.interval);
    }
  }

  /**
   * 启动指标收集
   */
  startMetricsCollection() {
    // 收集系统指标
    setInterval(() => {
      this.collectSystemMetrics();
    }, 60000); // 每分钟收集一次

    // 收集应用指标
    setInterval(() => {
      this.collectApplicationMetrics();
    }, 30000); // 每30秒收集一次
  }

  /**
   * 运行健康检查
   */
  async runHealthCheck(key, healthCheck) {
    const startTime = Date.now();
    
    try {
      const result = await Promise.race([
        healthCheck.check(),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('健康检查超时')), healthCheck.timeout)
        )
      ]);

      const duration = Date.now() - startTime;
      
      return {
        status: 'healthy',
        message: '检查通过',
        duration,
        timestamp: new Date(),
        ...result
      };
    } catch (error) {
      const duration = Date.now() - startTime;
      
      return {
        status: 'unhealthy',
        message: error.message,
        duration,
        timestamp: new Date()
      };
    }
  }

  /**
   * 处理健康检查结果
   */
  processHealthCheckResult(key, result) {
    const healthCheck = this.healthChecks.get(key);
    
    // 记录指标
    this.recordMetric(`health_check.${key}.status`, result.status === 'healthy' ? 1 : 0);
    this.recordMetric(`health_check.${key}.duration`, result.duration);

    // 检查是否需要告警
    if (result.status === 'unhealthy' && healthCheck.critical) {
      this.triggerAlert({
        type: 'health_check_failed',
        severity: 'critical',
        title: `${healthCheck.name} 检查失败`,
        message: result.message,
        check: key,
        timestamp: result.timestamp
      });
    }

    // 记录日志
    if (result.status === 'unhealthy') {
      logger.warn('健康检查失败', {
        check: key,
        name: healthCheck.name,
        message: result.message,
        duration: result.duration
      });
    }
  }

  /**
   * 数据库连接检查
   */
  async checkDatabase() {
    try {
      await prisma.$queryRaw`SELECT 1`;
      return { status: 'healthy' };
    } catch (error) {
      throw new Error(`数据库连接失败: ${error.message}`);
    }
  }

  /**
   * 内存使用检查
   */
  async checkMemory() {
    const memUsage = process.memoryUsage();
    const memUsageMB = {
      rss: Math.round(memUsage.rss / 1024 / 1024),
      heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024),
      heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024),
      external: Math.round(memUsage.external / 1024 / 1024)
    };

    // 内存使用超过 500MB 时告警
    if (memUsageMB.heapUsed > 500) {
      throw new Error(`内存使用过高: ${memUsageMB.heapUsed}MB`);
    }

    return { 
      status: 'healthy',
      memory: memUsageMB
    };
  }

  /**
   * 磁盘空间检查
   */
  async checkDiskSpace() {
    // 这里可以添加磁盘空间检查逻辑
    // 由于 Node.js 没有内置的磁盘空间检查，这里返回健康状态
    return { status: 'healthy' };
  }

  /**
   * API 响应时间检查
   */
  async checkApiResponse() {
    const startTime = Date.now();
    
    try {
      // 检查健康端点
      const response = await fetch('http://localhost:3001/health');
      const duration = Date.now() - startTime;
      
      if (!response.ok) {
        throw new Error(`API 响应异常: ${response.status}`);
      }

      // 响应时间超过 5 秒时告警
      if (duration > 5000) {
        throw new Error(`API 响应时间过长: ${duration}ms`);
      }

      return { 
        status: 'healthy',
        responseTime: duration
      };
    } catch (error) {
      throw new Error(`API 检查失败: ${error.message}`);
    }
  }

  /**
   * 收集系统指标
   */
  collectSystemMetrics() {
    const memUsage = process.memoryUsage();
    const cpuUsage = process.cpuUsage();
    
    this.recordMetric('system.memory.rss', memUsage.rss);
    this.recordMetric('system.memory.heap_used', memUsage.heapUsed);
    this.recordMetric('system.memory.heap_total', memUsage.heapTotal);
    this.recordMetric('system.cpu.user', cpuUsage.user);
    this.recordMetric('system.cpu.system', cpuUsage.system);
    this.recordMetric('system.uptime', process.uptime());
  }

  /**
   * 收集应用指标
   */
  async collectApplicationMetrics() {
    try {
      // 用户数量
      const userCount = await prisma.user.count();
      this.recordMetric('app.users.total', userCount);

      // 任务数量
      const taskCount = await prisma.task.count();
      this.recordMetric('app.tasks.total', taskCount);

      // 活跃会话数量
      const activeSessions = await prisma.session.count({
        where: {
          expires_at: {
            gt: new Date()
          }
        }
      });
      this.recordMetric('app.sessions.active', activeSessions);

    } catch (error) {
      logger.error('收集应用指标失败', { error: error.message });
    }
  }

  /**
   * 记录指标
   */
  recordMetric(name, value) {
    const timestamp = new Date();
    const metric = {
      name,
      value,
      timestamp
    };

    if (!this.metrics.has(name)) {
      this.metrics.set(name, []);
    }

    const metrics = this.metrics.get(name);
    metrics.push(metric);

    // 保留最近 100 个数据点
    if (metrics.length > 100) {
      metrics.shift();
    }
  }

  /**
   * 触发告警
   */
  triggerAlert(alert) {
    this.alerts.push(alert);
    
    // 保留最近 100 个告警
    if (this.alerts.length > 100) {
      this.alerts.shift();
    }

    logger.error('系统告警', alert);

    // 这里可以添加告警通知逻辑，如：
    // - 发送邮件
    // - 发送 Slack 消息
    // - 发送短信
    // - 调用外部监控服务
  }

  /**
   * 获取健康状态
   */
  getHealthStatus() {
    const status = {
      overall: 'healthy',
      checks: {},
      timestamp: new Date()
    };

    for (const [key, healthCheck] of this.healthChecks) {
      const metrics = this.metrics.get(`health_check.${key}.status`);
      if (metrics && metrics.length > 0) {
        const latest = metrics[metrics.length - 1];
        status.checks[key] = {
          name: healthCheck.name,
          status: latest.value === 1 ? 'healthy' : 'unhealthy',
          lastCheck: latest.timestamp
        };

        if (latest.value === 0 && healthCheck.critical) {
          status.overall = 'unhealthy';
        }
      }
    }

    return status;
  }

  /**
   * 获取指标
   */
  getMetrics(name) {
    return this.metrics.get(name) || [];
  }

  /**
   * 获取告警
   */
  getAlerts(limit = 10) {
    return this.alerts.slice(-limit);
  }

  /**
   * 获取系统概览
   */
  getSystemOverview() {
    const healthStatus = this.getHealthStatus();
    const recentAlerts = this.getAlerts(5);
    
    return {
      health: healthStatus,
      alerts: recentAlerts,
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      timestamp: new Date()
    };
  }
}

// 创建单例实例
const monitoringService = new MonitoringService();

export default monitoringService;
