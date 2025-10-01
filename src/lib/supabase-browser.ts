/**
 * Supabase 浏览器客户端
 * 用于前端认证和数据库操作
 */

import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  return createBrowserClient(
    import.meta.env.VITE_SUPABASE_URL!,
    import.meta.env.VITE_SUPABASE_ANON_KEY!
  )
}

// 导出默认客户端实例
export const supabase = createClient()
