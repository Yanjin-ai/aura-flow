// 健康检查 API
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
    const health = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      version: process.env.VITE_BUILD_VERSION || 'dev',
      environment: process.env.NODE_ENV || 'development',
      services: {}
    };

    // 检查 Supabase 连接
    if (supabaseUrl && supabaseKey) {
      try {
        const supabase = createClient(supabaseUrl, supabaseKey);
        const { data, error } = await supabase
          .from('users')
          .select('count')
          .limit(1);
        
        health.services.database = {
          status: error ? 'unhealthy' : 'healthy',
          provider: 'supabase',
          error: error?.message
        };
      } catch (error) {
        health.services.database = {
          status: 'unhealthy',
          provider: 'supabase',
          error: error.message
        };
      }
    } else {
      health.services.database = {
        status: 'not_configured',
        provider: 'none'
      };
    }

    // 检查环境变量
    health.services.environment = {
      supabase_configured: !!(supabaseUrl && supabaseKey),
      ai_provider: process.env.VITE_AI_PROVIDER || 'mock'
    };

    const isHealthy = health.services.database.status === 'healthy' || 
                     health.services.database.status === 'not_configured';

    res.status(isHealthy ? 200 : 503).json(health);

  } catch (error) {
    console.error('健康检查错误:', error);
    res.status(500).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: error.message
    });
  }
}
