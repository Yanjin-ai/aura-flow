export default async function handler(req, res) {
  console.log('Me Simple Test API called');
  
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const authHeader = req.headers.authorization;
    console.log('Authorization header:', authHeader);

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: '未提供有效的认证令牌' });
    }

    const token = authHeader.substring(7); // 移除 'Bearer ' 前缀
    console.log('Token:', token);

    // 解码 token
    const tokenData = JSON.parse(Buffer.from(token, 'base64').toString());
    console.log('Decoded token data:', tokenData);

    // 检查 token 是否过期
    if (tokenData.exp && Date.now() > tokenData.exp) {
      return res.status(401).json({ error: '认证令牌已过期' });
    }

    // 返回用户信息
    const mockUser = {
      id: tokenData.user_id,
      email: tokenData.email,
      name: '测试用户',
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

    console.log('Returning user:', mockUser);

    res.status(200).json({
      success: true,
      user: mockUser
    });

  } catch (error) {
    console.error('Error in me-simple-test:', error);
    res.status(401).json({ error: '无效的认证令牌' });
  }
}
