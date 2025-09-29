// 完整的用户注册 API - 使用 Supabase
import { createClient } from '@supabase/supabase-js'
import bcrypt from 'bcryptjs'

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

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { email, password, name } = req.body;

    if (!email || !password || !name) {
      return res.status(400).json({ error: '邮箱、密码和姓名都是必填项' });
    }

    // 检查用户是否已存在
    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .single();

    if (existingUser) {
      return res.status(400).json({ error: '该邮箱已被注册' });
    }

    // 加密密码
    const saltRounds = 10;
    const password_hash = await bcrypt.hash(password, saltRounds);

    // 创建新用户
    const { data: newUser, error: insertError } = await supabase
      .from('users')
      .insert({
        email: email,
        name: name,
        password_hash: password_hash,
        language: 'zh-CN',
        has_seen_welcome_guide: false,
        auto_rollover_enabled: true,
        auto_rollover_days: 7,
        rollover_notification_enabled: true,
        ai_daily_insights: true,
        ai_weekly_insights: true,
        ai_url_extraction: true
      })
      .select()
      .single();

    if (insertError) {
      console.error('数据库插入错误:', insertError);
      return res.status(500).json({ error: '注册失败，请稍后重试' });
    }

    // 生成 JWT token
    const token = Buffer.from(JSON.stringify({
      user_id: newUser.id,
      email: newUser.email,
      exp: Date.now() + 7 * 24 * 60 * 60 * 1000 // 7天过期
    })).toString('base64');

    res.status(201).json({
      success: true,
      user: {
        id: newUser.id,
        email: newUser.email,
        name: newUser.name,
        language: newUser.language,
        has_seen_welcome_guide: newUser.has_seen_welcome_guide,
        auto_rollover_enabled: newUser.auto_rollover_enabled,
        auto_rollover_days: newUser.auto_rollover_days,
        rollover_notification_enabled: newUser.rollover_notification_enabled,
        ai_daily_insights: newUser.ai_daily_insights,
        ai_weekly_insights: newUser.ai_weekly_insights,
        ai_url_extraction: newUser.ai_url_extraction
      },
      token: token,
      message: '注册成功'
    });

  } catch (error) {
    console.error('注册错误:', error);
    res.status(500).json({ error: '服务器内部错误' });
  }
}