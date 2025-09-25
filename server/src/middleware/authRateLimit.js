/**
 * 认证路由专用速率限制中间件
 * 防止暴力破解和滥用
 */

import rateLimit from 'express-rate-limit';
import { logger } from './logger.js';

// 登录速率限制 - 更严格的限制
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 分钟
  max: 5, // 最多 5 次尝试
  message: {
    error: '登录尝试次数过多，请 15 分钟后重试',
    retryAfter: 15 * 60
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    logger.warn('登录速率限制触发', {
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      timestamp: new Date().toISOString()
    });
    
    res.status(429).json({
      error: '登录尝试次数过多，请 15 分钟后重试',
      retryAfter: 15 * 60
    });
  },
  skip: (req) => {
    // 在开发环境中跳过限制
    return process.env.NODE_ENV === 'development';
  }
});

// 注册速率限制
const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 小时
  max: 3, // 最多 3 次注册尝试
  message: {
    error: '注册尝试次数过多，请 1 小时后重试',
    retryAfter: 60 * 60
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    logger.warn('注册速率限制触发', {
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      timestamp: new Date().toISOString()
    });
    
    res.status(429).json({
      error: '注册尝试次数过多，请 1 小时后重试',
      retryAfter: 60 * 60
    });
  },
  skip: (req) => {
    return process.env.NODE_ENV === 'development';
  }
});

// 密码重置速率限制
const passwordResetLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 小时
  max: 3, // 最多 3 次密码重置请求
  message: {
    error: '密码重置请求次数过多，请 1 小时后重试',
    retryAfter: 60 * 60
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    logger.warn('密码重置速率限制触发', {
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      timestamp: new Date().toISOString()
    });
    
    res.status(429).json({
      error: '密码重置请求次数过多，请 1 小时后重试',
      retryAfter: 60 * 60
    });
  }
});

// 暴力破解检测和临时封禁
const bruteForceProtection = new Map();

const checkBruteForce = (req, res, next) => {
  const ip = req.ip;
  const now = Date.now();
  const windowMs = 15 * 60 * 1000; // 15 分钟窗口
  
  // 获取或创建 IP 记录
  if (!bruteForceProtection.has(ip)) {
    bruteForceProtection.set(ip, {
      attempts: 0,
      lastAttempt: 0,
      blockedUntil: 0
    });
  }
  
  const ipRecord = bruteForceProtection.get(ip);
  
  // 检查是否在封禁期内
  if (now < ipRecord.blockedUntil) {
    const remainingTime = Math.ceil((ipRecord.blockedUntil - now) / 1000 / 60);
    logger.warn('IP 被封禁，尝试访问', {
      ip,
      remainingMinutes: remainingTime,
      timestamp: new Date().toISOString()
    });
    
    return res.status(429).json({
      error: `IP 已被临时封禁，请 ${remainingTime} 分钟后重试`,
      retryAfter: remainingTime * 60
    });
  }
  
  // 重置计数器（如果超过窗口时间）
  if (now - ipRecord.lastAttempt > windowMs) {
    ipRecord.attempts = 0;
  }
  
  req.ipRecord = ipRecord;
  next();
};

const recordFailedAttempt = (req, res, next) => {
  const ipRecord = req.ipRecord;
  if (!ipRecord) return next();
  
  ipRecord.attempts++;
  ipRecord.lastAttempt = Date.now();
  
  // 如果失败次数超过阈值，临时封禁
  if (ipRecord.attempts >= 10) {
    ipRecord.blockedUntil = Date.now() + (30 * 60 * 1000); // 封禁 30 分钟
    logger.error('IP 因暴力破解被封禁', {
      ip: req.ip,
      attempts: ipRecord.attempts,
      blockedUntil: new Date(ipRecord.blockedUntil).toISOString()
    });
  }
  
  next();
};

const recordSuccessfulAttempt = (req, res, next) => {
  const ipRecord = req.ipRecord;
  if (!ipRecord) return next();
  
  // 成功登录后重置计数器
  ipRecord.attempts = 0;
  ipRecord.blockedUntil = 0;
  
  next();
};

// 清理过期的 IP 记录
setInterval(() => {
  const now = Date.now();
  const maxAge = 24 * 60 * 60 * 1000; // 24 小时
  
  for (const [ip, record] of bruteForceProtection.entries()) {
    if (now - record.lastAttempt > maxAge) {
      bruteForceProtection.delete(ip);
    }
  }
}, 60 * 60 * 1000); // 每小时清理一次

export {
  loginLimiter,
  registerLimiter,
  passwordResetLimiter,
  checkBruteForce,
  recordFailedAttempt,
  recordSuccessfulAttempt
};
