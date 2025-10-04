/**
 * Supabase 浏览器客户端
 * 用于前端认证和数据库操作
 */

import { createBrowserClient } from '@supabase/ssr'

// 调试：检查环境变量是否正确注入
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

console.log('Supabase 环境变量检查:', {
  url: supabaseUrl ? '存在' : '缺失',
  key: supabaseAnonKey ? '存在' : '缺失',
  urlValue: supabaseUrl,
  keyValue: supabaseAnonKey ? `${supabaseAnonKey.substring(0, 20)}...` : 'undefined'
});

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Supabase 环境变量缺失！');
  console.error('VITE_SUPABASE_URL:', supabaseUrl);
  console.error('VITE_SUPABASE_ANON_KEY:', supabaseAnonKey);
  throw new Error('Supabase 环境变量未正确配置');
}

export function createClient() {
  return createBrowserClient(supabaseUrl, supabaseAnonKey)
}

// 导出默认客户端实例
export const supabase = createClient()
