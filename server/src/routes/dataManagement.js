/**
 * 数据管理路由
 * 提供数据导出、删除等 GDPR 合规功能
 */

import express from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken } from '../middleware/auth.js';
import { logger } from '../middleware/logger.js';
import { isAdmin } from '../middleware/admin.js';

const router = express.Router();
const prisma = new PrismaClient();

// 导出我的数据
router.get('/export-my-data', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    
    logger.info('用户数据导出请求', { userId });
    
    // 获取用户所有数据
    const userData = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        tasks: true,
        insights: true,
        reflections: true,
        insight_feedback: true,
        sessions: {
          select: {
            id: true,
            created_at: true,
            expires_at: true
          }
        }
      }
    });
    
    if (!userData) {
      return res.status(404).json({ error: '用户不存在' });
    }
    
    // 移除敏感信息
    const exportData = {
      user: {
        id: userData.id,
        email: userData.email,
        name: userData.name,
        language: userData.language,
        auto_rollover_enabled: userData.auto_rollover_enabled,
        auto_rollover_days: userData.auto_rollover_days,
        rollover_notification_enabled: userData.rollover_notification_enabled,
        ai_daily_insights: userData.ai_daily_insights,
        ai_weekly_insights: userData.ai_weekly_insights,
        ai_url_extraction: userData.ai_url_extraction,
        created_at: userData.created_at,
        updated_at: userData.updated_at
      },
      tasks: userData.tasks,
      insights: userData.insights,
      reflections: userData.reflections,
      feedback: userData.insight_feedback,
      sessions: userData.sessions,
      export_date: new Date().toISOString(),
      export_version: '1.0'
    };
    
    // 设置响应头
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="aura-flow-data-${userId}-${Date.now()}.json"`);
    
    res.json(exportData);
    
    logger.info('用户数据导出完成', { userId, dataSize: JSON.stringify(exportData).length });
    
  } catch (error) {
    logger.error('数据导出失败', { error: error.message, userId: req.user?.id });
    res.status(500).json({ error: '数据导出失败' });
  }
});

// 删除我的数据（GDPR 合规）
router.post('/delete-my-data', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { confirmation } = req.body;
    
    if (confirmation !== 'DELETE_MY_DATA') {
      return res.status(400).json({ 
        error: '请确认删除操作，发送 confirmation: "DELETE_MY_DATA"' 
      });
    }
    
    logger.warn('用户数据删除请求', { userId });
    
    // 开始事务删除所有相关数据
    await prisma.$transaction(async (tx) => {
      // 删除反馈
      await tx.insightFeedback.deleteMany({
        where: { user_id: userId }
      });
      
      // 删除洞察
      await tx.insight.deleteMany({
        where: { user_id: userId }
      });
      
      // 删除反思
      await tx.reflection.deleteMany({
        where: { user_id: userId }
      });
      
      // 删除任务
      await tx.task.deleteMany({
        where: { user_id: userId }
      });
      
      // 删除会话
      await tx.session.deleteMany({
        where: { user_id: userId }
      });
      
      // 最后删除用户
      await tx.user.delete({
        where: { id: userId }
      });
    });
    
    logger.warn('用户数据删除完成', { userId });
    
    res.json({ 
      message: '用户数据已成功删除',
      deleted_at: new Date().toISOString()
    });
    
  } catch (error) {
    logger.error('数据删除失败', { error: error.message, userId: req.user?.id });
    res.status(500).json({ error: '数据删除失败' });
  }
});

// 获取数据统计（仅管理员）
router.get('/stats', authenticateToken, isAdmin, async (req, res) => {
  try {
    const stats = await prisma.$transaction(async (tx) => {
      const [
        totalUsers,
        totalTasks,
        totalInsights,
        totalReflections,
        activeUsers,
        recentUsers
      ] = await Promise.all([
        tx.user.count(),
        tx.task.count(),
        tx.insight.count(),
        tx.reflection.count(),
        tx.user.count({
          where: {
            sessions: {
              some: {
                expires_at: {
                  gt: new Date()
                }
              }
            }
          }
        }),
        tx.user.count({
          where: {
            created_at: {
              gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // 最近30天
            }
          }
        })
      ]);
      
      return {
        totalUsers,
        totalTasks,
        totalInsights,
        totalReflections,
        activeUsers,
        recentUsers
      };
    });
    
    res.json(stats);
    
  } catch (error) {
    logger.error('获取数据统计失败', { error: error.message });
    res.status(500).json({ error: '获取数据统计失败' });
  }
});

// 导出所有用户数据（仅管理员）
router.get('/export-all', authenticateToken, isAdmin, async (req, res) => {
  try {
    logger.warn('管理员导出所有用户数据', { adminId: req.user.id });
    
    const allData = await prisma.user.findMany({
      include: {
        tasks: true,
        insights: true,
        reflections: true,
        insight_feedback: true,
        sessions: {
          select: {
            id: true,
            created_at: true,
            expires_at: true
          }
        }
      }
    });
    
    const exportData = {
      users: allData.map(user => ({
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          language: user.language,
          auto_rollover_enabled: user.auto_rollover_enabled,
          auto_rollover_days: user.auto_rollover_days,
          rollover_notification_enabled: user.rollover_notification_enabled,
          ai_daily_insights: user.ai_daily_insights,
          ai_weekly_insights: user.ai_weekly_insights,
          ai_url_extraction: user.ai_url_extraction,
          created_at: user.created_at,
          updated_at: user.updated_at
        },
        tasks: user.tasks,
        insights: user.insights,
        reflections: user.reflections,
        feedback: user.insight_feedback,
        sessions: user.sessions
      })),
      export_date: new Date().toISOString(),
      export_version: '1.0',
      exported_by: req.user.id
    };
    
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="aura-flow-all-data-${Date.now()}.json"`);
    
    res.json(exportData);
    
    logger.warn('管理员导出所有用户数据完成', { 
      adminId: req.user.id, 
      userCount: allData.length,
      dataSize: JSON.stringify(exportData).length 
    });
    
  } catch (error) {
    logger.error('导出所有用户数据失败', { error: error.message, adminId: req.user?.id });
    res.status(500).json({ error: '导出所有用户数据失败' });
  }
});

// 删除指定用户数据（仅管理员）
router.delete('/delete-user/:userId', authenticateToken, isAdmin, async (req, res) => {
  try {
    const { userId } = req.params;
    const { confirmation } = req.body;
    
    if (confirmation !== 'DELETE_USER_DATA') {
      return res.status(400).json({ 
        error: '请确认删除操作，发送 confirmation: "DELETE_USER_DATA"' 
      });
    }
    
    logger.warn('管理员删除用户数据', { adminId: req.user.id, targetUserId: userId });
    
    // 检查用户是否存在
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });
    
    if (!user) {
      return res.status(404).json({ error: '用户不存在' });
    }
    
    // 删除用户数据
    await prisma.$transaction(async (tx) => {
      await tx.insightFeedback.deleteMany({ where: { user_id: userId } });
      await tx.insight.deleteMany({ where: { user_id: userId } });
      await tx.reflection.deleteMany({ where: { user_id: userId } });
      await tx.task.deleteMany({ where: { user_id: userId } });
      await tx.session.deleteMany({ where: { user_id: userId } });
      await tx.user.delete({ where: { id: userId } });
    });
    
    logger.warn('管理员删除用户数据完成', { adminId: req.user.id, targetUserId: userId });
    
    res.json({ 
      message: '用户数据已成功删除',
      deleted_user_id: userId,
      deleted_at: new Date().toISOString(),
      deleted_by: req.user.id
    });
    
  } catch (error) {
    logger.error('删除用户数据失败', { error: error.message, adminId: req.user?.id });
    res.status(500).json({ error: '删除用户数据失败' });
  }
});

export default router;
