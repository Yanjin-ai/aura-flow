/**
 * 用户登录 API
 * POST /api/auth/login
 */

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://lpelllegamiqdwtgqmsy.supabase.co'
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxwZWxsbGVnYW1pcWR3dGdxbXN5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg4MDE4MDgsImV4cCI6MjA3NDM3NzgwOH0.IGt6WyLt4WPXQ7lN4ofCb389yTKUXY4kEDmWK7Sx4as'

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

    // 使用 Supabase Auth 登录
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    })

    if (error) {
      console.error('登录错误:', error)
      return res.status(401).json({ error: '邮箱或密码错误' })
    }

    // 获取用户详细信息
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('id', data.user.id)
      .single()

    if (userError) {
      console.error('获取用户信息错误:', userError)
    }

    // 返回成功响应
    res.status(200).json({
      success: true,
      user: {
        id: data.user.id,
        email: data.user.email,
        name: userData?.name || data.user.user_metadata?.name || '用户',
        has_seen_welcome_guide: userData?.has_seen_welcome_guide || false,
        language: userData?.language || 'zh-CN',
        auto_rollover_enabled: userData?.auto_rollover_enabled || true,
        auto_rollover_days: userData?.auto_rollover_days || 3,
        rollover_notification_enabled: userData?.rollover_notification_enabled || true,
        ai_daily_insights: userData?.ai_daily_insights || true,
        ai_weekly_insights: userData?.ai_weekly_insights || true,
        ai_url_extraction: userData?.ai_url_extraction || true,
        created_at: userData?.created_at || data.user.created_at,
        updated_at: userData?.updated_at || new Date().toISOString()
      },
      token: data.session.access_token,
      expires_at: data.session.expires_at
    })

  } catch (error) {
    console.error('登录异常:', error)
    res.status(500).json({ error: '服务器内部错误' })
  }
}
