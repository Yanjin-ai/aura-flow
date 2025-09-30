// 任务 API
export default async function handler(req, res) {
  
  // 设置 CORS 头
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    // 模拟任务数据存储（使用内存，实际应该用数据库）
    if (!global.mockTasks) {
      global.mockTasks = [];
    }

    if (req.method === 'GET') {
      // 获取任务列表
      const { user_id, date, completed } = req.query;
      
      let filteredTasks = global.mockTasks;
      
      if (user_id) {
        filteredTasks = filteredTasks.filter(task => task.user_id === user_id);
      }
      
      if (date) {
        filteredTasks = filteredTasks.filter(task => task.date === date);
      }
      
      if (completed !== undefined) {
        const isCompleted = completed === 'true';
        filteredTasks = filteredTasks.filter(task => task.completed === isCompleted);
      }
      
      // 按 order_index 排序
      filteredTasks.sort((a, b) => (a.order_index || 0) - (b.order_index || 0));
      
      return res.status(200).json(filteredTasks);
    }
    
    if (req.method === 'POST') {
      // 创建新任务
      const taskData = req.body;
      
      const newTask = {
        id: 'task-' + Date.now(),
        user_id: taskData.user_id || 'mock-user',
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
        metadata: taskData.metadata || {},
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      global.mockTasks.push(newTask);
      
      return res.status(201).json(newTask);
    }
    
    if (req.method === 'PATCH') {
      // 更新任务
      const taskId = req.query.id;
      const updateData = req.body;
      
      const taskIndex = global.mockTasks.findIndex(task => task.id === taskId);
      if (taskIndex === -1) {
        return res.status(404).json({ error: '任务不存在' });
      }
      
      global.mockTasks[taskIndex] = {
        ...global.mockTasks[taskIndex],
        ...updateData,
        updated_at: new Date().toISOString()
      };
      
      return res.status(200).json(global.mockTasks[taskIndex]);
    }
    
    if (req.method === 'DELETE') {
      // 删除任务
      const taskId = req.query.id;
      
      const taskIndex = global.mockTasks.findIndex(task => task.id === taskId);
      if (taskIndex === -1) {
        return res.status(404).json({ error: '任务不存在' });
      }
      
      global.mockTasks.splice(taskIndex, 1);
      
      return res.status(200).json({ success: true });
    }
    
    return res.status(405).json({ error: 'Method not allowed' });

  } catch (error) {
    res.status(500).json({ error: '服务器内部错误: ' + error.message });
  }
}
