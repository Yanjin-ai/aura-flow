/**
 * 调试版用户注册 API
 * POST /api/auth/register-debug
 */

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://lpelllegamiqdwtgqmsy.supabase.co'
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxwZWxsbGVnYW1pcWR3dGdxbMN5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg4MDE4MDgsImV4cCI6MjA3NDM3NzgwOH0.IGt6WyLt4WPXQ7lN4ofCb389yTKUXY4kEDmWK7Sx4as'

const supabase = createClient(supabaseUrl, supabaseAnonKey)

export default async function handler(req, res) {
  console.log('=== 注册调试 API 被调用 ===');
  console.log('请求方法:', req.method);
  console.log('请求头:', JSON.stringify(req.headers, null, 2));
  console.log('请求体:', req.body);
  console.log('请求体类型:', typeof req.body);
  
  // 只允许 POST 请求
  if (req.method !== 'POST') {
    console.log('错误: 方法不允许');
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    // 检查请求体是否存在
    if (!req.body) {
      console.log('错误: 请求体为空');
      return res.status(400).json({ error: '请求体为空' })
    }

    const { email, password, name } = req.body
    console.log('解析的字段:', { email, password, name });

    // 验证输入
    if (!email || !password || !name) {
      console.log('验证失败:', { email: !!email, password: !!password, name: !!name });
      return res.status(400).json({ 
        error: '邮箱、密码和姓名都是必填项',
        received: { email: !!email, password: !!password, name: !!name }
      })
    }

    console.log('开始检查用户是否已存在...');
    // 检查用户是否已存在
    const { data: existingUser, error: checkError } = await supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .single()

    if (checkError && checkError.code !== 'PGRST116') {
      console.log('检查用户错误:', checkError);
      return res.status(500).json({ error: '检查用户时出错: ' + checkError.message })
    }

    if (existingUser) {
      console.log('用户已存在');
      return res.status(400).json({ error: '该邮箱已被注册' })
    }

    console.log('开始创建用户记录...');
    // 创建用户记录
    const { data: newUser, error: insertError } = await supabase
      .from('users')
      .insert({
        email: email,
        name: name,
        password_hash: password, // 简单存储，生产环境应该加密
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single()

    if (insertError) {
      console.error('创建用户记录错误:', insertError);
      return res.status(400).json({ error: insertError.message })
    }

    console.log('用户创建成功:', newUser);

    // 生成简单的 token
    const tokenData = {
      user_id: newUser.id,
      email: newUser.email,
      exp: Date.now() + 7 * 24 * 60 * 60 * 1000 // 7天后过期
    }
    const token = btoa(JSON.stringify(tokenData))

    console.log('返回成功响应');
    // 返回成功响应
    res.status(201).json({
      success: true,
      user: {
        id: newUser.id,
        email: newUser.email,
        name: newUser.name,
        has_seen_welcome_guide: false,
        language: 'zh-CN',
        auto_rollover_enabled: true,
        auto_rollover_days: 3,
        rollover_notification_enabled: true,
        ai_daily_insights: true,
        ai_weekly_insights: true,
        ai_url_extraction: true,
        created_at: newUser.created_at,
        updated_at: newUser.updated_at
      },
      token: token,
      expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
    })

  } catch (error) {
    console.error('注册异常:', error);
    res.status(500).json({ error: '服务器内部错误: ' + error.message })
  }
}
