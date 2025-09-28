/**
 * 任务详情 API
 * GET /api/tasks/[id] - 获取单个任务
 * PUT /api/tasks/[id] - 更新任务
 * DELETE /api/tasks/[id] - 删除任务
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
    
    const { id } = req.query

    if (!id) {
      return res.status(400).json({ error: '任务ID是必填项' })
    }

    if (req.method === 'GET') {
      // 获取单个任务
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .eq('id', id)
        .eq('user_id', user.id)
        .single()

      if (error) {
        console.error('获取任务错误:', error)
        return res.status(404).json({ error: '任务不存在' })
      }

      res.status(200).json({
        success: true,
        data: data
      })

    } else if (req.method === 'PUT') {
      // 更新任务
      const { title, description, status, priority, due_date, tags, metadata } = req.body

      const updateData = {
        updated_at: new Date().toISOString()
      }

      if (title !== undefined) updateData.title = title
      if (description !== undefined) updateData.description = description
      if (status !== undefined) updateData.status = status
      if (priority !== undefined) updateData.priority = priority
      if (due_date !== undefined) updateData.due_date = due_date
      if (tags !== undefined) updateData.tags = tags
      if (metadata !== undefined) updateData.metadata = metadata

      const { data, error } = await supabase
        .from('tasks')
        .update(updateData)
        .eq('id', id)
        .eq('user_id', user.id)
        .select()
        .single()

      if (error) {
        console.error('更新任务错误:', error)
        return res.status(400).json({ error: error.message })
      }

      res.status(200).json({
        success: true,
        data: data
      })

    } else if (req.method === 'DELETE') {
      // 删除任务
      const { error } = await supabase
        .from('tasks')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id)

      if (error) {
        console.error('删除任务错误:', error)
        return res.status(400).json({ error: error.message })
      }

      res.status(200).json({
        success: true,
        message: '任务删除成功'
      })

    } else {
      res.status(405).json({ error: 'Method not allowed' })
    }

  } catch (error) {
    console.error('任务详情 API 错误:', error)
    if (error.message === '未提供认证令牌' || error.message === '无效的认证令牌') {
      res.status(401).json({ error: error.message })
    } else {
      res.status(500).json({ error: '服务器内部错误' })
    }
  }
}
