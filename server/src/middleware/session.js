/**
 * 会话和 Cookie 管理中间件
 * 支持 JWT 和刷新令牌旋转
 */

import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * 生成访问令牌
 */
export const generateAccessToken = (userId, userRole = 'user') => {
  return jwt.sign(
    { 
      userId, 
      role: userRole,
      type: 'access'
    },
    process.env.JWT_SECRET,
    { 
      expiresIn: process.env.JWT_EXPIRES_IN || '15m',
      issuer: 'aura-flow',
      audience: 'aura-flow-client'
    }
  );
};

/**
 * 生成刷新令牌
 */
export const generateRefreshToken = (userId) => {
  return jwt.sign(
    { 
      userId,
      type: 'refresh',
      version: Date.now() // 用于令牌版本控制
    },
    process.env.REFRESH_TOKEN_SECRET,
    { 
      expiresIn: process.env.REFRESH_TOKEN_EXPIRES_IN || '7d',
      issuer: 'aura-flow',
      audience: 'aura-flow-client'
    }
  );
};

/**
 * 验证访问令牌
 */
export const verifyAccessToken = (token) => {
  try {
    return jwt.verify(token, process.env.JWT_SECRET);
  } catch (error) {
    throw new Error('无效的访问令牌');
  }
};

/**
 * 验证刷新令牌
 */
export const verifyRefreshToken = (token) => {
  try {
    return jwt.verify(token, process.env.REFRESH_TOKEN_SECRET);
  } catch (error) {
    throw new Error('无效的刷新令牌');
  }
};

/**
 * 设置安全 Cookie
 */
export const setSecureCookie = (res, name, value, options = {}) => {
  const defaultOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.SAME_SITE_COOKIES || 'strict',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7天
    path: '/'
  };
  
  const cookieOptions = { ...defaultOptions, ...options };
  res.cookie(name, value, cookieOptions);
};

/**
 * 清除 Cookie
 */
export const clearCookie = (res, name) => {
  res.clearCookie(name, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.SAME_SITE_COOKIES || 'strict',
    path: '/'
  });
};

/**
 * 登录中间件 - 设置认证 Cookie
 */
export const setAuthCookies = async (req, res, next) => {
  try {
    const { userId, userRole } = req.user;
    
    // 生成令牌
    const accessToken = generateAccessToken(userId, userRole);
    const refreshToken = generateRefreshToken(userId);
    
    // 存储刷新令牌到数据库
    const tokenHash = await bcrypt.hash(refreshToken, 12);
    await prisma.session.create({
      data: {
        user_id: userId,
        token_hash: tokenHash,
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7天后过期
      }
    });
    
    // 设置安全 Cookie
    setSecureCookie(res, 'access_token', accessToken, {
      maxAge: 15 * 60 * 1000 // 15分钟
    });
    
    setSecureCookie(res, 'refresh_token', refreshToken, {
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7天
    });
    
    // 将令牌添加到响应中（用于 API 调用）
    res.locals.tokens = {
      accessToken,
      refreshToken
    };
    
    next();
  } catch (error) {
    console.error('设置认证 Cookie 失败:', error);
    res.status(500).json({ error: '认证设置失败' });
  }
};

/**
 * 刷新令牌中间件
 */
export const refreshTokenMiddleware = async (req, res, next) => {
  try {
    const refreshToken = req.cookies.refresh_token;
    
    if (!refreshToken) {
      return res.status(401).json({ error: '缺少刷新令牌' });
    }
    
    // 验证刷新令牌
    const decoded = verifyRefreshToken(refreshToken);
    
    // 查找会话
    const sessions = await prisma.session.findMany({
      where: {
        user_id: decoded.userId,
        expires_at: {
          gt: new Date()
        }
      }
    });
    
    // 验证令牌哈希
    let validSession = null;
    for (const session of sessions) {
      if (await bcrypt.compare(refreshToken, session.token_hash)) {
        validSession = session;
        break;
      }
    }
    
    if (!validSession) {
      return res.status(401).json({ error: '无效的刷新令牌' });
    }
    
    // 获取用户信息
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { id: true, email: true, name: true, role: true }
    });
    
    if (!user) {
      return res.status(401).json({ error: '用户不存在' });
    }
    
    // 生成新的访问令牌
    const newAccessToken = generateAccessToken(user.id, user.role);
    
    // 设置新的访问令牌 Cookie
    setSecureCookie(res, 'access_token', newAccessToken, {
      maxAge: 15 * 60 * 1000 // 15分钟
    });
    
    // 将用户信息添加到请求中
    req.user = user;
    res.locals.newAccessToken = newAccessToken;
    
    next();
  } catch (error) {
    console.error('刷新令牌失败:', error);
    res.status(401).json({ error: '令牌刷新失败' });
  }
};

/**
 * 令牌旋转中间件（刷新令牌时）
 */
export const rotateRefreshToken = async (req, res, next) => {
  try {
    const oldRefreshToken = req.cookies.refresh_token;
    
    if (!oldRefreshToken) {
      return next();
    }
    
    // 验证旧刷新令牌
    const decoded = verifyRefreshToken(oldRefreshToken);
    
    // 查找并删除旧会话
    const sessions = await prisma.session.findMany({
      where: {
        user_id: decoded.userId,
        expires_at: {
          gt: new Date()
        }
      }
    });
    
    for (const session of sessions) {
      if (await bcrypt.compare(oldRefreshToken, session.token_hash)) {
        await prisma.session.delete({
          where: { id: session.id }
        });
        break;
      }
    }
    
    // 生成新的刷新令牌
    const newRefreshToken = generateRefreshToken(decoded.userId);
    const tokenHash = await bcrypt.hash(newRefreshToken, 12);
    
    // 创建新会话
    await prisma.session.create({
      data: {
        user_id: decoded.userId,
        token_hash: tokenHash,
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
      }
    });
    
    // 设置新的刷新令牌 Cookie
    setSecureCookie(res, 'refresh_token', newRefreshToken, {
      maxAge: 7 * 24 * 60 * 60 * 1000
    });
    
    res.locals.newRefreshToken = newRefreshToken;
    
    next();
  } catch (error) {
    console.error('令牌旋转失败:', error);
    // 令牌旋转失败不应该阻止请求继续
    next();
  }
};

/**
 * 登出中间件 - 清除认证 Cookie
 */
export const clearAuthCookies = async (req, res, next) => {
  try {
    const refreshToken = req.cookies.refresh_token;
    
    // 清除 Cookie
    clearCookie(res, 'access_token');
    clearCookie(res, 'refresh_token');
    
    // 如果存在刷新令牌，从数据库中删除会话
    if (refreshToken) {
      try {
        const decoded = verifyRefreshToken(refreshToken);
        const sessions = await prisma.session.findMany({
          where: {
            user_id: decoded.userId,
            expires_at: {
              gt: new Date()
            }
          }
        });
        
        for (const session of sessions) {
          if (await bcrypt.compare(refreshToken, session.token_hash)) {
            await prisma.session.delete({
              where: { id: session.id }
            });
            break;
          }
        }
      } catch (error) {
        // 忽略令牌验证错误，继续清除操作
        console.warn('清除会话时令牌验证失败:', error.message);
      }
    }
    
    next();
  } catch (error) {
    console.error('清除认证 Cookie 失败:', error);
    res.status(500).json({ error: '登出失败' });
  }
};

/**
 * 清理过期会话的定时任务
 */
export const cleanupExpiredSessions = async () => {
  try {
    const result = await prisma.session.deleteMany({
      where: {
        expires_at: {
          lt: new Date()
        }
      }
    });
    
    console.log(`清理了 ${result.count} 个过期会话`);
  } catch (error) {
    console.error('清理过期会话失败:', error);
  }
};

// 每小时清理一次过期会话
setInterval(cleanupExpiredSessions, 60 * 60 * 1000);
