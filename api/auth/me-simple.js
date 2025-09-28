/**
 * 简化的获取用户信息 API
 * GET /api/auth/me-simple
 */

import jwt from 'jsonwebtoken'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://lpelllegamiqdwtgqmsy.supabase.co'
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxwZWxsbGVnYW1pcWR3dGdxbMN5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg4MDE4MDgsImV4cCI6MjA3NDM3NzgwOH0.IGt6WyLt4WPXQ7lN4ofCb389yTKUXY4kEDmWK7Sx4as'
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production'

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

    // 验证 JWT token
    const decoded = jwt.verify(token, JWT_SECRET)
    
    if (!decoded.user_id) {
      return res.status(401).json({ error: '无效的认证令牌' })
    }

    // 获取用户详细信息
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('id', decoded.user_id)
      .single()

    if (userError || !userData) {
      return res.status(401).json({ error: '用户不存在' })
    }

    // 返回完整用户信息
    res.status(200).json({
      success: true,
      user: {
        id: userData.id,
        email: userData.email,
        name: userData.name,
        has_seen_welcome_guide: userData.has_seen_welcome_guide || false,
        language: userData.language || 'zh-CN',
        auto_rollover_enabled: userData.auto_rollover_enabled !== false,
        auto_rollover_days: userData.auto_rollover_days || 3,
        rollover_notification_enabled: userData.rollover_notification_enabled !== false,
        ai_daily_insights: userData.ai_daily_insights !== false,
        ai_weekly_insights: userData.ai_weekly_insights !== false,
        ai_url_extraction: userData.ai_url_extraction !== false,
        created_at: userData.created_at,
        updated_at: userData.updated_at
      }
    })

  } catch (error) {
    console.error('获取用户信息异常:', error)
    if (error.name === 'JsonWebTokenError') {
      res.status(401).json({ error: '无效的认证令牌' })
    } else {
      res.status(500).json({ error: '服务器内部错误' })
    }
  }
}
