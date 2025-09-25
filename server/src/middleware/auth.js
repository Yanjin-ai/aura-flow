/**
 * 认证中间件
 * 处理 JWT 令牌验证和用户认证
 */

import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';
import { logger } from './logger.js';

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

/**
 * 验证 JWT 令牌
 */
export const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({ error: '访问令牌缺失' });
    }

    // 验证令牌
    const decoded = jwt.verify(token, JWT_SECRET);
    
    // 检查用户是否存在
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        email: true,
        name: true,
        created_at: true
      }
    });

    if (!user) {
      return res.status(401).json({ error: '用户不存在' });
    }

    // 检查会话是否有效
    const session = await prisma.session.findFirst({
      where: {
        user_id: user.id,
        token_hash: token,
        expires_at: {
          gt: new Date()
        }
      }
    });

    if (!session) {
      return res.status(401).json({ error: '会话已过期' });
    }

    // 将用户信息添加到请求对象
    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ error: '无效的访问令牌' });
    } else if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: '访问令牌已过期' });
    } else {
      logger.error('认证中间件错误', { error: error.message });
      return res.status(500).json({ error: '认证失败' });
    }
  }
};

/**
 * 可选的认证中间件（不强制要求认证）
 */
export const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (token) {
      const decoded = jwt.verify(token, JWT_SECRET);
      const user = await prisma.user.findUnique({
        where: { id: decoded.userId },
        select: {
          id: true,
          email: true,
          name: true,
          created_at: true
        }
      });

      if (user) {
        req.user = user;
      }
    }

    next();
  } catch (error) {
    // 可选认证失败时不阻止请求继续
    next();
  }
};

/**
 * 生成 JWT 令牌
 */
export const generateToken = (userId) => {
  return jwt.sign(
    { userId },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
};

/**
 * 验证令牌并返回用户信息
 */
export const verifyToken = (token) => {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    return null;
  }
};
