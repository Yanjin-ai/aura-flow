export default async function handler(req, res) {
  console.log('Register Simple Test API called');
  
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { email, password, name } = req.body;
    
    console.log('Request body:', { email, password, name });

    if (!email || !password || !name) {
      return res.status(400).json({ error: '邮箱、密码和姓名都是必填项' });
    }

    // 模拟用户创建（不依赖 Supabase）
    const mockUser = {
      id: 'user_' + Date.now(),
      email: email,
      name: name,
      created_at: new Date().toISOString()
    };

    // 生成简单的 token
    const tokenData = {
      user_id: mockUser.id,
      email: mockUser.email,
      exp: Date.now() + 7 * 24 * 60 * 60 * 1000 // 7天后过期
    };
    const token = Buffer.from(JSON.stringify(tokenData)).toString('base64');

    console.log('Mock user created:', mockUser);
    console.log('Token generated:', token);

    res.status(201).json({
      success: true,
      user: {
        id: mockUser.id,
        email: mockUser.email,
        name: mockUser.name
      },
      token: token,
      expires_at: new Date(tokenData.exp).toISOString(),
      message: '注册成功（测试版本）'
    });

  } catch (error) {
    console.error('Error in register-simple-test:', error);
    res.status(500).json({ error: '服务器内部错误' });
  }
}
