// 用户登录 API（Supabase Auth）
import { createClient } from '../../src/lib/supabase-server.js'

export default async function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: '邮箱和密码都是必填项' });
    }

    const supabase = createClient(req, res);

    // 使用 Supabase Auth 登录
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error) {
      console.error('登录错误:', error);
      return res.status(401).json({ error: error.message });
    }

    if (!data.user || !data.session) {
      return res.status(401).json({ error: '登录失败' });
    }

    // 转换用户信息格式
    const userData = {
      id: data.user.id,
      email: data.user.email,
      name: data.user.user_metadata?.name || data.user.user_metadata?.full_name,
      has_seen_welcome_guide: data.user.user_metadata?.has_seen_welcome_guide || false,
      language: data.user.user_metadata?.language || 'zh-CN',
      auto_rollover_enabled: data.user.user_metadata?.auto_rollover_enabled ?? true,
      auto_rollover_days: data.user.user_metadata?.auto_rollover_days || 7,
      rollover_notification_enabled: data.user.user_metadata?.rollover_notification_enabled ?? true,
      ai_daily_insights: data.user.user_metadata?.ai_daily_insights ?? true,
      ai_weekly_insights: data.user.user_metadata?.ai_weekly_insights ?? true,
      ai_url_extraction: data.user.user_metadata?.ai_url_extraction ?? true,
      created_at: data.user.created_at,
      updated_at: data.user.updated_at
    };

    return res.status(200).json({
      success: true,
      user: userData,
      token: data.session.access_token,
      message: '登录成功'
    });
  } catch (error) {
    console.error('登录错误:', error);
    return res.status(500).json({ error: '登录失败' });
  }
}