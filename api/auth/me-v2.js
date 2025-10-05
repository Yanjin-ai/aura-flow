// 用户信息 API（Supabase Auth 验证）
import { createClient } from '@supabase/supabase-js'

// 在 Vercel 中，环境变量可能需要不同的引用方式
const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY

// 调试日志
console.log('API me-v2 环境变量检查:', {
  url: supabaseUrl ? '存在' : '缺失',
  key: supabaseKey ? '存在' : '缺失',
  urlValue: supabaseUrl,
  keyValue: supabaseKey ? `${supabaseKey.substring(0, 20)}...` : 'undefined'
});

export default async function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  try {
    // 检查环境变量
    if (!supabaseUrl || !supabaseKey) {
      console.error('Supabase配置缺失:', { supabaseUrl: !!supabaseUrl, supabaseKey: !!supabaseKey });
      return res.status(500).json({ error: '服务器配置错误' });
    }

    // 创建Supabase客户端
    const supabase = createClient(supabaseUrl, supabaseKey, {
      auth: {
        persistSession: false
      }
    });

    // 从请求头获取Authorization token
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: '未提供认证令牌' });
    }

    const token = authHeader.substring(7);
    
    // 使用token获取用户信息
    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) {
      console.error('获取用户信息失败:', error);
      return res.status(401).json({ error: '未找到用户信息' });
    }

    // 转换用户信息格式
    const userData = {
      id: user.id,
      email: user.email,
      name: user.user_metadata?.name || user.user_metadata?.full_name,
      has_seen_welcome_guide: user.user_metadata?.has_seen_welcome_guide || false,
      language: user.user_metadata?.language || 'zh-CN',
      auto_rollover_enabled: user.user_metadata?.auto_rollover_enabled ?? true,
      auto_rollover_days: user.user_metadata?.auto_rollover_days || 7,
      rollover_notification_enabled: user.user_metadata?.rollover_notification_enabled ?? true,
      ai_daily_insights: user.user_metadata?.ai_daily_insights ?? true,
      ai_weekly_insights: user.user_metadata?.ai_weekly_insights ?? true,
      ai_url_extraction: user.user_metadata?.ai_url_extraction ?? true,
      created_at: user.created_at,
      updated_at: user.updated_at
    };

    return res.status(200).json({ success: true, user: userData, source: 'me-supabase-auth' });
  } catch (error) {
    console.error('API错误:', error);
    return res.status(401).json({ error: error.message || '认证失败' });
  }
}


