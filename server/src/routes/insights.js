/**
 * 洞察管理路由
 * 处理 AI 生成的洞察和用户反馈
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
 * 获取洞察列表
 * GET /insights
 */
router.get('/', [
  query('type').optional().isIn(['DAILY', 'WEEKLY', 'CUSTOM']),
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 })
], catchAsync(async (req, res, next) => {
  // 验证查询参数
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return next(new AppError('查询参数验证失败', 400));
  }
  
  const { type, page = 1, limit = 20 } = req.query;
  const skip = (page - 1) * limit;
  
  // 构建查询条件
  const where = {
    user_id: req.user.id
  };
  
  if (type) {
    where.type = type;
  }
  
  // 查询洞察
  const [insights, total] = await Promise.all([
    prisma.insight.findMany({
      where,
      skip: parseInt(skip),
      take: parseInt(limit),
      orderBy: {
        created_at: 'desc'
      },
      include: {
        feedback: {
          select: {
            id: true,
            rating: true,
            comment: true,
            created_at: true
          }
        }
      }
    }),
    prisma.insight.count({ where })
  ]);
  
  // 解析 JSON 字段
  const insightsWithParsedData = insights.map(insight => ({
    ...insight,
    metadata: insight.metadata ? JSON.parse(insight.metadata) : {}
  }));
  
  res.json({
    insights: insightsWithParsedData,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      pages: Math.ceil(total / limit)
    }
  });
}));

/**
 * 获取单个洞察
 * GET /insights/:id
 */
router.get('/:id', catchAsync(async (req, res, next) => {
  const insight = await prisma.insight.findFirst({
    where: {
      id: req.params.id,
      user_id: req.user.id
    },
    include: {
      feedback: {
        select: {
          id: true,
          rating: true,
          comment: true,
          created_at: true
        }
      }
    }
  });
  
  if (!insight) {
    return next(new AppError('洞察不存在', 404));
  }
  
  // 解析 JSON 字段
  const insightWithParsedData = {
    ...insight,
    metadata: insight.metadata ? JSON.parse(insight.metadata) : {}
  };
  
  res.json(insightWithParsedData);
}));

/**
 * 创建洞察
 * POST /insights
 */
router.post('/', [
  body('title').isLength({ min: 1, max: 200 }).withMessage('洞察标题长度应在1-200个字符之间'),
  body('content').isLength({ min: 1, max: 5000 }).withMessage('洞察内容长度应在1-5000个字符之间'),
  body('type').isIn(['DAILY', 'WEEKLY', 'CUSTOM']).withMessage('洞察类型必须是 DAILY、WEEKLY 或 CUSTOM'),
  body('metadata').optional().isObject().withMessage('元数据必须是对象')
], catchAsync(async (req, res, next) => {
  // 验证输入
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return next(new AppError('输入验证失败', 400));
  }
  
  const { title, content, type, metadata = {} } = req.body;
  
  // 创建洞察
  const insight = await prisma.insight.create({
    data: {
      title,
      content,
      type,
      user_id: req.user.id,
      metadata: JSON.stringify(metadata)
    }
  });
  
  // 记录业务事件
  logBusinessEvent('insight_created', {
    userId: req.user.id,
    insightId: insight.id,
    type: insight.type
  });
  
  // 解析 JSON 字段
  const insightWithParsedData = {
    ...insight,
    metadata: JSON.parse(insight.metadata)
  };
  
  res.status(201).json(insightWithParsedData);
}));

/**
 * 提交洞察反馈
 * POST /insights/:id/feedback
 */
router.post('/:id/feedback', [
  body('rating').isInt({ min: 1, max: 5 }).withMessage('评分必须在1-5之间'),
  body('comment').optional().isLength({ max: 500 }).withMessage('评论不能超过500个字符')
], catchAsync(async (req, res, next) => {
  // 验证输入
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return next(new AppError('输入验证失败', 400));
  }
  
  const { rating, comment } = req.body;
  const insightId = req.params.id;
  
  // 检查洞察是否存在且属于当前用户
  const insight = await prisma.insight.findFirst({
    where: {
      id: insightId,
      user_id: req.user.id
    }
  });
  
  if (!insight) {
    return next(new AppError('洞察不存在', 404));
  }
  
  // 检查是否已经提交过反馈
  const existingFeedback = await prisma.insightFeedback.findFirst({
    where: {
      insight_id: insightId,
      user_id: req.user.id
    }
  });
  
  if (existingFeedback) {
    return next(new AppError('您已经为此洞察提交过反馈', 409));
  }
  
  // 创建反馈
  const feedback = await prisma.insightFeedback.create({
    data: {
      insight_id: insightId,
      rating,
      comment,
      user_id: req.user.id
    }
  });
  
  // 记录业务事件
  logBusinessEvent('insight_feedback_submitted', {
    userId: req.user.id,
    insightId: insightId,
    rating: rating
  });
  
  res.status(201).json(feedback);
}));

/**
 * 更新洞察反馈
 * PATCH /insights/:id/feedback
 */
router.patch('/:id/feedback', [
  body('rating').isInt({ min: 1, max: 5 }).withMessage('评分必须在1-5之间'),
  body('comment').optional().isLength({ max: 500 }).withMessage('评论不能超过500个字符')
], catchAsync(async (req, res, next) => {
  // 验证输入
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return next(new AppError('输入验证失败', 400));
  }
  
  const { rating, comment } = req.body;
  const insightId = req.params.id;
  
  // 查找现有反馈
  const existingFeedback = await prisma.insightFeedback.findFirst({
    where: {
      insight_id: insightId,
      user_id: req.user.id
    }
  });
  
  if (!existingFeedback) {
    return next(new AppError('反馈不存在', 404));
  }
  
  // 更新反馈
  const updatedFeedback = await prisma.insightFeedback.update({
    where: { id: existingFeedback.id },
    data: {
      rating,
      comment
    }
  });
  
  // 记录业务事件
  logBusinessEvent('insight_feedback_updated', {
    userId: req.user.id,
    insightId: insightId,
    rating: rating
  });
  
  res.json(updatedFeedback);
}));

/**
 * 删除洞察
 * DELETE /insights/:id
 */
router.delete('/:id', catchAsync(async (req, res, next) => {
  // 检查洞察是否存在且属于当前用户
  const existingInsight = await prisma.insight.findFirst({
    where: {
      id: req.params.id,
      user_id: req.user.id
    }
  });
  
  if (!existingInsight) {
    return next(new AppError('洞察不存在', 404));
  }
  
  // 删除洞察（关联的反馈会自动删除）
  await prisma.insight.delete({
    where: { id: req.params.id }
  });
  
  // 记录业务事件
  logBusinessEvent('insight_deleted', {
    userId: req.user.id,
    insightId: req.params.id
  });
  
  res.json({ message: '洞察删除成功' });
}));

/**
 * 获取洞察统计
 * GET /insights/stats
 */
router.get('/stats/overview', catchAsync(async (req, res, next) => {
  const userId = req.user.id;
  
  // 获取各种类型的洞察数量
  const [total, daily, weekly, custom] = await Promise.all([
    prisma.insight.count({ where: { user_id: userId } }),
    prisma.insight.count({ where: { user_id: userId, type: 'DAILY' } }),
    prisma.insight.count({ where: { user_id: userId, type: 'WEEKLY' } }),
    prisma.insight.count({ where: { user_id: userId, type: 'CUSTOM' } })
  ]);
  
  // 获取反馈统计
  const feedbackStats = await prisma.insightFeedback.groupBy({
    by: ['rating'],
    where: {
      user: { id: userId }
    },
    _count: {
      rating: true
    }
  });
  
  // 计算平均评分
  const totalFeedback = await prisma.insightFeedback.count({
    where: {
      user: { id: userId }
    }
  });
  
  const averageRating = totalFeedback > 0 ? 
    await prisma.insightFeedback.aggregate({
      where: {
        user: { id: userId }
      },
      _avg: {
        rating: true
      }
    }) : { _avg: { rating: 0 } };
  
  // 获取最近7天的洞察创建趋势
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  
  const recentInsights = await prisma.insight.findMany({
    where: {
      user_id: userId,
      created_at: { gte: sevenDaysAgo }
    },
    select: {
      created_at: true,
      type: true
    }
  });
  
  // 按日期和类型分组统计
  const dailyStats = {};
  recentInsights.forEach(insight => {
    const date = insight.created_at.toISOString().split('T')[0];
    if (!dailyStats[date]) {
      dailyStats[date] = { daily: 0, weekly: 0, custom: 0 };
    }
    dailyStats[date][insight.type.toLowerCase()]++;
  });
  
  res.json({
    overview: {
      total,
      daily,
      weekly,
      custom
    },
    feedback: {
      total_feedback: totalFeedback,
      average_rating: averageRating._avg.rating || 0,
      rating_distribution: feedbackStats.reduce((acc, stat) => {
        acc[`rating_${stat.rating}`] = stat._count.rating;
        return acc;
      }, {})
    },
    recent_trends: dailyStats
  });
}));

export default router;
