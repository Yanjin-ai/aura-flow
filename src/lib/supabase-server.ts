/**
 * Supabase 服务端客户端
 * 用于 Vercel Serverless Functions 中的服务端操作
 */

import { createServerClient } from '@supabase/ssr'

// Vercel Serverless Functions 的 Response 类型
interface VercelResponse {
  setHeader: (name: string, value: string) => void;
}

export function createClient(req: Request, res: VercelResponse) {
  return createServerClient(
    process.env.VITE_SUPABASE_URL!,
    process.env.VITE_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          // 从请求头中获取所有 cookies
          const cookieHeader = req.headers.get('cookie') || ''
          return cookieHeader.split(';').map(cookie => {
            const [name, value] = cookie.trim().split('=')
            return { name, value }
          }).filter(cookie => cookie.name && cookie.value)
        },
        setAll(cookiesToSet) {
          // 设置响应 cookies
          cookiesToSet.forEach(({ name, value, options }) => {
            let cookieString = `${name}=${value}`
            
            if (options?.maxAge) {
              cookieString += `; Max-Age=${options.maxAge}`
            }
            if (options?.expires) {
              cookieString += `; Expires=${options.expires.toUTCString()}`
            }
            if (options?.httpOnly) {
              cookieString += `; HttpOnly`
            }
            if (options?.secure) {
              cookieString += `; Secure`
            }
            if (options?.sameSite) {
              cookieString += `; SameSite=${options.sameSite}`
            }
            if (options?.path) {
              cookieString += `; Path=${options.path}`
            }
            
            res.setHeader('Set-Cookie', cookieString)
          })
        },
      },
    }
  )
}
