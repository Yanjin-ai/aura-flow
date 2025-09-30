// 用户信息 API（JWT 验证 v2）
import { extractTokenFromHeader, verifyToken } from './jwt.js'

export default async function handler(req, res) {
  
  // 设置 CORS 头
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const token = extractTokenFromHeader(req.headers.authorization)
    const tokenData = verifyToken(token)

    // 返回用户数据（目前与登录/注册返回字段一致）
    const mockUser = {
      id: tokenData.user_id,
      email: tokenData.email,
      name: tokenData.name,
      language: 'zh-CN',
      has_seen_welcome_guide: false,
      auto_rollover_enabled: true,
      auto_rollover_days: 7,
      rollover_notification_enabled: true,
      ai_daily_insights: true,
      ai_weekly_insights: true,
      ai_url_extraction: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    return res.status(200).json({
      success: true,
      user: mockUser,
      source: 'me-jwt-v2'
    });

  } catch (error) {
    res.status(401).json({ error: '无效的认证令牌: ' + (error?.message || 'Unknown error') });
  }
}
