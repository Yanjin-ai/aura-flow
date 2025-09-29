// 简化的登录 API - 不依赖数据库
export default async function handler(req, res) {
  console.log('Login Simple API called');
  console.log('Request method:', req.method);
  console.log('Request body:', req.body);

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
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: '邮箱和密码都是必填项' });
    }

    // 简单的用户验证（暂时不使用数据库）
    const user = {
      id: 'user_' + Date.now(),
      email: email,
      name: '用户',
      created_at: new Date().toISOString()
    };

    // 生成简单的 token
    const token = Buffer.from(JSON.stringify({
      user_id: user.id,
      email: user.email,
      exp: Date.now() + 7 * 24 * 60 * 60 * 1000 // 7天过期
    })).toString('base64');

    console.log('User login:', user);
    console.log('Token generated:', token);

    res.status(200).json({
      success: true,
      user: user,
      token: token,
      message: '登录成功（测试版本）'
    });

  } catch (error) {
    console.error('登录错误:', error);
    res.status(500).json({ error: '服务器内部错误: ' + error.message });
  }
}
