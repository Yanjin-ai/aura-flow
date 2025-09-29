// 安全审计日志系统
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY

// 创建 Supabase 客户端
const supabase = createClient(supabaseUrl, supabaseKey)

/**
 * 审计事件类型
 */
export const AUDIT_EVENTS = {
  // 认证相关
  LOGIN_SUCCESS: 'login_success',
  LOGIN_FAILED: 'login_failed',
  LOGOUT: 'logout',
  REGISTER: 'register',
  PASSWORD_CHANGE: 'password_change',
  
  // 数据操作
  TASK_CREATE: 'task_create',
  TASK_UPDATE: 'task_update',
  TASK_DELETE: 'task_delete',
  
  // 安全相关
  SUSPICIOUS_ACTIVITY: 'suspicious_activity',
  RATE_LIMIT_EXCEEDED: 'rate_limit_exceeded',
  INVALID_TOKEN: 'invalid_token',
  
  // 系统相关
  API_ERROR: 'api_error',
  SYSTEM_ERROR: 'system_error'
}

/**
 * 记录审计事件
 */
export async function logAuditEvent(event, details = {}) {
  try {
    const auditLog = {
      event_type: event,
      details: JSON.stringify(details),
      ip_address: details.ip || 'unknown',
      user_agent: details.userAgent || 'unknown',
      user_id: details.userId || null,
      timestamp: new Date().toISOString(),
      severity: getEventSeverity(event)
    };

    // 记录到 Supabase（如果配置了）
    if (supabaseUrl && supabaseKey) {
      await supabase
        .from('audit_logs')
        .insert(auditLog);
    }

    // 同时记录到控制台
    console.log(`[AUDIT] ${event}:`, JSON.stringify(auditLog));

  } catch (error) {
    console.error('审计日志记录失败:', error);
  }
}

/**
 * 获取事件严重程度
 */
function getEventSeverity(event) {
  const severityMap = {
    [AUDIT_EVENTS.LOGIN_SUCCESS]: 'info',
    [AUDIT_EVENTS.LOGIN_FAILED]: 'warning',
    [AUDIT_EVENTS.LOGOUT]: 'info',
    [AUDIT_EVENTS.REGISTER]: 'info',
    [AUDIT_EVENTS.PASSWORD_CHANGE]: 'info',
    [AUDIT_EVENTS.TASK_CREATE]: 'info',
    [AUDIT_EVENTS.TASK_UPDATE]: 'info',
    [AUDIT_EVENTS.TASK_DELETE]: 'info',
    [AUDIT_EVENTS.SUSPICIOUS_ACTIVITY]: 'critical',
    [AUDIT_EVENTS.RATE_LIMIT_EXCEEDED]: 'warning',
    [AUDIT_EVENTS.INVALID_TOKEN]: 'warning',
    [AUDIT_EVENTS.API_ERROR]: 'error',
    [AUDIT_EVENTS.SYSTEM_ERROR]: 'critical'
  };

  return severityMap[event] || 'info';
}

/**
 * 检测可疑活动
 */
export function detectSuspiciousActivity(req, user = null) {
  const suspiciousPatterns = [
    // SQL 注入尝试
    /('|(\\')|(;)|(\\;)|(union)|(select)|(insert)|(update)|(delete)|(drop)|(create)|(alter))/i,
    
    // XSS 尝试
    /<script|javascript:|on\w+\s*=/i,
    
    // 路径遍历尝试
    /\.\.\/|\.\.\\|%2e%2e%2f|%2e%2e%5c/i,
    
    // 命令注入尝试
    /(\||&|;|\$\(|\`)/i
  ];

  const url = req.url || '';
  const body = JSON.stringify(req.body || {});
  const query = JSON.stringify(req.query || {});
  const userAgent = req.get('User-Agent') || '';

  const allInput = `${url} ${body} ${query} ${userAgent}`.toLowerCase();

  for (const pattern of suspiciousPatterns) {
    if (pattern.test(allInput)) {
      logAuditEvent(AUDIT_EVENTS.SUSPICIOUS_ACTIVITY, {
        userId: user?.id,
        ip: req.ip,
        userAgent,
        pattern: pattern.toString(),
        input: allInput.substring(0, 500), // 限制长度
        url: req.url
      });
      return true;
    }
  }

  return false;
}

/**
 * 创建审计中间件
 */
export function createAuditMiddleware(eventType) {
  return async (req, res, next) => {
    const startTime = Date.now();
    
    // 记录请求开始
    const originalSend = res.send;
    res.send = function(data) {
      const duration = Date.now() - startTime;
      
      // 记录审计事件
      logAuditEvent(eventType, {
        userId: req.user?.user_id,
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        method: req.method,
        url: req.url,
        statusCode: res.statusCode,
        duration: `${duration}ms`,
        success: res.statusCode < 400
      });
      
      originalSend.call(this, data);
    };
    
    next();
  };
}
