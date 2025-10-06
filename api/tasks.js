// 任务 API（Supabase Auth）
import { createClient } from '@supabase/supabase-js'

// 在 Vercel 中，环境变量可能需要不同的引用方式
const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY

// 调试日志
console.log('API tasks 环境变量检查:', {
  url: supabaseUrl ? '存在' : '缺失',
  key: supabaseKey ? '存在' : '缺失'
});

export default async function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  if (req.method === 'OPTIONS') return res.status(200).end();

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
    
    // 验证用户身份（优先 Bearer Token，其次 Cookie）
    let user = null;
    let authError = null;
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const bearer = authHeader.substring(7);
      const r = await supabase.auth.getUser(bearer);
      user = r.data?.user;
      authError = r.error || null;
    } else {
      const r = await supabase.auth.getUser();
      user = r.data?.user;
      authError = r.error || null;
    }
    
    if (authError || !user) {
      return res.status(401).json({ error: '未授权访问' });
    }

    const userId = user.id;

    if (req.method === 'GET') {
      // 获取任务列表
      const { date, completed } = req.query;
      
      let query = supabase
        .from('tasks')
        .select('*')
        .eq('user_id', userId);
      
      if (date) {
        query = query.eq('date', date);
      }
      
      if (completed !== undefined) {
        const isCompleted = completed === 'true';
        query = query.eq('completed', isCompleted);
      }
      
      // 按 order_index 排序
      query = query.order('order_index', { ascending: true });
      
      const { data: tasks, error } = await query;
      
      if (error) {
        console.error('获取任务失败:', error);
        return res.status(500).json({ error: '获取任务失败' });
      }
      
      return res.status(200).json(tasks || []);
    }

    if (req.method === 'POST') {
      // 创建新任务
      const taskData = req.body;
      
      const { data: newTask, error } = await supabase
        .from('tasks')
        .insert({
          ...taskData,
          user_id: userId
        })
        .select()
        .single();
      
      if (error) {
        console.error('创建任务失败:', error);
        return res.status(500).json({ error: '创建任务失败' });
      }
      
      return res.status(201).json(newTask);
    }

    if (req.method === 'PATCH') {
      // 更新任务
      const { id, ...updateData } = req.body;
      
      if (!id) {
        return res.status(400).json({ error: '缺少任务ID' });
      }
      
      const { data: updatedTask, error } = await supabase
        .from('tasks')
        .update(updateData)
        .eq('id', id)
        .eq('user_id', userId) // 确保只能更新自己的任务
        .select()
        .single();
      
      if (error) {
        console.error('更新任务失败:', error);
        return res.status(500).json({ error: '更新任务失败' });
      }
      
      if (!updatedTask) {
        return res.status(404).json({ error: '任务不存在' });
      }
      
      return res.status(200).json(updatedTask);
    }

    if (req.method === 'DELETE') {
      // 删除任务
      const { id } = req.query;
      
      if (!id) {
        return res.status(400).json({ error: '缺少任务ID' });
      }
      
      const { error } = await supabase
        .from('tasks')
        .delete()
        .eq('id', id)
        .eq('user_id', userId); // 确保只能删除自己的任务
      
      if (error) {
        console.error('删除任务失败:', error);
        return res.status(500).json({ error: '删除任务失败' });
      }
      
      return res.status(200).json({ success: true });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('任务API错误:', error);
    return res.status(500).json({ error: '服务器内部错误' });
  }
}