// 用户信息更新 API - 使用 Supabase
import { createClient } from '@supabase/supabase-js'

// 在 Vercel 中，环境变量可能需要不同的引用方式
const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY

// 调试日志
console.log('API update 环境变量检查:', {
  url: supabaseUrl ? '存在' : '缺失',
  key: supabaseKey ? '存在' : '缺失'
});

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
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      console.error('获取用户信息失败:', authError);
      return res.status(401).json({ error: '未找到用户信息' });
    }

    const { name, language, has_seen_welcome_guide, auto_rollover_enabled, auto_rollover_days, rollover_notification_enabled, ai_daily_insights, ai_weekly_insights, ai_url_extraction } = req.body;

    // 构建更新数据
    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (language !== undefined) updateData.language = language;
    if (has_seen_welcome_guide !== undefined) updateData.has_seen_welcome_guide = has_seen_welcome_guide;
    if (auto_rollover_enabled !== undefined) updateData.auto_rollover_enabled = auto_rollover_enabled;
    if (auto_rollover_days !== undefined) updateData.auto_rollover_days = auto_rollover_days;
    if (rollover_notification_enabled !== undefined) updateData.rollover_notification_enabled = rollover_notification_enabled;
    if (ai_daily_insights !== undefined) updateData.ai_daily_insights = ai_daily_insights;
    if (ai_weekly_insights !== undefined) updateData.ai_weekly_insights = ai_weekly_insights;
    if (ai_url_extraction !== undefined) updateData.ai_url_extraction = ai_url_extraction;

    // 更新用户元数据
    const { data: updatedUser, error } = await supabase.auth.updateUser({
      data: updateData
    });

    if (error) {
      console.error('更新用户信息错误:', error);
      return res.status(500).json({ error: '更新用户信息失败' });
    }

    if (!updatedUser.user) {
      return res.status(500).json({ error: '更新用户信息失败' });
    }

    // 返回更新后的用户信息
    const userInfo = {
      id: updatedUser.user.id,
      email: updatedUser.user.email,
      name: updatedUser.user.user_metadata?.name || updatedUser.user.user_metadata?.full_name,
      has_seen_welcome_guide: updatedUser.user.user_metadata?.has_seen_welcome_guide || false,
      language: updatedUser.user.user_metadata?.language || 'zh-CN',
      auto_rollover_enabled: updatedUser.user.user_metadata?.auto_rollover_enabled ?? true,
      auto_rollover_days: updatedUser.user.user_metadata?.auto_rollover_days || 7,
      rollover_notification_enabled: updatedUser.user.user_metadata?.rollover_notification_enabled ?? true,
      ai_daily_insights: updatedUser.user.user_metadata?.ai_daily_insights ?? true,
      ai_weekly_insights: updatedUser.user.user_metadata?.ai_weekly_insights ?? true,
      ai_url_extraction: updatedUser.user.user_metadata?.ai_url_extraction ?? true,
      created_at: updatedUser.user.created_at,
      updated_at: updatedUser.user.updated_at
    };

    res.status(200).json({
      success: true,
      user: userInfo,
      message: '用户信息更新成功'
    });

  } catch (error) {
    console.error('更新用户信息错误:', error);
    res.status(500).json({ error: '服务器内部错误' });
  }
}
