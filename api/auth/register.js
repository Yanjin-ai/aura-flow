// 用户注册 API（Supabase Auth）
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
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ error: '缺少必要字段' });
    }

    const supabase = createClient(req, res);

    // 使用 Supabase Auth 注册用户
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name,
          has_seen_welcome_guide: false,
          language: 'zh-CN',
          auto_rollover_enabled: true,
          auto_rollover_days: 7,
          rollover_notification_enabled: true,
          ai_daily_insights: true,
          ai_weekly_insights: true,
          ai_url_extraction: true
        }
      }
    });

    if (error) {
      console.error('注册错误:', error);
      return res.status(400).json({ error: error.message });
    }

    if (!data.user) {
      return res.status(500).json({ error: '注册失败' });
    }

    // 转换用户信息格式
    const userData = {
      id: data.user.id,
      email: data.user.email,
      name,
      has_seen_welcome_guide: false,
      language: 'zh-CN',
      auto_rollover_enabled: true,
      auto_rollover_days: 7,
      rollover_notification_enabled: true,
      ai_daily_insights: true,
      ai_weekly_insights: true,
      ai_url_extraction: true,
      created_at: data.user.created_at,
      updated_at: data.user.updated_at
    };

    // 如果有 session，返回认证响应
    if (data.session) {
      return res.status(201).json({
        success: true,
        user: userData,
        token: data.session.access_token
      });
    }

    // 如果没有 session（需要邮箱验证），返回用户信息但不包含 token
    return res.status(201).json({
      success: true,
      user: userData,
      token: '',
      message: '请检查邮箱并点击验证链接'
    });
  } catch (error) {
    console.error('注册错误:', error);
    return res.status(500).json({ error: '注册失败' });
  }
}