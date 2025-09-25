/**
 * 高级速率限制中间件
 * 支持多种限制策略和动态调整
 */

import rateLimit from 'express-rate-limit';
import { logger } from './logger.js';

// 内存存储（生产环境建议使用 Redis）
const requestCounts = new Map();
const blockedIPs = new Map();

// 清理过期数据
setInterval(() => {
  const now = Date.now();
  for (const [key, data] of requestCounts.entries()) {
    if (now - data.lastReset > 15 * 60 * 1000) { // 15分钟
      requestCounts.delete(key);
    }
  }
  for (const [ip, data] of blockedIPs.entries()) {
    if (now - data.blockedUntil < now) {
      blockedIPs.delete(ip);
    }
  }
}, 60000); // 每分钟清理一次

// 动态速率限制配置
const rateLimitConfigs = {
  // 通用 API 限制
  general: {
    windowMs: 15 * 60 * 1000, // 15 分钟
    max: 100, // 每个 IP 15 分钟内最多 100 个请求
    message: {
      error: '请求过于频繁，请稍后再试',
      retryAfter: '15 分钟',
      code: 'RATE_LIMIT_EXCEEDED'
    },
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
      logger.warn('通用速率限制触发', {
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        path: req.path,
        method: req.method
      });
      res.status(429).json({
        error: '请求过于频繁，请稍后再试',
        retryAfter: '15 分钟',
        code: 'RATE_LIMIT_EXCEEDED'
      });
    }
  },

  // 登录接口限制
  login: {
    windowMs: 15 * 60 * 1000, // 15 分钟
    max: 5, // 每个 IP 15 分钟内最多 5 次登录尝试
    message: {
      error: '登录尝试过于频繁，请稍后再试',
      retryAfter: '15 分钟',
      code: 'LOGIN_RATE_LIMIT_EXCEEDED'
    },
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests: true, // 成功登录不计入限制
    handler: (req, res) => {
      logger.warn('登录速率限制触发', {
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        email: req.body?.email ? '***@' + req.body.email.split('@')[1] : 'unknown'
      });
      res.status(429).json({
        error: '登录尝试过于频繁，请稍后再试',
        retryAfter: '15 分钟',
        code: 'LOGIN_RATE_LIMIT_EXCEEDED'
      });
    }
  },

  // 注册接口限制
  register: {
    windowMs: 60 * 60 * 1000, // 1 小时
    max: 3, // 每个 IP 1 小时内最多 3 次注册尝试
    message: {
      error: '注册尝试过于频繁，请稍后再试',
      retryAfter: '1 小时',
      code: 'REGISTER_RATE_LIMIT_EXCEEDED'
    },
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
      logger.warn('注册速率限制触发', {
        ip: req.ip,
        userAgent: req.get('User-Agent')
      });
      res.status(429).json({
        error: '注册尝试过于频繁，请稍后再试',
        retryAfter: '1 小时',
        code: 'REGISTER_RATE_LIMIT_EXCEEDED'
      });
    }
  },

  // 密码重置限制
  passwordReset: {
    windowMs: 60 * 60 * 1000, // 1 小时
    max: 3, // 每个 IP 1 小时内最多 3 次密码重置请求
    message: {
      error: '密码重置请求过于频繁，请稍后再试',
      retryAfter: '1 小时',
      code: 'PASSWORD_RESET_RATE_LIMIT_EXCEEDED'
    },
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
      logger.warn('密码重置速率限制触发', {
        ip: req.ip,
        userAgent: req.get('User-Agent')
      });
      res.status(429).json({
        error: '密码重置请求过于频繁，请稍后再试',
        retryAfter: '1 小时',
        code: 'PASSWORD_RESET_RATE_LIMIT_EXCEEDED'
      });
    }
  },

  // 文件上传限制
  upload: {
    windowMs: 60 * 60 * 1000, // 1 小时
    max: 20, // 每个 IP 1 小时内最多 20 次文件上传
    message: {
      error: '文件上传过于频繁，请稍后再试',
      retryAfter: '1 小时',
      code: 'UPLOAD_RATE_LIMIT_EXCEEDED'
    },
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
      logger.warn('文件上传速率限制触发', {
        ip: req.ip,
        userAgent: req.get('User-Agent')
      });
      res.status(429).json({
        error: '文件上传过于频繁，请稍后再试',
        retryAfter: '1 小时',
        code: 'UPLOAD_RATE_LIMIT_EXCEEDED'
      });
    }
  }
};

// 创建速率限制器
export const createRateLimiter = (configName) => {
  const config = rateLimitConfigs[configName];
  if (!config) {
    throw new Error(`未知的速率限制配置: ${configName}`);
  }
  return rateLimit(config);
};

// 动态调整速率限制
export const adjustRateLimit = (configName, newMax) => {
  if (rateLimitConfigs[configName]) {
    rateLimitConfigs[configName].max = newMax;
    logger.info(`动态调整速率限制`, {
      config: configName,
      newMax: newMax
    });
  }
};

// 检查 IP 是否被临时封禁
export const isIPBlocked = (ip) => {
  const blockData = blockedIPs.get(ip);
  if (blockData && blockData.blockedUntil > Date.now()) {
    return true;
  }
  return false;
};

// 临时封禁 IP
export const blockIP = (ip, durationMs = 60 * 60 * 1000) => { // 默认封禁 1 小时
  blockedIPs.set(ip, {
    blockedAt: Date.now(),
    blockedUntil: Date.now() + durationMs
  });
  logger.warn('IP 被临时封禁', {
    ip: ip,
    duration: durationMs,
    blockedUntil: new Date(Date.now() + durationMs).toISOString()
  });
};

// 解封 IP
export const unblockIP = (ip) => {
  blockedIPs.delete(ip);
  logger.info('IP 解封', { ip: ip });
};

// 获取速率限制统计
export const getRateLimitStats = () => {
  return {
    activeConnections: requestCounts.size,
    blockedIPs: blockedIPs.size,
    configs: Object.keys(rateLimitConfigs).map(key => ({
      name: key,
      max: rateLimitConfigs[key].max,
      windowMs: rateLimitConfigs[key].windowMs
    }))
  };
};

// 导出预配置的速率限制器
export const generalLimiter = createRateLimiter('general');
export const loginLimiter = createRateLimiter('login');
export const registerLimiter = createRateLimiter('register');
export const passwordResetLimiter = createRateLimiter('passwordReset');
export const uploadLimiter = createRateLimiter('upload');
