// 简化的任务管理 API - 暂时不使用数据库

export default async function handler(req, res) {
  // 获取认证信息
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: '未提供有效的认证令牌' });
  }

  const token = authHeader.substring(7);
  let user_id;
  
  try {
    const tokenData = JSON.parse(Buffer.from(token, 'base64').toString());
    user_id = tokenData.user_id;
  } catch (error) {
    return res.status(401).json({ error: '无效的认证令牌' });
  }

  if (req.method === 'GET') {
    // 获取任务列表（暂时返回空数组）
    try {
      res.status(200).json({
        success: true,
        data: []
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

      const task = {
        id: 'task_' + Date.now(),
        user_id: user_id,
        title: title || content,
        content: content || title,
        date: date || new Date().toISOString().split('T')[0],
        order_index: order_index || 0,
        completed: completed || false,
        ai_category: ai_category || null,
        due_time: due_time || null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      res.status(201).json({
        success: true,
        data: task
      });
    } catch (error) {
      console.error('创建任务错误:', error);
      res.status(500).json({ error: '服务器内部错误' });
    }
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}