/**
 * 模拟用户注册 API（临时解决方案）
 * POST /api/auth/register-mock
 */

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://lpelllegamiqdwtgqmsy.supabase.co'
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxwZWxsbGVnYW1pcWR3dGdxbMN5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg4MDE4MDgsImV4cCI6MjA3NDM3NzgwOH0.IGt6WyLt4WPXQ7lN4ofCb389yTKUXY4kEDmWK7Sx4as'

const supabase = createClient(supabaseUrl, supabaseAnonKey)

export default async function handler(req, res) {
  // 只允许 POST 请求
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    console.log('注册请求体:', req.body);
    const { email, password, name } = req.body

    // 验证输入
    if (!email || !password || !name) {
      console.log('验证失败:', { email: !!email, password: !!password, name: !!name });
      return res.status(400).json({ error: '邮箱、密码和姓名都是必填项' })
    }

    // 检查用户是否已存在
    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .single()

    if (existingUser) {
      return res.status(400).json({ error: '该邮箱已被注册' })
    }

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
      console.error('创建用户记录错误:', insertError)
      return res.status(400).json({ error: insertError.message })
    }

    // 生成简单的 token（不依赖 jsonwebtoken）
    const tokenData = {
      user_id: newUser.id,
      email: newUser.email,
      exp: Date.now() + 7 * 24 * 60 * 60 * 1000 // 7天后过期
    }
    const token = btoa(JSON.stringify(tokenData))

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
    console.error('注册异常:', error)
    res.status(500).json({ error: '服务器内部错误' })
  }
}
