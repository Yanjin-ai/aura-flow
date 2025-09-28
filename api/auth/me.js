// 改进的用户信息 API - 使用 Supabase
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://lpelllegamiqdwtgqmsy.supabase.co'
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxwZWxsbGVnYW1pcWR3dGdxbXN5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg4MDE4MDgsImV4cCI6MjA3NDM3NzgwOH0.IGt6WyLt4WPXQ7lN4ofCb389yTKUXY4kEDmWK7Sx4as'
const supabase = createClient(supabaseUrl, supabaseKey)

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: '未提供有效的认证令牌' });
    }

    const token = authHeader.substring(7);
    
    // 解码 token
    const tokenData = JSON.parse(Buffer.from(token, 'base64').toString());

    // 检查 token 是否过期
    if (tokenData.exp && Date.now() > tokenData.exp) {
      return res.status(401).json({ error: '认证令牌已过期' });
    }

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
      has_seen_welcome_guide: true,
      language: 'zh-CN',
      auto_rollover_enabled: true,
      auto_rollover_days: 3,
      rollover_notification_enabled: true,
      ai_daily_insights: true,
      ai_weekly_insights: true,
      ai_url_extraction: true,
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
