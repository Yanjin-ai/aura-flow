// 用户信息 API（兼容 Supabase Auth 与历史 JWT 调用）
import { createServerClient } from '@supabase/ssr'
import { extractTokenFromHeader, verifyToken } from './jwt.js'

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY

export default async function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Allow-Credentials', 'true');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  // 优先尝试 Supabase Auth（Bearer 或 Cookie）
  try {
    if (supabaseUrl && supabaseAnonKey) {
      const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
        cookies: {
          getAll() {
            const cookieHeader = req.headers.cookie || ''
            return cookieHeader.split(';').map(c => {
              const [name, value] = c.trim().split('=')
              return { name, value }
            }).filter(c => c.name && c.value)
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => {
              let cookieString = `${name}=${value}`
              if (options?.maxAge) cookieString += `; Max-Age=${options.maxAge}`
              if (options?.expires) cookieString += `; Expires=${options.expires.toUTCString()}`
              if (options?.httpOnly) cookieString += `; HttpOnly`
              if (options?.secure) cookieString += `; Secure`
              if (options?.sameSite) cookieString += `; SameSite=${options.sameSite}`
              if (options?.path) cookieString += `; Path=${options.path}`
              res.setHeader('Set-Cookie', cookieString)
            })
          }
        }
      })

      // 1) 若带有 Bearer，则直接用 token 获取用户
      const authHeader = req.headers.authorization
      if (authHeader && authHeader.startsWith('Bearer ')) {
        const bearer = authHeader.substring(7)
        const { data: { user }, error } = await supabase.auth.getUser(bearer)
        if (user && !error) {
          return res.status(200).json({ success: true, user, source: 'me-supabase-bearer' })
        }
      }

      // 2) 否则回退用 Cookie 会话获取用户
      const { data: { user }, error } = await supabase.auth.getUser()
      if (user && !error) {
        return res.status(200).json({ success: true, user, source: 'me-supabase-cookie' })
      }
      // 若 Supabase 失败，继续尝试历史 JWT
    }
  } catch (_) {
    // 忽略，尝试 JWT 回退
  }

  // 历史 JWT 回退（若仍有客户端走旧链路且带了 Authorization: Bearer <jwt>）
  try {
    const token = extractTokenFromHeader(req.headers.authorization)
    const tokenData = verifyToken(token)
    const user = {
      id: tokenData.user_id,
      email: tokenData.email,
      name: tokenData.name,
      language: 'zh-CN',
      has_seen_welcome_guide: false,
      auto_rollover_enabled: true,
      auto_rollover_days: 7,
      rollover_notification_enabled: true,
      ai_daily_insights: true,
      ai_weekly_insights: true,
      ai_url_extraction: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
    return res.status(200).json({ success: true, user, source: 'me-jwt-fallback' })
  } catch (error) {
    return res.status(401).json({ error: '无效的认证令牌: 未提供有效的认证令牌' })
  }
}
