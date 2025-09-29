// Google OAuth 集成
import { createClient } from '@supabase/supabase-js'
import { generateToken } from '../jwt.js'

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET

// 创建 Supabase 客户端
const supabase = createClient(supabaseUrl, supabaseKey)

export default async function handler(req, res) {
  // 设置 CORS 头
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { code, redirect_uri } = req.body;

    if (!code || !redirect_uri) {
      return res.status(400).json({ error: '缺少必要的参数' });
    }

    // 交换授权码获取访问令牌
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: GOOGLE_CLIENT_ID,
        client_secret: GOOGLE_CLIENT_SECRET,
        code: code,
        grant_type: 'authorization_code',
        redirect_uri: redirect_uri,
      }),
    });

    if (!tokenResponse.ok) {
      throw new Error('获取访问令牌失败');
    }

    const tokenData = await tokenResponse.json();

    // 使用访问令牌获取用户信息
    const userResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: {
        'Authorization': `Bearer ${tokenData.access_token}`,
      },
    });

    if (!userResponse.ok) {
      throw new Error('获取用户信息失败');
    }

    const googleUser = await userResponse.json();

    // 检查用户是否已存在
    const { data: existingUser } = await supabase
      .from('users')
      .select('*')
      .eq('email', googleUser.email)
      .single();

    let user;
    if (existingUser) {
      // 用户已存在，更新 OAuth 信息
      const { data: updatedUser, error: updateError } = await supabase
        .from('users')
        .update({
          google_id: googleUser.id,
          avatar_url: googleUser.picture,
          updated_at: new Date().toISOString()
        })
        .eq('id', existingUser.id)
        .select()
        .single();

      if (updateError) {
        throw new Error('更新用户信息失败');
      }

      user = updatedUser;
    } else {
      // 创建新用户
      const { data: newUser, error: insertError } = await supabase
        .from('users')
        .insert({
          email: googleUser.email,
          name: googleUser.name,
          google_id: googleUser.id,
          avatar_url: googleUser.picture,
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
        throw new Error('创建用户失败');
      }

      user = newUser;
    }

    // 生成 JWT token
    const token = generateToken({
      user_id: user.id,
      email: user.email,
      name: user.name
    });

    res.status(200).json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        avatar_url: user.avatar_url,
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
      message: 'OAuth 登录成功'
    });

  } catch (error) {
    console.error('Google OAuth 错误:', error);
    res.status(500).json({ error: 'OAuth 登录失败' });
  }
}
