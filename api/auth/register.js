// 用户注册 API
export default async function handler(req, res) {
  
  // 设置 CORS 头
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { email, password, name } = req.body;

    if (!email || !password || !name) {
      return res.status(400).json({ error: '邮箱、密码和姓名都是必填项' });
    }

    // 创建模拟用户
    const mockUser = {
      id: 'mock-' + Date.now(),
      email: email,
      name: name,
      language: 'zh-CN',
      has_seen_welcome_guide: false,
      auto_rollover_enabled: true,
      auto_rollover_days: 7,
      rollover_notification_enabled: true,
      ai_daily_insights: true,
      ai_weekly_insights: true,
      ai_url_extraction: true
    };
    
    // 生成简单的 token（base64 编码）
    const token = Buffer.from(JSON.stringify({
      user_id: mockUser.id,
      email: mockUser.email,
      name: mockUser.name,
      exp: Date.now() + 7 * 24 * 60 * 60 * 1000 // 7天后过期
    })).toString('base64');
    
    return res.status(201).json({
      success: true,
      user: mockUser,
      token: token,
      message: '注册成功'
    });

  } catch (error) {
    res.status(500).json({ error: '服务器内部错误: ' + error.message });
  }
}
