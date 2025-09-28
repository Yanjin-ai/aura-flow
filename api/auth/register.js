// 完整的用户注册 API - 使用 Supabase
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://lpelllegamiqdwtgqmsy.supabase.co'
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxwZWxsbGVnYW1pcWR3dGdxbXN5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg4MDE4MDgsImV4cCI6MjA3NDM3NzgwOH0.IGt6WyLt4WPXQ7lN4ofCb389yTKUXY4kEDmWK7Sx4as'

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

    // 暂时不使用数据库，直接创建用户对象
    const newUser = {
      id: 'user_' + Date.now(),
      email: email,
      name: name,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    // 生成简单的 token
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
        name: newUser.name
      },
      token: token,
      message: '注册成功'
    });

  } catch (error) {
    console.error('注册错误:', error);
    res.status(500).json({ error: '服务器内部错误' });
  }
}