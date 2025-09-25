/**
 * 任务管理路由
 * 处理任务的 CRUD 操作
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
 * 获取任务列表
 * GET /tasks
 */
router.get('/', [
  query('status').optional().isIn(['PENDING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED']),
  query('priority').optional().isIn(['LOW', 'MEDIUM', 'HIGH']),
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 })
], catchAsync(async (req, res, next) => {
  // 验证查询参数
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return next(new AppError('查询参数验证失败', 400));
  }
  
  const { status, priority, page = 1, limit = 20 } = req.query;
  const skip = (page - 1) * limit;
  
  // 构建查询条件
  const where = {
    user_id: req.user.id
  };
  
  if (status) {
    where.status = status;
  }
  
  if (priority) {
    where.priority = priority;
  }
  
  // 查询任务
  const [tasks, total] = await Promise.all([
    prisma.task.findMany({
      where,
      skip: parseInt(skip),
      take: parseInt(limit),
      orderBy: {
        created_at: 'desc'
      }
    }),
    prisma.task.count({ where })
  ]);
  
  // 解析 JSON 字段
  const tasksWithParsedData = tasks.map(task => ({
    ...task,
    tags: task.tags ? JSON.parse(task.tags) : [],
    metadata: task.metadata ? JSON.parse(task.metadata) : {}
  }));
  
  res.json({
    tasks: tasksWithParsedData,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      pages: Math.ceil(total / limit)
    }
  });
}));

/**
 * 获取单个任务
 * GET /tasks/:id
 */
router.get('/:id', catchAsync(async (req, res, next) => {
  const task = await prisma.task.findFirst({
    where: {
      id: req.params.id,
      user_id: req.user.id
    }
  });
  
  if (!task) {
    return next(new AppError('任务不存在', 404));
  }
  
  // 解析 JSON 字段
  const taskWithParsedData = {
    ...task,
    tags: task.tags ? JSON.parse(task.tags) : [],
    metadata: task.metadata ? JSON.parse(task.metadata) : {}
  };
  
  res.json(taskWithParsedData);
}));

/**
 * 创建任务
 * POST /tasks
 */
router.post('/', [
  body('title').isLength({ min: 1, max: 200 }).withMessage('任务标题长度应在1-200个字符之间'),
  body('description').optional().isLength({ max: 1000 }).withMessage('任务描述不能超过1000个字符'),
  body('priority').optional().isIn(['LOW', 'MEDIUM', 'HIGH']).withMessage('优先级必须是 LOW、MEDIUM 或 HIGH'),
  body('due_date').optional().isISO8601().withMessage('截止日期格式无效'),
  body('tags').optional().isArray().withMessage('标签必须是数组'),
  body('metadata').optional().isObject().withMessage('元数据必须是对象')
], catchAsync(async (req, res, next) => {
  // 验证输入
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return next(new AppError('输入验证失败', 400));
  }
  
  const { title, description, priority = 'MEDIUM', due_date, tags = [], metadata = {} } = req.body;
  
  // 创建任务
  const task = await prisma.task.create({
    data: {
      title,
      description,
      priority,
      due_date: due_date ? new Date(due_date) : null,
      user_id: req.user.id,
      tags: JSON.stringify(tags),
      metadata: JSON.stringify(metadata)
    }
  });
  
  // 记录业务事件
  logBusinessEvent('task_created', {
    userId: req.user.id,
    taskId: task.id,
    priority: task.priority
  });
  
  // 解析 JSON 字段
  const taskWithParsedData = {
    ...task,
    tags: JSON.parse(task.tags),
    metadata: JSON.parse(task.metadata)
  };
  
  res.status(201).json(taskWithParsedData);
}));

/**
 * 更新任务
 * PATCH /tasks/:id
 */
router.patch('/:id', [
  body('title').optional().isLength({ min: 1, max: 200 }).withMessage('任务标题长度应在1-200个字符之间'),
  body('description').optional().isLength({ max: 1000 }).withMessage('任务描述不能超过1000个字符'),
  body('status').optional().isIn(['PENDING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED']).withMessage('状态无效'),
  body('priority').optional().isIn(['LOW', 'MEDIUM', 'HIGH']).withMessage('优先级必须是 LOW、MEDIUM 或 HIGH'),
  body('due_date').optional().isISO8601().withMessage('截止日期格式无效'),
  body('tags').optional().isArray().withMessage('标签必须是数组'),
  body('metadata').optional().isObject().withMessage('元数据必须是对象')
], catchAsync(async (req, res, next) => {
  // 验证输入
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return next(new AppError('输入验证失败', 400));
  }
  
  // 检查任务是否存在且属于当前用户
  const existingTask = await prisma.task.findFirst({
    where: {
      id: req.params.id,
      user_id: req.user.id
    }
  });
  
  if (!existingTask) {
    return next(new AppError('任务不存在', 404));
  }
  
  const allowedFields = ['title', 'description', 'status', 'priority', 'due_date', 'tags', 'metadata'];
  const updateData = {};
  
  allowedFields.forEach(field => {
    if (req.body[field] !== undefined) {
      if (field === 'due_date') {
        updateData[field] = req.body[field] ? new Date(req.body[field]) : null;
      } else if (field === 'tags' || field === 'metadata') {
        updateData[field] = JSON.stringify(req.body[field]);
      } else {
        updateData[field] = req.body[field];
      }
    }
  });
  
  if (Object.keys(updateData).length === 0) {
    return next(new AppError('没有提供要更新的字段', 400));
  }
  
  // 更新任务
  const updatedTask = await prisma.task.update({
    where: { id: req.params.id },
    data: updateData
  });
  
  // 记录业务事件
  logBusinessEvent('task_updated', {
    userId: req.user.id,
    taskId: updatedTask.id,
    updatedFields: Object.keys(updateData)
  });
  
  // 解析 JSON 字段
  const taskWithParsedData = {
    ...updatedTask,
    tags: updatedTask.tags ? JSON.parse(updatedTask.tags) : [],
    metadata: updatedTask.metadata ? JSON.parse(updatedTask.metadata) : {}
  };
  
  res.json(taskWithParsedData);
}));

/**
 * 删除任务
 * DELETE /tasks/:id
 */
router.delete('/:id', catchAsync(async (req, res, next) => {
  // 检查任务是否存在且属于当前用户
  const existingTask = await prisma.task.findFirst({
    where: {
      id: req.params.id,
      user_id: req.user.id
    }
  });
  
  if (!existingTask) {
    return next(new AppError('任务不存在', 404));
  }
  
  // 删除任务
  await prisma.task.delete({
    where: { id: req.params.id }
  });
  
  // 记录业务事件
  logBusinessEvent('task_deleted', {
    userId: req.user.id,
    taskId: req.params.id
  });
  
  res.json({ message: '任务删除成功' });
}));

/**
 * 批量更新任务状态
 * PATCH /tasks/batch/status
 */
router.patch('/batch/status', [
  body('task_ids').isArray({ min: 1 }).withMessage('任务ID列表不能为空'),
  body('status').isIn(['PENDING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED']).withMessage('状态无效')
], catchAsync(async (req, res, next) => {
  // 验证输入
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return next(new AppError('输入验证失败', 400));
  }
  
  const { task_ids, status } = req.body;
  
  // 批量更新任务状态
  const result = await prisma.task.updateMany({
    where: {
      id: { in: task_ids },
      user_id: req.user.id
    },
    data: { status }
  });
  
  // 记录业务事件
  logBusinessEvent('tasks_batch_updated', {
    userId: req.user.id,
    taskIds: task_ids,
    status,
    updatedCount: result.count
  });
  
  res.json({
    message: `成功更新 ${result.count} 个任务的状态`,
    updated_count: result.count
  });
}));

/**
 * 获取任务统计
 * GET /tasks/stats
 */
router.get('/stats/overview', catchAsync(async (req, res, next) => {
  const userId = req.user.id;
  
  // 获取各种状态的任务数量
  const [total, pending, inProgress, completed, cancelled] = await Promise.all([
    prisma.task.count({ where: { user_id: userId } }),
    prisma.task.count({ where: { user_id: userId, status: 'PENDING' } }),
    prisma.task.count({ where: { user_id: userId, status: 'IN_PROGRESS' } }),
    prisma.task.count({ where: { user_id: userId, status: 'COMPLETED' } }),
    prisma.task.count({ where: { user_id: userId, status: 'CANCELLED' } })
  ]);
  
  // 获取优先级分布
  const [low, medium, high] = await Promise.all([
    prisma.task.count({ where: { user_id: userId, priority: 'LOW' } }),
    prisma.task.count({ where: { user_id: userId, priority: 'MEDIUM' } }),
    prisma.task.count({ where: { user_id: userId, priority: 'HIGH' } })
  ]);
  
  // 获取最近7天的任务创建趋势
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  
  const recentTasks = await prisma.task.findMany({
    where: {
      user_id: userId,
      created_at: { gte: sevenDaysAgo }
    },
    select: {
      created_at: true,
      status: true
    }
  });
  
  // 按日期分组统计
  const dailyStats = {};
  recentTasks.forEach(task => {
    const date = task.created_at.toISOString().split('T')[0];
    if (!dailyStats[date]) {
      dailyStats[date] = { created: 0, completed: 0 };
    }
    dailyStats[date].created++;
    if (task.status === 'COMPLETED') {
      dailyStats[date].completed++;
    }
  });
  
  res.json({
    overview: {
      total,
      pending,
      in_progress: inProgress,
      completed,
      cancelled
    },
    priority_distribution: {
      low,
      medium,
      high
    },
    recent_trends: dailyStats
  });
}));

export default router;
