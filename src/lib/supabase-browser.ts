/**
 * Supabase 浏览器客户端
 * 用于前端认证和数据库操作
 */

import { createBrowserClient } from '@supabase/ssr'

// 强制环境变量检查
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

console.log('🔍 Supabase 环境变量详细检查:');
console.log('- VITE_SUPABASE_URL:', supabaseUrl);
console.log('- VITE_SUPABASE_ANON_KEY:', supabaseAnonKey ? `${supabaseAnonKey.substring(0, 20)}...` : 'undefined');
console.log('- URL 长度:', supabaseUrl ? supabaseUrl.length : 0);
console.log('- Key 长度:', supabaseAnonKey ? supabaseAnonKey.length : 0);
console.log('- 所有环境变量:', Object.keys(import.meta.env).filter(key => key.startsWith('VITE_')));

// 如果环境变量缺失，使用硬编码值作为临时解决方案
if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Supabase 环境变量缺失！使用硬编码值作为临时解决方案');
  console.error('VITE_SUPABASE_URL:', supabaseUrl);
  console.error('VITE_SUPABASE_ANON_KEY:', supabaseAnonKey);
  
  // 临时硬编码值（仅用于调试）
  const fallbackUrl = 'https://lpelllegamiqdwtgqmsy.supabase.co';
  const fallbackKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxwZWxsbGVnYW1pcWR3dGdxbXN5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg4MDE4MDgsImV4cCI6MjA3NDM3NzgwOH0.IGt6WyLt4WPXQ7lN4ofCb389yTKUXY4kEDmWK7Sx4as';
  
  console.warn('⚠️ 使用硬编码值:', { url: fallbackUrl, key: `${fallbackKey.substring(0, 20)}...` });
  
  // 使用硬编码值
  const finalUrl = supabaseUrl || fallbackUrl;
  const finalKey = supabaseAnonKey || fallbackKey;
  
  export function createClient() {
    return createBrowserClient(finalUrl, finalKey)
  }
  
  // 导出默认客户端实例
  export const supabase = createClient()
} else {
  export function createClient() {
    return createBrowserClient(supabaseUrl, supabaseAnonKey)
  }
  
  // 导出默认客户端实例
  export const supabase = createClient()
}