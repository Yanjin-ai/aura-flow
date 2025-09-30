// 用户登录 API - 使用 Supabase 数据库
import { createClient } from '@supabase/supabase-js'
import bcrypt from 'bcryptjs'
import { generateToken } from './jwt.js'

// 优先使用服务端密钥，避免 RLS 401/500（仅服务端使用）
const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY

// 检查是否配置了 Supabase
const hasSupabaseConfig = supabaseUrl && supabaseKey

// 创建 Supabase 客户端（如果配置了的话）
const supabase = hasSupabaseConfig ? createClient(supabaseUrl, supabaseKey) : null

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
    if (!hasSupabaseConfig) {
      return res.status(500).json({ error: '服务器未正确配置数据库连接 (缺少 SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY)' });
    }
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: '邮箱和密码都是必填项' });
    }

    // 查找用户
    const { data: user, error: fetchError } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single();

    if (fetchError) {
      if (fetchError.code === 'PGRST116') {
        return res.status(401).json({ error: '用户不存在' });
      }
      return res.status(500).json({ error: '数据库查询失败' });
    }

    // 验证密码
    const isPasswordValid = await bcrypt.compare(password, user.password_hash);
    if (!isPasswordValid) {
      return res.status(401).json({ error: '密码错误' });
    }

    // 生成 JWT token（签名）
    const token = generateToken({
      user_id: user.id,
      email: user.email,
      name: user.name
    })

    res.status(200).json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        language: user.language,
        has_seen_welcome_guide: user.has_seen_welcome_guide,
        auto_rollover_enabled: user.auto_rollover_enabled,
        auto_rollover_days: user.auto_rollover_days,
        rollover_notification_enabled: user.rollover_notification_enabled,
        ai_daily_insights: user.ai_daily_insights,
        ai_weekly_insights: user.ai_weekly_insights,
        ai_url_extraction: user.ai_url_extraction
      },
      token: token,
      message: '登录成功'
    });

  } catch (error) {
    res.status(500).json({ error: '服务器内部错误: ' + error.message });
  }
}