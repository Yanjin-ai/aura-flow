// 简化的用户注册 API - 用于调试
import { createClient } from '@supabase/supabase-js'
import bcrypt from 'bcryptjs'

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://lpelllegamiqdwtgqmsy.supabase.co'
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxwZWxsbGVnYW1pcWR3dGdxbXN5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg4MDE4MDgsImV4cCI6MjA3NDM3NzgwOH0.IGt6WyLt4WPXQ7lN4ofCb389yTKUXY4kEDmWK7Sx4as'

// 创建 Supabase 客户端
const supabase = createClient(supabaseUrl, supabaseKey)

export default async function handler(req, res) {
  console.log('=== 注册 API 开始 ===')
  console.log('请求方法:', req.method)
  console.log('请求体:', req.body)
  console.log('环境变量 SUPABASE_URL:', process.env.VITE_SUPABASE_URL ? '已设置' : '未设置')
  console.log('环境变量 SUPABASE_ANON_KEY:', process.env.VITE_SUPABASE_ANON_KEY ? '已设置' : '未设置')
  
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

    // 测试 Supabase 连接
    console.log('测试 Supabase 连接...')
    try {
      const { data: testData, error: testError } = await supabase
        .from('users')
        .select('count')
        .limit(1);
      
      if (testError) {
        console.error('Supabase 连接测试失败:', testError);
        // 如果 Supabase 连接失败，使用模拟数据
        console.log('使用模拟数据创建用户...')
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
        
        console.log('模拟用户创建成功')
        return res.status(201).json({
          success: true,
          user: mockUser,
          token: token,
          message: '注册成功（模拟模式）'
        });
      } else {
        console.log('Supabase 连接测试成功')
      }
    } catch (connectionError) {
      console.error('Supabase 连接异常:', connectionError);
      // 继续使用模拟数据
    }

    // 检查用户是否已存在
    console.log('检查用户是否已存在...')
    const { data: existingUser, error: checkError } = await supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .single();

    if (checkError && checkError.code !== 'PGRST116') { // PGRST116 表示没有找到记录
      console.error('检查用户存在性时出错:', checkError);
      return res.status(500).json({ error: '数据库查询失败' });
    }

    if (existingUser) {
      console.log('用户已存在')
      return res.status(400).json({ error: '该邮箱已被注册' });
    }

    // 加密密码
    console.log('加密密码...')
    const saltRounds = 10;
    const password_hash = await bcrypt.hash(password, saltRounds);

    // 创建新用户
    console.log('创建新用户...')
    const { data: newUser, error: insertError } = await supabase
      .from('users')
      .insert({
        email: email,
        name: name,
        password_hash: password_hash,
        language: 'zh-CN',
        has_seen_welcome_guide: false,
        auto_rollover_enabled: true,
        auto_rollover_days: 7,
        rollover_notification_enabled: true,
        ai_daily_insights: true,
        ai_weekly_insights: true,
        ai_url_extraction: true
      })
      .select()
      .single();

    if (insertError) {
      console.error('数据库插入错误:', insertError);
      return res.status(500).json({ error: '注册失败，请稍后重试' });
    }

    // 生成简单的 token（base64 编码）
    console.log('生成 token...')
    const token = Buffer.from(JSON.stringify({
      user_id: newUser.id,
      email: newUser.email,
      name: newUser.name,
      exp: Date.now() + 7 * 24 * 60 * 60 * 1000 // 7天后过期
    })).toString('base64');

    console.log('注册成功，用户ID:', newUser.id)
    res.status(201).json({
      success: true,
      user: {
        id: newUser.id,
        email: newUser.email,
        name: newUser.name,
        language: newUser.language,
        has_seen_welcome_guide: newUser.has_seen_welcome_guide,
        auto_rollover_enabled: newUser.auto_rollover_enabled,
        auto_rollover_days: newUser.auto_rollover_days,
        rollover_notification_enabled: newUser.rollover_notification_enabled,
        ai_daily_insights: newUser.ai_daily_insights,
        ai_weekly_insights: newUser.ai_weekly_insights,
        ai_url_extraction: newUser.ai_url_extraction
      },
      token: token,
      message: '注册成功'
    });

  } catch (error) {
    console.error('注册错误:', error);
    res.status(500).json({ error: '服务器内部错误: ' + error.message });
  } finally {
    console.log('=== 注册 API 结束 ===')
  }
}