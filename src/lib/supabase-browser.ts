/**
 * Supabase 浏览器客户端
 * 用于前端认证和数据库操作
 */

import { createBrowserClient } from '@supabase/ssr'

// 调试：检查环境变量是否正确注入
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

console.log('🔍 Supabase 环境变量详细检查:');
console.log('- VITE_SUPABASE_URL:', supabaseUrl);
console.log('- VITE_SUPABASE_ANON_KEY:', supabaseAnonKey ? `${supabaseAnonKey.substring(0, 20)}...` : 'undefined');
console.log('- URL 长度:', supabaseUrl ? supabaseUrl.length : 0);
console.log('- Key 长度:', supabaseAnonKey ? supabaseAnonKey.length : 0);
console.log('- 所有环境变量:', Object.keys(import.meta.env).filter(key => key.startsWith('VITE_')));

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Supabase 环境变量缺失！');
  console.error('VITE_SUPABASE_URL:', supabaseUrl);
  console.error('VITE_SUPABASE_ANON_KEY:', supabaseAnonKey);
  console.error('当前环境:', import.meta.env.MODE);
  console.error('所有 VITE_ 变量:', import.meta.env);
  throw new Error('Supabase 环境变量未正确配置');
}

export function createClient() {
  return createBrowserClient(supabaseUrl, supabaseAnonKey)
}

// 导出默认客户端实例
export const supabase = createClient()
