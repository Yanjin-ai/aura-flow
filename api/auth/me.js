// 用户信息 API
export default async function handler(req, res) {
  
  // 设置 CORS 头
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // 检查 Authorization 头
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: '未提供有效的认证令牌' });
    }

    // 提取 token
    const token = authHeader.substring(7);

    // 解析 token（base64 编码的 JSON）
    let tokenData;
    try {
      const decodedToken = Buffer.from(token, 'base64').toString();
      tokenData = JSON.parse(decodedToken);
    } catch (parseError) {
      return res.status(401).json({ error: '无效的认证令牌格式' });
    }

    // 检查 token 是否过期
    if (tokenData.exp && Date.now() > tokenData.exp) {
      return res.status(401).json({ error: '认证令牌已过期' });
    }

    // 返回模拟用户数据
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
      user: mockUser
    });

  } catch (error) {
    res.status(401).json({ error: '无效的认证令牌: ' + error.message });
  }
}
