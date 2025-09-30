// 任务 API - 使用 Supabase 数据库
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('缺少 Supabase 环境变量')
}

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

  try {
    // 验证用户身份
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: '未提供有效的认证令牌' });
    }

    const token = authHeader.substring(7);
    let tokenData;
    try {
      const decodedToken = Buffer.from(token, 'base64').toString();
      tokenData = JSON.parse(decodedToken);
    } catch (parseError) {
      return res.status(401).json({ error: '无效的认证令牌格式' });
    }

    if (tokenData.exp && Date.now() > tokenData.exp) {
      return res.status(401).json({ error: '认证令牌已过期' });
    }

    const userId = tokenData.user_id;

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
        return res.status(500).json({ error: '获取任务失败: ' + error.message });
      }
      
      return res.status(200).json(tasks || []);
    }
    
    if (req.method === 'POST') {
      // 创建新任务
      const taskData = req.body;
      
      const { data: newTask, error } = await supabase
        .from('tasks')
        .insert({
          user_id: userId,
          title: taskData.title || taskData.content || '新任务',
          content: taskData.content || taskData.title || '新任务',
          description: taskData.description || '',
          status: taskData.status || 'pending',
          priority: taskData.priority || 'medium',
          due_date: taskData.due_date || null,
          due_time: taskData.due_time || null,
          date: taskData.date || new Date().toISOString().split('T')[0],
          order_index: taskData.order_index || 0,
          completed: taskData.completed || false,
          ai_category: taskData.ai_category || null,
          category: taskData.category || null,
          tags: taskData.tags || [],
          metadata: taskData.metadata || {}
        })
        .select()
        .single();
      
      if (error) {
        return res.status(500).json({ error: '创建任务失败: ' + error.message });
      }
      
      return res.status(201).json(newTask);
    }
    
    if (req.method === 'PATCH') {
      // 更新任务
      const taskId = req.query.id;
      const updateData = req.body;
      
      const { data: updatedTask, error } = await supabase
        .from('tasks')
        .update({
          ...updateData,
          updated_at: new Date().toISOString()
        })
        .eq('id', taskId)
        .eq('user_id', userId) // 确保只能更新自己的任务
        .select()
        .single();
      
      if (error) {
        if (error.code === 'PGRST116') {
          return res.status(404).json({ error: '任务不存在' });
        }
        return res.status(500).json({ error: '更新任务失败: ' + error.message });
      }
      
      return res.status(200).json(updatedTask);
    }
    
    if (req.method === 'DELETE') {
      // 删除任务
      const taskId = req.query.id;
      
      const { error } = await supabase
        .from('tasks')
        .delete()
        .eq('id', taskId)
        .eq('user_id', userId); // 确保只能删除自己的任务
      
      if (error) {
        return res.status(500).json({ error: '删除任务失败: ' + error.message });
      }
      
      return res.status(200).json({ success: true });
    }
    
    return res.status(405).json({ error: 'Method not allowed' });

  } catch (error) {
    res.status(500).json({ error: '服务器内部错误: ' + error.message });
  }
}
