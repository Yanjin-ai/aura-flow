// JWT 工具函数
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production'
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d'

/**
 * 生成 JWT token
 */
export function generateToken(payload) {
  return jwt.sign(payload, JWT_SECRET, { 
    expiresIn: JWT_EXPIRES_IN,
    issuer: 'aura-flow',
    audience: 'aura-flow-users'
  })
}

/**
 * 验证 JWT token
 */
export function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET, {
      issuer: 'aura-flow',
      audience: 'aura-flow-users'
    })
  } catch (error) {
    throw new Error('无效的认证令牌')
  }
}

/**
 * 从请求头中提取 token
 */
export function extractTokenFromHeader(authHeader) {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new Error('未提供有效的认证令牌')
  }
  
  return authHeader.substring(7)
}

/**
 * 中间件：验证 JWT token
 */
export function authenticateToken(req, res, next) {
  try {
    const authHeader = req.headers.authorization
    const token = extractTokenFromHeader(authHeader)
    const decoded = verifyToken(token)
    
    req.user = decoded
    next()
  } catch (error) {
    res.status(401).json({ error: error.message })
  }
}
