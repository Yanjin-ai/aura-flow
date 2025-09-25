/**
 * 反思管理路由
 * 处理用户的反思记录
 */

import express from 'express';
import { body, query, validationResult } from 'express-validator';
import { PrismaClient } from '@prisma/client';
import { catchAsync, AppError } from '../middleware/errorHandler.js';
import { authenticateToken } from './auth.js';
import { logger, logBusinessEvent } from '../middleware/logger.js';

const router = express.Router();
const prisma = new PrismaClient();

// 所有路由都需要认证
router.use(authenticateToken);

/**
 * 获取反思列表
 * GET /reflections
 */
router.get('/', [
  query('mood').optional().isIn(['POSITIVE', 'NEUTRAL', 'NEGATIVE']),
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 })
], catchAsync(async (req, res, next) => {
  // 验证查询参数
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return next(new AppError('查询参数验证失败', 400));
  }
  
  const { mood, page = 1, limit = 20 } = req.query;
  const skip = (page - 1) * limit;
  
  // 构建查询条件
  const where = {
    user_id: req.user.id
  };
  
  if (mood) {
    where.mood = mood;
  }
  
  // 查询反思
  const [reflections, total] = await Promise.all([
    prisma.reflection.findMany({
      where,
      skip: parseInt(skip),
      take: parseInt(limit),
      orderBy: {
        created_at: 'desc'
      }
    }),
    prisma.reflection.count({ where })
  ]);
  
  // 解析 JSON 字段
  const reflectionsWithParsedData = reflections.map(reflection => ({
    ...reflection,
    metadata: reflection.metadata ? JSON.parse(reflection.metadata) : {}
  }));
  
  res.json({
    reflections: reflectionsWithParsedData,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      pages: Math.ceil(total / limit)
    }
  });
}));

/**
 * 获取单个反思
 * GET /reflections/:id
 */
router.get('/:id', catchAsync(async (req, res, next) => {
  const reflection = await prisma.reflection.findFirst({
    where: {
      id: req.params.id,
      user_id: req.user.id
    }
  });
  
  if (!reflection) {
    return next(new AppError('反思不存在', 404));
  }
  
  // 解析 JSON 字段
  const reflectionWithParsedData = {
    ...reflection,
    metadata: reflection.metadata ? JSON.parse(reflection.metadata) : {}
  };
  
  res.json(reflectionWithParsedData);
}));

/**
 * 创建反思
 * POST /reflections
 */
router.post('/', [
  body('content').isLength({ min: 1, max: 2000 }).withMessage('反思内容长度应在1-2000个字符之间'),
  body('mood').optional().isIn(['POSITIVE', 'NEUTRAL', 'NEGATIVE']).withMessage('心情必须是 POSITIVE、NEUTRAL 或 NEGATIVE'),
  body('metadata').optional().isObject().withMessage('元数据必须是对象')
], catchAsync(async (req, res, next) => {
  // 验证输入
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return next(new AppError('输入验证失败', 400));
  }
  
  const { content, mood = 'NEUTRAL', metadata = {} } = req.body;
  
  // 创建反思
  const reflection = await prisma.reflection.create({
    data: {
      content,
      mood,
      user_id: req.user.id,
      metadata: JSON.stringify(metadata)
    }
  });
  
  // 记录业务事件
  logBusinessEvent('reflection_created', {
    userId: req.user.id,
    reflectionId: reflection.id,
    mood: reflection.mood
  });
  
  // 解析 JSON 字段
  const reflectionWithParsedData = {
    ...reflection,
    metadata: JSON.parse(reflection.metadata)
  };
  
  res.status(201).json(reflectionWithParsedData);
}));

/**
 * 更新反思
 * PATCH /reflections/:id
 */
router.patch('/:id', [
  body('content').optional().isLength({ min: 1, max: 2000 }).withMessage('反思内容长度应在1-2000个字符之间'),
  body('mood').optional().isIn(['POSITIVE', 'NEUTRAL', 'NEGATIVE']).withMessage('心情必须是 POSITIVE、NEUTRAL 或 NEGATIVE'),
  body('metadata').optional().isObject().withMessage('元数据必须是对象')
], catchAsync(async (req, res, next) => {
  // 验证输入
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return next(new AppError('输入验证失败', 400));
  }
  
  // 检查反思是否存在且属于当前用户
  const existingReflection = await prisma.reflection.findFirst({
    where: {
      id: req.params.id,
      user_id: req.user.id
    }
  });
  
  if (!existingReflection) {
    return next(new AppError('反思不存在', 404));
  }
  
  const allowedFields = ['content', 'mood', 'metadata'];
  const updateData = {};
  
  allowedFields.forEach(field => {
    if (req.body[field] !== undefined) {
      if (field === 'metadata') {
        updateData[field] = JSON.stringify(req.body[field]);
      } else {
        updateData[field] = req.body[field];
      }
    }
  });
  
  if (Object.keys(updateData).length === 0) {
    return next(new AppError('没有提供要更新的字段', 400));
  }
  
  // 更新反思
  const updatedReflection = await prisma.reflection.update({
    where: { id: req.params.id },
    data: updateData
  });
  
  // 记录业务事件
  logBusinessEvent('reflection_updated', {
    userId: req.user.id,
    reflectionId: updatedReflection.id,
    updatedFields: Object.keys(updateData)
  });
  
  // 解析 JSON 字段
  const reflectionWithParsedData = {
    ...updatedReflection,
    metadata: updatedReflection.metadata ? JSON.parse(updatedReflection.metadata) : {}
  };
  
  res.json(reflectionWithParsedData);
}));

/**
 * 删除反思
 * DELETE /reflections/:id
 */
router.delete('/:id', catchAsync(async (req, res, next) => {
  // 检查反思是否存在且属于当前用户
  const existingReflection = await prisma.reflection.findFirst({
    where: {
      id: req.params.id,
      user_id: req.user.id
    }
  });
  
  if (!existingReflection) {
    return next(new AppError('反思不存在', 404));
  }
  
  // 删除反思
  await prisma.reflection.delete({
    where: { id: req.params.id }
  });
  
  // 记录业务事件
  logBusinessEvent('reflection_deleted', {
    userId: req.user.id,
    reflectionId: req.params.id
  });
  
  res.json({ message: '反思删除成功' });
}));

/**
 * 获取反思统计
 * GET /reflections/stats
 */
router.get('/stats/overview', catchAsync(async (req, res, next) => {
  const userId = req.user.id;
  
  // 获取总反思数量
  const total = await prisma.reflection.count({
    where: { user_id: userId }
  });
  
  // 获取心情分布
  const [positive, neutral, negative] = await Promise.all([
    prisma.reflection.count({ where: { user_id: userId, mood: 'POSITIVE' } }),
    prisma.reflection.count({ where: { user_id: userId, mood: 'NEUTRAL' } }),
    prisma.reflection.count({ where: { user_id: userId, mood: 'NEGATIVE' } })
  ]);
  
  // 获取最近7天的反思创建趋势
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  
  const recentReflections = await prisma.reflection.findMany({
    where: {
      user_id: userId,
      created_at: { gte: sevenDaysAgo }
    },
    select: {
      created_at: true,
      mood: true
    }
  });
  
  // 按日期和心情分组统计
  const dailyStats = {};
  recentReflections.forEach(reflection => {
    const date = reflection.created_at.toISOString().split('T')[0];
    if (!dailyStats[date]) {
      dailyStats[date] = { positive: 0, neutral: 0, negative: 0 };
    }
    dailyStats[date][reflection.mood.toLowerCase()]++;
  });
  
  // 计算心情趋势
  const moodTrend = {
    positive: (positive / total * 100).toFixed(1),
    neutral: (neutral / total * 100).toFixed(1),
    negative: (negative / total * 100).toFixed(1)
  };
  
  res.json({
    overview: {
      total,
      positive,
      neutral,
      negative
    },
    mood_distribution: moodTrend,
    recent_trends: dailyStats
  });
}));

export default router;
