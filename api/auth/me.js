// 简化的用户信息 API - 暂时不使用数据库
export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: '未提供有效的认证令牌' });
    }

    const token = authHeader.substring(7);
    
    // 解码 token
    const tokenData = JSON.parse(Buffer.from(token, 'base64').toString());

    // 检查 token 是否过期
    if (tokenData.exp && Date.now() > tokenData.exp) {
      return res.status(401).json({ error: '认证令牌已过期' });
    }

    // 返回用户信息（暂时不使用数据库）
    const user = {
      id: tokenData.user_id,
      email: tokenData.email,
      name: '用户',
      has_seen_welcome_guide: true,
      language: 'zh-CN',
      auto_rollover_enabled: true,
      auto_rollover_days: 3,
      rollover_notification_enabled: true,
      ai_daily_insights: true,
      ai_weekly_insights: true,
      ai_url_extraction: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    res.status(200).json({
      success: true,
      user: user
    });

  } catch (error) {
    console.error('获取用户信息错误:', error);
    res.status(401).json({ error: '无效的认证令牌' });
  }
}
