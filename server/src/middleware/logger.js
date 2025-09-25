/**
 * 日志中间件
 * 使用 Winston 提供结构化日志记录，集成 PII 脱敏功能
 */

import winston from 'winston';

// PII 脱敏工具（简化版，用于后端）
const maskSensitiveData = (data) => {
  if (!data || typeof data !== 'object') return data;
  
  const sensitiveFields = ['email', 'phone', 'password', 'token', 'secret', 'key', 'name', 'username'];
  const masked = Array.isArray(data) ? [] : {};
  
  for (const [key, value] of Object.entries(data)) {
    const lowerKey = key.toLowerCase();
    
    if (sensitiveFields.some(field => lowerKey.includes(field))) {
      if (typeof value === 'string') {
        if (lowerKey.includes('email')) {
          masked[key] = value.replace(/(.{2}).*(@.*)/, '$1***$2');
        } else if (lowerKey.includes('phone')) {
          masked[key] = value.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2');
        } else if (lowerKey.includes('token') || lowerKey.includes('secret')) {
          masked[key] = value.substring(0, 10) + '...' + value.substring(value.length - 10);
        } else {
          masked[key] = value.substring(0, 2) + '*'.repeat(value.length - 4) + value.substring(value.length - 2);
        }
      } else {
        masked[key] = '[MASKED]';
      }
    } else if (typeof value === 'object' && value !== null) {
      masked[key] = maskSensitiveData(value);
    } else {
      masked[key] = value;
    }
  }
  
  return masked;
};

// 创建日志格式
const logFormat = winston.format.combine(
  winston.format.timestamp({
    format: 'YYYY-MM-DD HH:mm:ss'
  }),
  winston.format.errors({ stack: true }),
  winston.format.json(),
  winston.format.prettyPrint()
);

// 创建控制台格式（开发环境）
const consoleFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({
    format: 'HH:mm:ss'
  }),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    let log = `${timestamp} [${level}]: ${message}`;
    
    // 添加元数据
    if (Object.keys(meta).length > 0) {
      log += `\n${JSON.stringify(meta, null, 2)}`;
    }
    
    return log;
  })
);

// 创建 Winston 实例
export const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: logFormat,
  defaultMeta: {
    service: 'aura-flow-server',
    version: process.env.VITE_BUILD_VERSION || '1.0.0'
  },
  transports: [
    // 控制台输出
    new winston.transports.Console({
      format: process.env.NODE_ENV === 'development' ? consoleFormat : logFormat
    }),
    
    // 错误日志文件
    new winston.transports.File({
      filename: 'logs/error.log',
      level: 'error',
      maxsize: 5242880, // 5MB
      maxFiles: 5
    }),
    
    // 综合日志文件
    new winston.transports.File({
      filename: 'logs/combined.log',
      maxsize: 5242880, // 5MB
      maxFiles: 5
    })
  ],
  
  // 异常处理
  exceptionHandlers: [
    new winston.transports.File({ filename: 'logs/exceptions.log' })
  ],
  
  // 拒绝处理
  rejectionHandlers: [
    new winston.transports.File({ filename: 'logs/rejections.log' })
  ]
});

// 开发环境不退出进程
if (process.env.NODE_ENV !== 'production') {
  logger.exceptions.handle(
    new winston.transports.Console({
      format: consoleFormat
    })
  );
}

// 导出日志级别常量
export const LOG_LEVELS = {
  ERROR: 'error',
  WARN: 'warn',
  INFO: 'info',
  HTTP: 'http',
  VERBOSE: 'verbose',
  DEBUG: 'debug',
  SILLY: 'silly'
};

// 辅助函数：记录 API 请求
export const logApiRequest = (req, res, responseTime) => {
  const logData = {
    method: req.method,
    url: req.originalUrl,
    statusCode: res.statusCode,
    responseTime: `${responseTime}ms`,
    userAgent: req.get('User-Agent'),
    ip: req.ip || req.connection.remoteAddress
  };
  
  if (req.user) {
    logData.userId = req.user.id;
  }
  
  // 脱敏敏感数据
  const maskedLogData = maskSensitiveData(logData);
  
  if (res.statusCode >= 400) {
    logger.warn('API 请求', maskedLogData);
  } else {
    logger.info('API 请求', maskedLogData);
  }
};

// 辅助函数：记录错误
export const logError = (error, context = {}) => {
  const errorData = {
    message: error.message,
    stack: error.stack,
    ...context
  };
  
  // 脱敏敏感数据
  const maskedErrorData = maskSensitiveData(errorData);
  
  logger.error('应用错误', maskedErrorData);
};

// 辅助函数：记录业务事件
export const logBusinessEvent = (event, data = {}) => {
  const eventData = {
    event,
    ...data
  };
  
  // 脱敏敏感数据
  const maskedEventData = maskSensitiveData(eventData);
  
  logger.info('业务事件', maskedEventData);
};
