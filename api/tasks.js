/**
 * 任务管理 API
 * GET /api/tasks - 获取任务列表
 * POST /api/tasks - 创建新任务
 */

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://lpelllegamiqdwtgqmsy.supabase.co'
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxwZWxsbGVnYW1pcWR3dGdxbXN5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg4MDE4MDgsImV4cCI6MjA3NDM3NzgwOH0.IGt6WyLt4WPXQ7lN4ofCb389yTKUXY4kEDmWK7Sx4as'

const supabase = createClient(supabaseUrl, supabaseAnonKey)

// 验证用户身份
async function verifyUser(req) {
  const token = req.headers.authorization?.replace('Bearer ', '')
  if (!token) {
    throw new Error('未提供认证令牌')
  }

  const { data: { user }, error } = await supabase.auth.getUser(token)
  if (error || !user) {
    throw new Error('无效的认证令牌')
  }

  return user
}

export default async function handler(req, res) {
  try {
    // 验证用户身份
    const user = await verifyUser(req)

    if (req.method === 'GET') {
      // 获取任务列表
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('获取任务错误:', error)
        return res.status(400).json({ error: error.message })
      }

      res.status(200).json({
        success: true,
        data: data || []
      })

    } else if (req.method === 'POST') {
      // 创建新任务
      const { title, description, status, priority, due_date, tags, metadata } = req.body

      if (!title) {
        return res.status(400).json({ error: '任务标题是必填项' })
      }

      const { data, error } = await supabase
        .from('tasks')
        .insert({
          user_id: user.id,
          title: title,
          description: description || null,
          status: status || 'pending',
          priority: priority || 'medium',
          due_date: due_date || null,
          tags: tags || null,
          metadata: metadata || null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single()

      if (error) {
        console.error('创建任务错误:', error)
        return res.status(400).json({ error: error.message })
      }

      res.status(201).json({
        success: true,
        data: data
      })

    } else {
      res.status(405).json({ error: 'Method not allowed' })
    }

  } catch (error) {
    console.error('任务 API 错误:', error)
    if (error.message === '未提供认证令牌' || error.message === '无效的认证令牌') {
      res.status(401).json({ error: error.message })
    } else {
      res.status(500).json({ error: '服务器内部错误' })
    }
  }
}
