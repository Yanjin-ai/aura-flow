// 用户信息 API（JWT 验证，v2 路由避免缓存）
import { extractTokenFromHeader, verifyToken } from './jwt.js'

export default async function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const token = extractTokenFromHeader(req.headers.authorization)
    const decoded = verifyToken(token)

    const user = {
      id: decoded.user_id,
      email: decoded.email,
      name: decoded.name,
      language: 'zh-CN',
      has_seen_welcome_guide: false,
      auto_rollover_enabled: true,
      auto_rollover_days: 7,
      rollover_notification_enabled: true,
      ai_daily_insights: true,
      ai_weekly_insights: true,
      ai_url_extraction: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }

    return res.status(200).json({ success: true, user, source: 'me-jwt-v2-route' })
  } catch (error) {
    return res.status(401).json({ error: error.message || '无效的认证令牌' })
  }
}

// 简单注释：新增 v2 路由，确保使用 JWT 校验，绕过旧函数部署缓存。

