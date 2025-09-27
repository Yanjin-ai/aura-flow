/**
 * 模拟用户登录 API（临时解决方案）
 * POST /api/auth/login-mock
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
    const { email, password } = req.body

    // 验证输入
    if (!email || !password) {
      return res.status(400).json({ error: '邮箱和密码都是必填项' })
    }

    // 查找用户
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single()

    if (userError || !user) {
      return res.status(401).json({ error: '邮箱或密码错误' })
    }

    // 简单密码验证（生产环境应该使用加密比较）
    if (user.password_hash !== password) {
      return res.status(401).json({ error: '邮箱或密码错误' })
    }

    // 生成简单的 token（不依赖 jsonwebtoken）
    const tokenData = {
      user_id: user.id,
      email: user.email,
      exp: Date.now() + 7 * 24 * 60 * 60 * 1000 // 7天后过期
    }
    const token = btoa(JSON.stringify(tokenData))

    // 返回成功响应
    res.status(200).json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        has_seen_welcome_guide: user.has_seen_welcome_guide || false,
        language: user.language || 'zh-CN',
        auto_rollover_enabled: user.auto_rollover_enabled !== false,
        auto_rollover_days: user.auto_rollover_days || 3,
        rollover_notification_enabled: user.rollover_notification_enabled !== false,
        ai_daily_insights: user.ai_daily_insights !== false,
        ai_weekly_insights: user.ai_weekly_insights !== false,
        ai_url_extraction: user.ai_url_extraction !== false,
        created_at: user.created_at,
        updated_at: user.updated_at
      },
      token: token,
      expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
    })

  } catch (error) {
    console.error('登录异常:', error)
    res.status(500).json({ error: '服务器内部错误' })
  }
}
