// 简化的用户登录 API - 用于调试
import { createClient } from '@supabase/supabase-js'
import bcrypt from 'bcryptjs'

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://lpelllegamiqdwtgqmsy.supabase.co'
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxwZWxsbGVnYW1pcWR3dGdxbXN5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg4MDE4MDgsImV4cCI6MjA3NDM3NzgwOH0.IGt6WyLt4WPXQ7lN4ofCb389yTKUXY4kEDmWK7Sx4as'

// 创建 Supabase 客户端
const supabase = createClient(supabaseUrl, supabaseKey)

export default async function handler(req, res) {
  console.log('=== 登录 API 开始 ===')
  console.log('请求方法:', req.method)
  console.log('请求体:', req.body)
  
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
    const { email, password } = req.body;
    console.log('解析的请求数据:', { email, password: password ? '***' : '未提供' });

    if (!email || !password) {
      console.log('缺少必填字段')
      return res.status(400).json({ error: '邮箱和密码都是必填项' });
    }

    // 测试 Supabase 连接
    console.log('测试 Supabase 连接...')
    try {
      const { data: testData, error: testError } = await supabase
        .from('users')
        .select('count')
        .limit(1);
      
      if (testError) {
        console.error('Supabase 连接测试失败:', testError);
        // 如果 Supabase 连接失败，使用模拟登录
        console.log('使用模拟登录...')
        const mockUser = {
          id: 'mock-' + Date.now(),
          email: email,
          name: '模拟用户',
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
        
        console.log('模拟登录成功')
        return res.status(200).json({
          success: true,
          user: mockUser,
          token: token,
          message: '登录成功（模拟模式）'
        });
      } else {
        console.log('Supabase 连接测试成功')
      }
    } catch (connectionError) {
      console.error('Supabase 连接异常:', connectionError);
      // 继续使用模拟登录
    }

    // 查找用户
    console.log('查找用户...')
    const { data: user, error: fetchError } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single();

    if (fetchError) {
      if (fetchError.code === 'PGRST116') {
        console.log('用户不存在')
        return res.status(401).json({ error: '用户不存在' });
      }
      console.error('查找用户错误:', fetchError);
      return res.status(500).json({ error: '数据库查询失败' });
    }

    // 验证密码
    console.log('验证密码...')
    const isPasswordValid = await bcrypt.compare(password, user.password_hash);
    if (!isPasswordValid) {
      console.log('密码错误')
      return res.status(401).json({ error: '密码错误' });
    }

    // 生成简单的 token（base64 编码）
    console.log('生成 token...')
    const token = Buffer.from(JSON.stringify({
      user_id: user.id,
      email: user.email,
      name: user.name,
      exp: Date.now() + 7 * 24 * 60 * 60 * 1000 // 7天后过期
    })).toString('base64');

    console.log('登录成功，用户ID:', user.id)
    res.status(200).json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        language: user.language,
        has_seen_welcome_guide: user.has_seen_welcome_guide,
        auto_rollover_enabled: user.auto_rollover_enabled,
        auto_rollover_days: user.auto_rollover_days,
        rollover_notification_enabled: user.rollover_notification_enabled,
        ai_daily_insights: user.ai_daily_insights,
        ai_weekly_insights: user.ai_weekly_insights,
        ai_url_extraction: user.ai_url_extraction
      },
      token: token,
      message: '登录成功'
    });

  } catch (error) {
    console.error('登录错误:', error);
    res.status(500).json({ error: '服务器内部错误: ' + error.message });
  } finally {
    console.log('=== 登录 API 结束 ===')
  }
}