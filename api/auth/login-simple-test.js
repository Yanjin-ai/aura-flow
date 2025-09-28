export default async function handler(req, res) {
  console.log('Login Simple Test API called');
  
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { email, password } = req.body;
    
    console.log('Login request:', { email, password });

    if (!email || !password) {
      return res.status(400).json({ error: '邮箱和密码都是必填项' });
    }

    // 模拟用户验证（不依赖 Supabase）
    const mockUser = {
      id: 'user_' + Date.now(),
      email: email,
      name: '测试用户',
      created_at: new Date().toISOString()
    };

    // 生成简单的 token
    const tokenData = {
      user_id: mockUser.id,
      email: mockUser.email,
      exp: Date.now() + 7 * 24 * 60 * 60 * 1000 // 7天后过期
    };
    const token = Buffer.from(JSON.stringify(tokenData)).toString('base64');

    console.log('Mock user login:', mockUser);
    console.log('Token generated:', token);

    res.status(200).json({
      success: true,
      user: {
        id: mockUser.id,
        email: mockUser.email,
        name: mockUser.name
      },
      token: token,
      expires_at: new Date(tokenData.exp).toISOString(),
      message: '登录成功（测试版本）'
    });

  } catch (error) {
    console.error('Error in login-simple-test:', error);
    res.status(500).json({ error: '服务器内部错误' });
  }
}
