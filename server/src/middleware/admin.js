/**
 * 管理员权限中间件
 * 检查用户是否具有管理员权限
 */

import { PrismaClient } from '@prisma/client';
import { logger } from './logger.js';

const prisma = new PrismaClient();

// 管理员邮箱列表（生产环境应从环境变量或数据库读取）
const ADMIN_EMAILS = process.env.ADMIN_EMAILS?.split(',') || [
  'admin@auraflow.com',
  'demo@auraflow.com'
];

/**
 * 检查用户是否为管理员
 */
export const isAdmin = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: '未认证' });
    }
    
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: { email: true, id: true }
    });
    
    if (!user) {
      return res.status(404).json({ error: '用户不存在' });
    }
    
    // 检查是否为管理员邮箱
    if (!ADMIN_EMAILS.includes(user.email)) {
      logger.warn('非管理员尝试访问管理功能', {
        userId: user.id,
        email: user.email,
        path: req.path,
        method: req.method
      });
      return res.status(403).json({ error: '权限不足' });
    }
    
    // 记录管理员操作
    logger.info('管理员操作', {
      adminId: user.id,
      adminEmail: user.email,
      path: req.path,
      method: req.method,
      ip: req.ip,
      userAgent: req.get('User-Agent')
    });
    
    next();
  } catch (error) {
    logger.error('管理员权限检查失败', { error: error.message });
    res.status(500).json({ error: '权限检查失败' });
  }
};

/**
 * 检查用户是否为管理员（同步版本）
 */
export const isAdminSync = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ error: '未认证' });
  }
  
  // 这里可以添加更多同步检查逻辑
  // 比如从 JWT token 中读取角色信息
  if (req.user.role === 'admin') {
    return next();
  }
  
  return res.status(403).json({ error: '权限不足' });
};

/**
 * 获取管理员列表
 */
export const getAdminList = () => {
  return ADMIN_EMAILS;
};

/**
 * 添加管理员
 */
export const addAdmin = (email) => {
  if (!ADMIN_EMAILS.includes(email)) {
    ADMIN_EMAILS.push(email);
    logger.info('添加管理员', { email });
    return true;
  }
  return false;
};

/**
 * 移除管理员
 */
export const removeAdmin = (email) => {
  const index = ADMIN_EMAILS.indexOf(email);
  if (index > -1) {
    ADMIN_EMAILS.splice(index, 1);
    logger.info('移除管理员', { email });
    return true;
  }
  return false;
};
