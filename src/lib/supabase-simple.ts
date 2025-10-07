/**
 * 最简单的 Supabase 客户端配置
 * 直接硬编码，确保能工作
 */

import { createClient } from '@supabase/supabase-js'

// 直接硬编码配置，确保能工作
const SUPABASE_URL = 'https://lpelllegamiqdwtgqmsy.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxwZWxsbGVnYW1pcWR3dGdxbXN5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk1MDE5MzksImV4cCI6MjA3NTA3NzkzOX0.bL1GnkZ_OLwdbr_RzKZg4bV8UKrm084QFTXxOWl0MzUM'

console.log('🚀 使用硬编码 Supabase 配置')
console.log('URL:', SUPABASE_URL)
console.log('Key:', SUPABASE_ANON_KEY.substring(0, 20) + '...')

// 创建客户端
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

// 测试连接
supabase.auth.getSession().then(({ data, error }) => {
  if (error) {
    console.error('❌ Supabase 连接失败:', error)
  } else {
    console.log('✅ Supabase 连接成功')
  }
})
