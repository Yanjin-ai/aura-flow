/**
 * 获取当前用户信息 API
 * GET /api/auth/me
 */

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://lpelllegamiqdwtgqmsy.supabase.co'
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxwZWxsbGVnYW1pcWR3dGdxbXN5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg4MDE4MDgsImV4cCI6MjA3NDM3NzgwOH0.IGt6WyLt4WPXQ7lN4ofCb389yTKUXY4kEDmWK7Sx4as'

const supabase = createClient(supabaseUrl, supabaseAnonKey)

export default async function handler(req, res) {
  // 只允许 GET 请求
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const token = req.headers.authorization?.replace('Bearer ', '')
    
    if (!token) {
      return res.status(401).json({ error: '未提供认证令牌' })
    }

    // 验证用户身份
    const { data: { user }, error } = await supabase.auth.getUser(token)
    
    if (error || !user) {
      return res.status(401).json({ error: '无效的认证令牌' })
    }

    // 获取用户详细信息
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('id', user.id)
      .single()

    if (userError) {
      console.error('获取用户信息错误:', userError)
      // 如果用户表中没有记录，返回基本信息
      return res.status(200).json({
        success: true,
        user: {
          id: user.id,
          email: user.email,
          name: user.user_metadata?.name || '用户',
          has_seen_welcome_guide: false,
          language: 'zh-CN',
          auto_rollover_enabled: true,
          auto_rollover_days: 3,
          rollover_notification_enabled: true,
          ai_daily_insights: true,
          ai_weekly_insights: true,
          ai_url_extraction: true,
          created_at: user.created_at,
          updated_at: new Date().toISOString()
        }
      })
    }

    // 返回完整用户信息
    res.status(200).json({
      success: true,
      user: {
        id: userData.id,
        email: userData.email,
        name: userData.name,
        has_seen_welcome_guide: userData.has_seen_welcome_guide,
        language: userData.language,
        auto_rollover_enabled: userData.auto_rollover_enabled,
        auto_rollover_days: userData.auto_rollover_days,
        rollover_notification_enabled: userData.rollover_notification_enabled,
        ai_daily_insights: userData.ai_daily_insights,
        ai_weekly_insights: userData.ai_weekly_insights,
        ai_url_extraction: userData.ai_url_extraction,
        created_at: userData.created_at,
        updated_at: userData.updated_at
      }
    })

  } catch (error) {
    console.error('获取用户信息异常:', error)
    res.status(500).json({ error: '服务器内部错误' })
  }
}
