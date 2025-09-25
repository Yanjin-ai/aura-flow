/**
 * 全局错误处理中间件
 * 统一处理应用中的各种错误
 */

import { logger, logError } from './logger.js';

/**
 * 自定义错误类
 */
export class AppError extends Error {
  constructor(message, statusCode = 500, isOperational = true) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * 处理 Prisma 错误
 */
const handlePrismaError = (error) => {
  let message = '数据库操作失败';
  let statusCode = 500;
  
  switch (error.code) {
    case 'P2002':
      // 唯一约束违反
      message = '数据已存在，请检查唯一性约束';
      statusCode = 409;
      break;
    case 'P2025':
      // 记录未找到
      message = '请求的数据不存在';
      statusCode = 404;
      break;
    case 'P2003':
      // 外键约束违反
      message = '关联数据不存在';
      statusCode = 400;
      break;
    case 'P2014':
      // 关系违反
      message = '数据关系错误';
      statusCode = 400;
      break;
    default:
      message = error.message || '数据库操作失败';
  }
  
  return new AppError(message, statusCode);
};

/**
 * 处理 JWT 错误
 */
const handleJWTError = () => {
  return new AppError('无效的认证令牌', 401);
};

const handleJWTExpiredError = () => {
  return new AppError('认证令牌已过期', 401);
};

/**
 * 处理验证错误
 */
const handleValidationError = (error) => {
  const errors = Object.values(error.errors).map(err => err.message);
  const message = `输入验证失败: ${errors.join('. ')}`;
  return new AppError(message, 400);
};

/**
 * 发送错误响应（开发环境）
 */
const sendErrorDev = (err, res) => {
  res.status(err.statusCode).json({
    status: err.status,
    error: err,
    message: err.message,
    stack: err.stack
  });
};

/**
 * 发送错误响应（生产环境）
 */
const sendErrorProd = (err, res) => {
  // 操作错误：发送消息给客户端
  if (err.isOperational) {
    res.status(err.statusCode).json({
      status: err.status,
      message: err.message
    });
  } else {
    // 编程错误：不泄露错误详情
    logger.error('编程错误:', err);
    
    res.status(500).json({
      status: 'error',
      message: '服务器内部错误'
    });
  }
};

/**
 * 全局错误处理中间件
 */
export const errorHandler = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';
  
  // 记录错误
  logError(err, {
    url: req.originalUrl,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    userId: req.user?.id
  });
  
  let error = { ...err };
  error.message = err.message;
  
  // 处理不同类型的错误
  if (err.code && err.code.startsWith('P')) {
    // Prisma 错误
    error = handlePrismaError(err);
  } else if (err.name === 'JsonWebTokenError') {
    // JWT 错误
    error = handleJWTError();
  } else if (err.name === 'TokenExpiredError') {
    // JWT 过期错误
    error = handleJWTExpiredError();
  } else if (err.name === 'ValidationError') {
    // 验证错误
    error = handleValidationError(err);
  } else if (err.name === 'CastError') {
    // 类型转换错误
    error = new AppError('无效的数据格式', 400);
  }
  
  // 根据环境发送不同的错误响应
  if (process.env.NODE_ENV === 'development') {
    sendErrorDev(error, res);
  } else {
    sendErrorProd(error, res);
  }
};

/**
 * 处理未捕获的异常
 */
export const handleUncaughtException = () => {
  process.on('uncaughtException', (err) => {
    logger.error('未捕获的异常:', err);
    process.exit(1);
  });
};

/**
 * 处理未处理的 Promise 拒绝
 */
export const handleUnhandledRejection = () => {
  process.on('unhandledRejection', (err) => {
    logger.error('未处理的 Promise 拒绝:', err);
    process.exit(1);
  });
};

/**
 * 处理 404 错误
 */
export const handleNotFound = (req, res, next) => {
  const err = new AppError(`无法找到 ${req.originalUrl}`, 404);
  next(err);
};

/**
 * 异步错误包装器
 */
export const catchAsync = (fn) => {
  return (req, res, next) => {
    fn(req, res, next).catch(next);
  };
};
