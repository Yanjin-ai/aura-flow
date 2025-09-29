// 完整的任务管理 API - 使用 Supabase
import { createClient } from '@supabase/supabase-js'
import { verifyToken, extractTokenFromHeader } from './auth/jwt.js'

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

  // 验证 JWT token
  let user_id;
  try {
    const token = extractTokenFromHeader(req.headers.authorization);
    const tokenData = verifyToken(token);
    user_id = tokenData.user_id;
  } catch (error) {
    return res.status(401).json({ error: error.message });
  }

  // 创建 Supabase 客户端
  const supabase = createClient(supabaseUrl, supabaseKey);

  if (req.method === 'GET') {
    // 获取任务列表
    try {
      const { data: tasks, error } = await supabase
        .from('tasks')
        .select('*')
        .eq('user_id', user_id)
        .order('order_index', { ascending: true });

      if (error) {
        console.error('获取任务错误:', error);
        return res.status(500).json({ error: '数据库查询失败' });
      }

      res.status(200).json({
        success: true,
        data: tasks || []
      });
    } catch (error) {
      console.error('获取任务错误:', error);
      res.status(500).json({ error: '服务器内部错误' });
    }
  } else if (req.method === 'POST') {
    // 创建新任务
    try {
      const { title, content, date, order_index, completed, ai_category, due_time } = req.body;

      if (!title && !content) {
        return res.status(400).json({ error: '任务标题是必填项' });
      }

      const { data: task, error } = await supabase
        .from('tasks')
        .insert({
          user_id: user_id,
          title: title || content,
          content: content || title,
          date: date || new Date().toISOString().split('T')[0],
          order_index: order_index || 0,
          completed: completed || false,
          ai_category: ai_category || null,
          due_time: due_time || null
        })
        .select()
        .single();

      if (error) {
        console.error('创建任务错误:', error);
        return res.status(500).json({ error: '数据库插入失败' });
      }

      res.status(201).json({
        success: true,
        data: task
      });
    } catch (error) {
      console.error('创建任务错误:', error);
      res.status(500).json({ error: '服务器内部错误' });
    }
  } else if (req.method === 'PUT') {
    // 更新任务
    try {
      const { id, ...updateData } = req.body;

      if (!id) {
        return res.status(400).json({ error: '任务ID是必填项' });
      }

      const { data: task, error } = await supabase
        .from('tasks')
        .update({
          ...updateData,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .eq('user_id', user_id) // 确保只能更新自己的任务
        .select()
        .single();

      if (error) {
        console.error('更新任务错误:', error);
        return res.status(500).json({ error: '数据库更新失败' });
      }

      res.status(200).json({
        success: true,
        data: task
      });
    } catch (error) {
      console.error('更新任务错误:', error);
      res.status(500).json({ error: '服务器内部错误' });
    }
  } else if (req.method === 'DELETE') {
    // 删除任务
    try {
      const { id } = req.body;

      if (!id) {
        return res.status(400).json({ error: '任务ID是必填项' });
      }

      const { error } = await supabase
        .from('tasks')
        .delete()
        .eq('id', id)
        .eq('user_id', user_id); // 确保只能删除自己的任务

      if (error) {
        console.error('删除任务错误:', error);
        return res.status(500).json({ error: '数据库删除失败' });
      }

      res.status(200).json({
        success: true,
        message: '任务删除成功'
      });
    } catch (error) {
      console.error('删除任务错误:', error);
      res.status(500).json({ error: '服务器内部错误' });
    }
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}