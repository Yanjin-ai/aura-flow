// 用户信息 API（Supabase Auth 验证）
import { createClient } from '../../src/lib/supabase-server.js'

export default async function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const supabase = createClient(req, res);
    const { data: { user }, error } = await supabase.auth.getUser();

    if (error || !user) {
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
    return res.status(401).json({ error: error.message || '认证失败' });
  }
}


