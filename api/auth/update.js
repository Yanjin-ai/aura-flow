// 用户信息更新 API - 使用 Supabase
import { createClient } from '@supabase/supabase-js'

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

  if (req.method !== 'PATCH') {
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

    const { name, language, has_seen_welcome_guide, auto_rollover_enabled, auto_rollover_days, rollover_notification_enabled, ai_daily_insights, ai_weekly_insights, ai_url_extraction } = req.body;

    // 构建更新数据
    const updateData = {
      updated_at: new Date().toISOString()
    };

    if (name !== undefined) updateData.name = name;
    if (language !== undefined) updateData.language = language;
    if (has_seen_welcome_guide !== undefined) updateData.has_seen_welcome_guide = has_seen_welcome_guide;
    if (auto_rollover_enabled !== undefined) updateData.auto_rollover_enabled = auto_rollover_enabled;
    if (auto_rollover_days !== undefined) updateData.auto_rollover_days = auto_rollover_days;
    if (rollover_notification_enabled !== undefined) updateData.rollover_notification_enabled = rollover_notification_enabled;
    if (ai_daily_insights !== undefined) updateData.ai_daily_insights = ai_daily_insights;
    if (ai_weekly_insights !== undefined) updateData.ai_weekly_insights = ai_weekly_insights;
    if (ai_url_extraction !== undefined) updateData.ai_url_extraction = ai_url_extraction;

    // 更新用户信息
    const { data: updatedUser, error } = await supabase
      .from('users')
      .update(updateData)
      .eq('id', tokenData.user_id)
      .select()
      .single();

    if (error) {
      console.error('更新用户信息错误:', error);
      return res.status(500).json({ error: '数据库更新失败' });
    }

    // 返回更新后的用户信息（不包含密码）
    const userInfo = {
      id: updatedUser.id,
      email: updatedUser.email,
      name: updatedUser.name,
      has_seen_welcome_guide: updatedUser.has_seen_welcome_guide,
      language: updatedUser.language,
      auto_rollover_enabled: updatedUser.auto_rollover_enabled,
      auto_rollover_days: updatedUser.auto_rollover_days,
      rollover_notification_enabled: updatedUser.rollover_notification_enabled,
      ai_daily_insights: updatedUser.ai_daily_insights,
      ai_weekly_insights: updatedUser.ai_weekly_insights,
      ai_url_extraction: updatedUser.ai_url_extraction,
      created_at: updatedUser.created_at,
      updated_at: updatedUser.updated_at
    };

    res.status(200).json({
      success: true,
      user: userInfo,
      message: '用户信息更新成功'
    });

  } catch (error) {
    console.error('更新用户信息错误:', error);
    res.status(401).json({ error: '无效的认证令牌' });
  }
}
