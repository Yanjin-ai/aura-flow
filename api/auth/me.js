// 完整的用户信息 API - 使用 Supabase
import { createClient } from '@supabase/supabase-js'
import { verifyToken, extractTokenFromHeader } from './jwt.js'

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY

// 创建 Supabase 客户端
const supabase = createClient(supabaseUrl, supabaseKey)

export default async function handler(req, res) {
  // 设置 CORS 头
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // 验证 JWT token
    const token = extractTokenFromHeader(req.headers.authorization);
    const tokenData = verifyToken(token);

    // 从数据库获取用户信息
    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', tokenData.user_id)
      .single();

    if (error) {
      console.error('获取用户信息错误:', error);
      return res.status(500).json({ error: '数据库查询失败' });
    }

    // 返回用户信息（不包含密码）
    const userInfo = {
      id: user.id,
      email: user.email,
      name: user.name,
      has_seen_welcome_guide: user.has_seen_welcome_guide,
      language: user.language,
      auto_rollover_enabled: user.auto_rollover_enabled,
      auto_rollover_days: user.auto_rollover_days,
      rollover_notification_enabled: user.rollover_notification_enabled,
      ai_daily_insights: user.ai_daily_insights,
      ai_weekly_insights: user.ai_weekly_insights,
      ai_url_extraction: user.ai_url_extraction,
      created_at: user.created_at,
      updated_at: user.updated_at
    };

    res.status(200).json({
      success: true,
      user: userInfo
    });

  } catch (error) {
    console.error('获取用户信息错误:', error);
    res.status(401).json({ error: '无效的认证令牌' });
  }
}