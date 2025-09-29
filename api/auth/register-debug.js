// 调试版本的注册 API
export default async function handler(req, res) {
  console.log('=== 调试注册 API 开始 ===')
  console.log('请求方法:', req.method)
  console.log('请求体:', req.body)
  console.log('环境变量检查:')
  console.log('- VITE_SUPABASE_URL:', process.env.VITE_SUPABASE_URL ? '已设置' : '未设置')
  console.log('- VITE_SUPABASE_ANON_KEY:', process.env.VITE_SUPABASE_ANON_KEY ? '已设置' : '未设置')
  console.log('- NODE_ENV:', process.env.NODE_ENV)
  console.log('- VERCEL:', process.env.VERCEL)
  
  // 设置 CORS 头
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    console.log('处理 OPTIONS 请求')
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    console.log('方法不允许:', req.method)
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { email, password, name } = req.body;
    console.log('解析的请求数据:', { email, name, password: password ? '***' : '未提供' });

    if (!email || !password || !name) {
      console.log('缺少必填字段')
      return res.status(400).json({ error: '邮箱、密码和姓名都是必填项' });
    }

    // 直接返回模拟数据，不尝试连接 Supabase
    console.log('创建模拟用户...')
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
    
    console.log('模拟用户创建成功，用户ID:', mockUser.id)
    return res.status(201).json({
      success: true,
      user: mockUser,
      token: token,
      message: '注册成功（调试模式）'
    });

  } catch (error) {
    console.error('注册错误:', error);
    res.status(500).json({ error: '服务器内部错误: ' + error.message });
  } finally {
    console.log('=== 调试注册 API 结束 ===')
  }
}
