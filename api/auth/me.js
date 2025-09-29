// 简化的用户信息 API - 用于调试
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://lpelllegamiqdwtgqmsy.supabase.co'
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxwZWxsbGVnYW1pcWR3dGdxbXN5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg4MDE4MDgsImV4cCI6MjA3NDM3NzgwOH0.IGt6WyLt4WPXQ7lN4ofCb389yTKUXY4kEDmWK7Sx4as'

// 创建 Supabase 客户端
const supabase = createClient(supabaseUrl, supabaseKey)

export default async function handler(req, res) {
  console.log('=== 用户信息 API 开始 ===')
  console.log('请求方法:', req.method)
  console.log('Authorization 头:', req.headers.authorization ? '已提供' : '未提供')
  
  // 设置 CORS 头
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    console.log('处理 OPTIONS 请求')
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    console.log('方法不允许:', req.method)
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // 检查 Authorization 头
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log('未提供有效的认证令牌')
      return res.status(401).json({ error: '未提供有效的认证令牌' });
    }

    // 提取 token
    const token = authHeader.substring(7);
    console.log('提取的 token:', token.substring(0, 20) + '...');

    // 解析 token（base64 编码的 JSON）
    let tokenData;
    try {
      const decodedToken = Buffer.from(token, 'base64').toString();
      tokenData = JSON.parse(decodedToken);
      console.log('解析的 token 数据:', { user_id: tokenData.user_id, email: tokenData.email });
    } catch (parseError) {
      console.error('Token 解析失败:', parseError);
      return res.status(401).json({ error: '无效的认证令牌格式' });
    }

    // 检查 token 是否过期
    if (tokenData.exp && Date.now() > tokenData.exp) {
      console.log('Token 已过期')
      return res.status(401).json({ error: '认证令牌已过期' });
    }

    // 如果是模拟用户，直接返回模拟数据
    if (tokenData.user_id.startsWith('mock-')) {
      console.log('返回模拟用户数据')
      const mockUser = {
        id: tokenData.user_id,
        email: tokenData.email,
        name: tokenData.name,
        language: 'zh-CN',
        has_seen_welcome_guide: false,
        auto_rollover_enabled: true,
        auto_rollover_days: 7,
        rollover_notification_enabled: true,
        ai_daily_insights: true,
        ai_weekly_insights: true,
        ai_url_extraction: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      return res.status(200).json({
        success: true,
        user: mockUser
      });
    }

    // 从数据库获取用户信息
    console.log('从数据库获取用户信息...')
    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', tokenData.user_id)
      .single();

    if (error) {
      console.error('获取用户信息错误:', error);
      return res.status(500).json({ error: '数据库查询失败' });
    }

    if (!user) {
      console.log('用户不存在')
      return res.status(404).json({ error: '用户不存在' });
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

    console.log('成功获取用户信息:', userInfo.email)
    res.status(200).json({
      success: true,
      user: userInfo
    });

  } catch (error) {
    console.error('获取用户信息错误:', error);
    res.status(401).json({ error: '无效的认证令牌: ' + error.message });
  } finally {
    console.log('=== 用户信息 API 结束 ===')
  }
}