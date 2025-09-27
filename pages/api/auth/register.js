/**
 * 用户注册 API
 * POST /api/auth/register
 */

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://lpelllegamiqdwtgqmsy.supabase.co'
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxwZWxsbGVnYW1pcWR3dGdxbXN5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg4MDE4MDgsImV4cCI6MjA3NDM3NzgwOH0.IGt6WyLt4WPXQ7lN4ofCb389yTKUXY4kEDmWK7Sx4as'

const supabase = createClient(supabaseUrl, supabaseAnonKey)

export default async function handler(req, res) {
  // 只允许 POST 请求
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { email, password, name } = req.body

    // 验证输入
    if (!email || !password || !name) {
      return res.status(400).json({ error: '邮箱、密码和姓名都是必填项' })
    }

    // 使用 Supabase Auth 注册用户
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name: name
        }
      }
    })

    if (error) {
      console.error('注册错误:', error)
      return res.status(400).json({ error: error.message })
    }

    // 注册成功后，在 users 表中创建用户记录
    if (data.user) {
      const { error: insertError } = await supabase
        .from('users')
        .insert({
          id: data.user.id,
          email: data.user.email,
          name: name,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })

      if (insertError) {
        console.error('创建用户记录错误:', insertError)
        // 不返回错误，因为用户已经注册成功
      }
    }

    // 返回成功响应
    res.status(201).json({
      success: true,
      user: {
        id: data.user?.id,
        email: data.user?.email,
        name: name
      },
      message: '注册成功'
    })

  } catch (error) {
    console.error('注册异常:', error)
    res.status(500).json({ error: '服务器内部错误' })
  }
}
