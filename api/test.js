/**
 * 测试 API - 用于调试
 * GET /api/test
 */

export default async function handler(req, res) {
  console.log('测试 API 被调用');
  console.log('请求方法:', req.method);
  console.log('请求头:', req.headers);
  console.log('请求体:', req.body);
  
  res.status(200).json({
    success: true,
    message: '测试 API 工作正常',
    method: req.method,
    body: req.body,
    timestamp: new Date().toISOString()
  });
}
