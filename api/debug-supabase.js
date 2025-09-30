// 调试 Supabase 连接 API
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY

export default async function handler(req, res) {
  // 设置 CORS 头
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // 检查环境变量
    if (!supabaseUrl || !supabaseKey) {
      return res.status(500).json({
        success: false,
        error: 'Missing Supabase environment variables',
        details: {
          hasUrl: !!supabaseUrl,
          hasKey: !!supabaseKey,
          urlPrefix: supabaseUrl ? supabaseUrl.substring(0, 20) + '...' : 'NOT_SET',
          keyPrefix: supabaseKey ? supabaseKey.substring(0, 20) + '...' : 'NOT_SET'
        }
      });
    }

    // 创建 Supabase 客户端
    const supabase = createClient(supabaseUrl, supabaseKey);

    // 测试连接 - 尝试查询用户表
    const { data, error } = await supabase
      .from('users')
      .select('count')
      .limit(1);

    if (error) {
      return res.status(500).json({
        success: false,
        error: 'Supabase connection failed',
        details: {
          errorCode: error.code,
          errorMessage: error.message,
          errorDetails: error.details,
          errorHint: error.hint
        }
      });
    }

    // 测试连接 - 尝试查询任务表
    const { data: taskData, error: taskError } = await supabase
      .from('tasks')
      .select('count')
      .limit(1);

    if (taskError) {
      return res.status(500).json({
        success: false,
        error: 'Tasks table access failed',
        details: {
          errorCode: taskError.code,
          errorMessage: taskError.message,
          errorDetails: taskError.details,
          errorHint: taskError.hint
        }
      });
    }

    res.status(200).json({
      success: true,
      message: 'Supabase connection successful',
      details: {
        usersTableAccessible: true,
        tasksTableAccessible: true,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Unexpected error',
      details: {
        errorMessage: error.message,
        errorStack: error.stack
      }
    });
  }
}
