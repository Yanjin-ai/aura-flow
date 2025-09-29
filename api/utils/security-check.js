// 安全配置检查工具
import { createClient } from '@supabase/supabase-js'

/**
 * 安全配置检查
 */
export async function performSecurityCheck() {
  const checks = [];
  
  // 检查环境变量
  checks.push(checkEnvironmentVariables());
  
  // 检查数据库连接
  checks.push(await checkDatabaseConnection());
  
  // 检查 JWT 配置
  checks.push(checkJWTConfiguration());
  
  // 检查 OAuth 配置
  checks.push(checkOAuthConfiguration());
  
  // 检查 HTTPS 配置
  checks.push(checkHTTPSConfiguration());
  
  return {
    timestamp: new Date().toISOString(),
    checks: checks.flat(),
    overallStatus: checks.flat().every(check => check.status === 'pass') ? 'secure' : 'warning'
  };
}

/**
 * 检查环境变量
 */
function checkEnvironmentVariables() {
  const requiredVars = [
    'VITE_SUPABASE_URL',
    'VITE_SUPABASE_ANON_KEY',
    'JWT_SECRET'
  ];
  
  const optionalVars = [
    'VITE_GOOGLE_CLIENT_ID',
    'GOOGLE_CLIENT_SECRET',
    'VITE_GITHUB_CLIENT_ID',
    'GITHUB_CLIENT_SECRET',
    'ENCRYPTION_KEY'
  ];
  
  const checks = [];
  
  // 检查必需的环境变量
  for (const varName of requiredVars) {
    checks.push({
      name: `Environment Variable: ${varName}`,
      status: process.env[varName] ? 'pass' : 'fail',
      message: process.env[varName] ? '已配置' : '未配置',
      severity: 'critical'
    });
  }
  
  // 检查可选的环境变量
  for (const varName of optionalVars) {
    checks.push({
      name: `Environment Variable: ${varName}`,
      status: process.env[varName] ? 'pass' : 'warning',
      message: process.env[varName] ? '已配置' : '未配置（可选）',
      severity: 'low'
    });
  }
  
  // 检查 JWT 密钥强度
  const jwtSecret = process.env.JWT_SECRET;
  if (jwtSecret) {
    const isStrong = jwtSecret.length >= 32 && /[A-Za-z0-9!@#$%^&*]/.test(jwtSecret);
    checks.push({
      name: 'JWT Secret Strength',
      status: isStrong ? 'pass' : 'warning',
      message: isStrong ? 'JWT 密钥强度足够' : 'JWT 密钥强度不足，建议使用更复杂的密钥',
      severity: 'high'
    });
  }
  
  return checks;
}

/**
 * 检查数据库连接
 */
async function checkDatabaseConnection() {
  const checks = [];
  
  try {
    const supabaseUrl = process.env.VITE_SUPABASE_URL;
    const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
    
    if (!supabaseUrl || !supabaseKey) {
      checks.push({
        name: 'Database Connection',
        status: 'fail',
        message: 'Supabase 配置缺失',
        severity: 'critical'
      });
      return checks;
    }
    
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // 测试连接
    const { data, error } = await supabase
      .from('users')
      .select('count')
      .limit(1);
    
    checks.push({
      name: 'Database Connection',
      status: error ? 'fail' : 'pass',
      message: error ? `数据库连接失败: ${error.message}` : '数据库连接正常',
      severity: 'critical'
    });
    
    // 检查 RLS 是否启用
    const { data: rlsData, error: rlsError } = await supabase
      .from('users')
      .select('*')
      .limit(1);
    
    checks.push({
      name: 'Row Level Security',
      status: rlsError ? 'pass' : 'warning',
      message: rlsError ? 'RLS 已启用' : 'RLS 可能未启用',
      severity: 'high'
    });
    
  } catch (error) {
    checks.push({
      name: 'Database Connection',
      status: 'fail',
      message: `数据库检查失败: ${error.message}`,
      severity: 'critical'
    });
  }
  
  return checks;
}

/**
 * 检查 JWT 配置
 */
function checkJWTConfiguration() {
  const checks = [];
  
  const jwtSecret = process.env.JWT_SECRET;
  const jwtExpiresIn = process.env.JWT_EXPIRES_IN;
  
  checks.push({
    name: 'JWT Secret Configuration',
    status: jwtSecret ? 'pass' : 'fail',
    message: jwtSecret ? 'JWT 密钥已配置' : 'JWT 密钥未配置',
    severity: 'critical'
  });
  
  checks.push({
    name: 'JWT Expiration',
    status: jwtExpiresIn ? 'pass' : 'warning',
    message: jwtExpiresIn ? `JWT 过期时间: ${jwtExpiresIn}` : 'JWT 过期时间未配置',
    severity: 'medium'
  });
  
  return checks;
}

/**
 * 检查 OAuth 配置
 */
function checkOAuthConfiguration() {
  const checks = [];
  
  const googleClientId = process.env.VITE_GOOGLE_CLIENT_ID;
  const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const githubClientId = process.env.VITE_GITHUB_CLIENT_ID;
  const githubClientSecret = process.env.GITHUB_CLIENT_SECRET;
  
  // Google OAuth
  checks.push({
    name: 'Google OAuth Configuration',
    status: (googleClientId && googleClientSecret) ? 'pass' : 'warning',
    message: (googleClientId && googleClientSecret) ? 'Google OAuth 已配置' : 'Google OAuth 未配置',
    severity: 'low'
  });
  
  // GitHub OAuth
  checks.push({
    name: 'GitHub OAuth Configuration',
    status: (githubClientId && githubClientSecret) ? 'pass' : 'warning',
    message: (githubClientId && githubClientSecret) ? 'GitHub OAuth 已配置' : 'GitHub OAuth 未配置',
    severity: 'low'
  });
  
  return checks;
}

/**
 * 检查 HTTPS 配置
 */
function checkHTTPSConfiguration() {
  const checks = [];
  
  const isHTTPS = process.env.NODE_ENV === 'production' && 
                  (process.env.VERCEL_URL?.startsWith('https://') || 
                   process.env.HTTPS === 'true');
  
  checks.push({
    name: 'HTTPS Configuration',
    status: isHTTPS ? 'pass' : 'warning',
    message: isHTTPS ? 'HTTPS 已启用' : '生产环境建议启用 HTTPS',
    severity: 'high'
  });
  
  return checks;
}

/**
 * 生成安全报告
 */
export function generateSecurityReport(securityCheck) {
  const report = {
    summary: {
      totalChecks: securityCheck.checks.length,
      passed: securityCheck.checks.filter(c => c.status === 'pass').length,
      failed: securityCheck.checks.filter(c => c.status === 'fail').length,
      warnings: securityCheck.checks.filter(c => c.status === 'warning').length
    },
    criticalIssues: securityCheck.checks.filter(c => c.severity === 'critical' && c.status !== 'pass'),
    recommendations: generateRecommendations(securityCheck.checks)
  };
  
  return report;
}

/**
 * 生成安全建议
 */
function generateRecommendations(checks) {
  const recommendations = [];
  
  const failedChecks = checks.filter(c => c.status === 'fail');
  const warningChecks = checks.filter(c => c.status === 'warning');
  
  if (failedChecks.length > 0) {
    recommendations.push({
      priority: 'high',
      message: '存在关键安全问题，需要立即修复',
      items: failedChecks.map(c => c.name)
    });
  }
  
  if (warningChecks.length > 0) {
    recommendations.push({
      priority: 'medium',
      message: '存在安全警告，建议修复',
      items: warningChecks.map(c => c.name)
    });
  }
  
  // 通用建议
  recommendations.push({
    priority: 'low',
    message: '安全最佳实践建议',
    items: [
      '定期更新依赖包',
      '启用审计日志',
      '配置速率限制',
      '使用强密码策略',
      '定期备份数据'
    ]
  });
  
  return recommendations;
}
