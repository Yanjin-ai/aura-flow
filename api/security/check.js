// 安全检查 API
import { performSecurityCheck, generateSecurityReport } from '../utils/security-check.js'
import { authenticateToken } from '../middleware/security.js'

export default async function handler(req, res) {
  // 设置 CORS 头
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // 验证管理员权限（可选）
    const isAdmin = req.headers.authorization && 
                   req.headers.authorization.startsWith('Bearer ');
    
    if (isAdmin) {
      try {
        authenticateToken(req, res, () => {});
      } catch (error) {
        return res.status(401).json({ error: '需要管理员权限' });
      }
    }

    // 执行安全检查
    const securityCheck = await performSecurityCheck();
    const securityReport = generateSecurityReport(securityCheck);

    // 根据权限返回不同级别的信息
    const response = isAdmin ? {
      ...securityCheck,
      report: securityReport
    } : {
      status: securityCheck.overallStatus,
      timestamp: securityCheck.timestamp,
      summary: securityReport.summary
    };

    res.status(200).json(response);

  } catch (error) {
    console.error('安全检查错误:', error);
    res.status(500).json({ 
      error: '安全检查失败',
      message: error.message 
    });
  }
}
