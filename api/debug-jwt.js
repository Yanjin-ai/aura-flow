// JWT 调试 API - 临时用于排查 JWT 问题
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production'

export default async function handler(req, res) {
  // 设置 CORS 头
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(400).json({ 
        error: '需要提供 Authorization: Bearer token',
        debug: {
          jwt_secret_configured: !!process.env.JWT_SECRET,
          jwt_secret_length: JWT_SECRET.length,
          jwt_secret_preview: JWT_SECRET.substring(0, 10) + '...'
        }
      });
    }

    const token = authHeader.substring(7);
    
    // 尝试解析 token（不验证签名）
    let decoded;
    try {
      decoded = jwt.decode(token, { complete: true });
    } catch (decodeError) {
      return res.status(400).json({ 
        error: 'Token 格式无效',
        debug: { decode_error: decodeError.message }
      });
    }

    // 尝试验证 token
    let verified;
    try {
      verified = jwt.verify(token, JWT_SECRET, {
        issuer: 'aura-flow',
        audience: 'aura-flow-users'
      });
    } catch (verifyError) {
      return res.status(400).json({ 
        error: 'Token 验证失败',
        debug: {
          verify_error: verifyError.message,
          token_header: decoded?.header,
          token_payload: decoded?.payload,
          jwt_secret_configured: !!process.env.JWT_SECRET,
          jwt_secret_length: JWT_SECRET.length
        }
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Token 验证成功',
      debug: {
        verified_payload: verified,
        jwt_secret_configured: !!process.env.JWT_SECRET,
        jwt_secret_length: JWT_SECRET.length
      }
    });

  } catch (error) {
    return res.status(500).json({ 
      error: '调试 API 错误',
      debug: { error_message: error.message }
    });
  }
}
