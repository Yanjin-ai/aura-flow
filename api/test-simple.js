// 简单的测试 API
export default async function handler(req, res) {
  console.log('Test API called');
  console.log('Request method:', req.method);
  console.log('Request body:', req.body);
  console.log('Environment variables:', {
    NODE_ENV: process.env.NODE_ENV,
    VITE_SUPABASE_URL: process.env.VITE_SUPABASE_URL,
    VITE_SUPABASE_ANON_KEY: process.env.VITE_SUPABASE_ANON_KEY ? 'exists' : 'missing'
  });

  res.status(200).json({
    success: true,
    message: 'Test API works',
    timestamp: new Date().toISOString(),
    env: {
      NODE_ENV: process.env.NODE_ENV,
      VITE_SUPABASE_URL: process.env.VITE_SUPABASE_URL,
      VITE_SUPABASE_ANON_KEY: process.env.VITE_SUPABASE_ANON_KEY ? 'exists' : 'missing'
    }
  });
}
