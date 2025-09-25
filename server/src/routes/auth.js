/**
 * 认证路由
 * 处理用户登录、注册、JWT 令牌管理
 */

import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { body, validationResult } from 'express-validator';
import { PrismaClient } from '@prisma/client';
import { catchAsync, AppError } from '../middleware/errorHandler.js';
import { logger, logBusinessEvent } from '../middleware/logger.js';

const router = express.Router();
const prisma = new PrismaClient();

// JWT 配置
const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

/**
 * 生成 JWT 令牌
 */
const generateToken = (userId) => {
  return jwt.sign({ userId }, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN
  });
};

/**
 * 验证 JWT 令牌中间件
 */
export const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN
    
    if (!token) {
      throw new AppError('访问令牌缺失', 401);
    }
    
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        email: true,
        name: true,
        has_seen_welcome_guide: true,
        language: true,
        auto_rollover_enabled: true,
        auto_rollover_days: true,
        rollover_notification_enabled: true,
        ai_daily_insights: true,
        ai_weekly_insights: true,
        ai_url_extraction: true,
        created_at: true,
        updated_at: true
      }
    });
    
    if (!user) {
      throw new AppError('用户不存在', 401);
    }
    
    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      next(new AppError('无效的访问令牌', 401));
    } else if (error.name === 'TokenExpiredError') {
      next(new AppError('访问令牌已过期', 401));
    } else {
      next(error);
    }
  }
};

/**
 * 用户注册
 * POST /auth/register
 */
router.post('/register', [
  body('email').isEmail().normalizeEmail().withMessage('请输入有效的邮箱地址'),
  body('password').isLength({ min: 6 }).withMessage('密码至少需要6个字符'),
  body('name').optional().isLength({ min: 1, max: 50 }).withMessage('姓名长度应在1-50个字符之间')
], catchAsync(async (req, res, next) => {
  // 验证输入
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return next(new AppError('输入验证失败', 400));
  }
  
  const { email, password, name } = req.body;
  
  // 检查用户是否已存在
  const existingUser = await prisma.user.findUnique({
    where: { email }
  });
  
  if (existingUser) {
    return next(new AppError('该邮箱已被注册', 409));
  }
  
  // 加密密码
  const password_hash = await bcrypt.hash(password, 12);
  
  // 创建用户
  const user = await prisma.user.create({
    data: {
      email,
      password_hash,
      name: name || email.split('@')[0]
    },
    select: {
      id: true,
      email: true,
      name: true,
      has_seen_welcome_guide: true,
      language: true,
      auto_rollover_enabled: true,
      auto_rollover_days: true,
      rollover_notification_enabled: true,
      ai_daily_insights: true,
      ai_weekly_insights: true,
      ai_url_extraction: true,
      created_at: true,
      updated_at: true
    }
  });
  
  // 生成令牌
  const token = generateToken(user.id);
  
  // 记录业务事件
  logBusinessEvent('user_registered', {
    userId: user.id,
    email: user.email
  });
  
  res.status(201).json({
    user,
    token,
    expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
  });
}));

/**
 * 用户登录
 * POST /auth/login
 */
router.post('/login', [
  body('email').isEmail().normalizeEmail().withMessage('请输入有效的邮箱地址'),
  body('password').notEmpty().withMessage('密码不能为空')
], catchAsync(async (req, res, next) => {
  // 验证输入
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return next(new AppError('输入验证失败', 400));
  }
  
  const { email, password } = req.body;
  
  // 查找用户
  const user = await prisma.user.findUnique({
    where: { email }
  });
  
  if (!user || !user.password_hash) {
    return next(new AppError('邮箱或密码错误', 401));
  }
  
  // 验证密码
  const isPasswordValid = await bcrypt.compare(password, user.password_hash);
  if (!isPasswordValid) {
    return next(new AppError('邮箱或密码错误', 401));
  }
  
  // 生成令牌
  const token = generateToken(user.id);
  
  // 记录登录会话
  await prisma.session.create({
    data: {
      user_id: user.id,
      token_hash: await bcrypt.hash(token, 10),
      expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    }
  });
  
  // 记录业务事件
  logBusinessEvent('user_login', {
    userId: user.id,
    email: user.email
  });
  
  // 返回用户信息（不包含密码）
  const userResponse = {
    id: user.id,
    email: user.email,
    name: user.name,
    has_seen_welcome_guide: user.has_seen_welcome_guide,
    language: user.language,
    auto_rollover_enabled: user.auto_rollover_enabled,
    auto_rollover_days: user.auto_rollover_days,
    rollover_notification_enabled: user.rollover_notification_enabled,
    ai_daily_insights: user.ai_daily_insights,
    ai_weekly_insights: user.ai_weekly_insights,
    ai_url_extraction: user.ai_url_extraction,
    created_at: user.created_at,
    updated_at: user.updated_at
  };
  
  res.json({
    user: userResponse,
    token,
    expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
  });
}));

/**
 * 获取当前用户信息
 * GET /auth/me
 */
router.get('/me', authenticateToken, catchAsync(async (req, res) => {
  res.json(req.user);
}));

/**
 * 更新用户信息
 * PATCH /auth/me
 */
router.patch('/me', authenticateToken, [
  body('name').optional().isLength({ min: 1, max: 50 }).withMessage('姓名长度应在1-50个字符之间'),
  body('language').optional().isIn(['zh-CN', 'en-US']).withMessage('不支持的语言'),
  body('auto_rollover_enabled').optional().isBoolean().withMessage('自动滚动必须为布尔值'),
  body('auto_rollover_days').optional().isInt({ min: 1, max: 30 }).withMessage('自动滚动天数应在1-30之间'),
  body('rollover_notification_enabled').optional().isBoolean().withMessage('滚动通知必须为布尔值'),
  body('ai_daily_insights').optional().isBoolean().withMessage('每日洞察必须为布尔值'),
  body('ai_weekly_insights').optional().isBoolean().withMessage('每周洞察必须为布尔值'),
  body('ai_url_extraction').optional().isBoolean().withMessage('URL提取必须为布尔值'),
  body('has_seen_welcome_guide').optional().isBoolean().withMessage('欢迎指南必须为布尔值')
], catchAsync(async (req, res, next) => {
  // 验证输入
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return next(new AppError('输入验证失败', 400));
  }
  
  const allowedFields = [
    'name', 'language', 'auto_rollover_enabled', 'auto_rollover_days',
    'rollover_notification_enabled', 'ai_daily_insights', 'ai_weekly_insights',
    'ai_url_extraction', 'has_seen_welcome_guide'
  ];
  
  const updateData = {};
  allowedFields.forEach(field => {
    if (req.body[field] !== undefined) {
      updateData[field] = req.body[field];
    }
  });
  
  if (Object.keys(updateData).length === 0) {
    return next(new AppError('没有提供要更新的字段', 400));
  }
  
  const updatedUser = await prisma.user.update({
    where: { id: req.user.id },
    data: updateData,
    select: {
      id: true,
      email: true,
      name: true,
      has_seen_welcome_guide: true,
      language: true,
      auto_rollover_enabled: true,
      auto_rollover_days: true,
      rollover_notification_enabled: true,
      ai_daily_insights: true,
      ai_weekly_insights: true,
      ai_url_extraction: true,
      created_at: true,
      updated_at: true
    }
  });
  
  // 记录业务事件
  logBusinessEvent('user_updated', {
    userId: req.user.id,
    updatedFields: Object.keys(updateData)
  });
  
  res.json(updatedUser);
}));

/**
 * 用户登出
 * POST /auth/logout
 */
router.post('/logout', authenticateToken, catchAsync(async (req, res) => {
  // 这里可以实现令牌黑名单机制
  // 目前简单返回成功响应
  
  // 记录业务事件
  logBusinessEvent('user_logout', {
    userId: req.user.id
  });
  
  res.json({ message: '登出成功' });
}));

/**
 * 刷新令牌
 * POST /auth/refresh
 */
router.post('/refresh', authenticateToken, catchAsync(async (req, res) => {
  // 生成新令牌
  const newToken = generateToken(req.user.id);
  
  // 记录业务事件
  logBusinessEvent('token_refreshed', {
    userId: req.user.id
  });
  
  res.json({
    token: newToken,
    expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
  });
}));

export default router;
