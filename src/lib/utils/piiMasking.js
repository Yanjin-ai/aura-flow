/**
 * PII (个人身份信息) 脱敏工具
 * 用于在日志中保护用户隐私数据
 */

// 敏感字段列表
const SENSITIVE_FIELDS = [
  'email', 'phone', 'password', 'token', 'secret', 'key',
  'name', 'username', 'id_card', 'bank_card', 'address',
  'ip', 'user_agent', 'session_id', 'cookie'
];

// 敏感模式匹配
const SENSITIVE_PATTERNS = [
  // 邮箱
  /([a-zA-Z0-9._%+-]+)@([a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/g,
  // 手机号
  /(\+?86)?1[3-9]\d{9}/g,
  // 身份证号
  /\d{17}[\dXx]/g,
  // 银行卡号
  /\d{16,19}/g,
  // IP 地址
  /\b(?:[0-9]{1,3}\.){3}[0-9]{1,3}\b/g,
  // JWT Token
  /eyJ[A-Za-z0-9_-]*\.[A-Za-z0-9_-]*\.[A-Za-z0-9_-]*/g
];

/**
 * 脱敏字符串
 * @param {string} str - 原始字符串
 * @param {string} type - 脱敏类型
 * @returns {string} 脱敏后的字符串
 */
function maskString(str, type = 'default') {
  if (!str || typeof str !== 'string') return str;
  
  switch (type) {
    case 'email':
      return str.replace(/(.{2}).*(@.*)/, '$1***$2');
    case 'phone':
      return str.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2');
    case 'id_card':
      return str.replace(/(\d{6})\d{8}(\d{4})/, '$1********$2');
    case 'bank_card':
      return str.replace(/(\d{4})\d{8,12}(\d{4})/, '$1********$2');
    case 'ip':
      return str.replace(/(\d{1,3}\.\d{1,3}\.)\d{1,3}\.\d{1,3}/, '$1***.***');
    case 'token':
      return str.substring(0, 10) + '...' + str.substring(str.length - 10);
    default:
      // 默认脱敏：保留前后各2个字符
      if (str.length <= 4) return '*'.repeat(str.length);
      return str.substring(0, 2) + '*'.repeat(str.length - 4) + str.substring(str.length - 2);
  }
}

/**
 * 脱敏对象中的敏感字段
 * @param {Object} obj - 原始对象
 * @param {Array} customFields - 自定义敏感字段列表
 * @returns {Object} 脱敏后的对象
 */
function maskObject(obj, customFields = []) {
  if (!obj || typeof obj !== 'object') return obj;
  
  const sensitiveFields = [...SENSITIVE_FIELDS, ...customFields];
  const masked = Array.isArray(obj) ? [] : {};
  
  for (const [key, value] of Object.entries(obj)) {
    const lowerKey = key.toLowerCase();
    
    // 检查字段名是否敏感
    if (sensitiveFields.some(field => lowerKey.includes(field.toLowerCase()))) {
      if (typeof value === 'string') {
        // 根据字段类型选择脱敏方式
        if (lowerKey.includes('email')) {
          masked[key] = maskString(value, 'email');
        } else if (lowerKey.includes('phone')) {
          masked[key] = maskString(value, 'phone');
        } else if (lowerKey.includes('token') || lowerKey.includes('secret')) {
          masked[key] = maskString(value, 'token');
        } else {
          masked[key] = maskString(value);
        }
      } else if (typeof value === 'object' && value !== null) {
        masked[key] = maskObject(value, customFields);
      } else {
        masked[key] = '[MASKED]';
      }
    } else if (typeof value === 'object' && value !== null) {
      // 递归处理嵌套对象
      masked[key] = maskObject(value, customFields);
    } else {
      masked[key] = value;
    }
  }
  
  return masked;
}

/**
 * 脱敏字符串中的敏感模式
 * @param {string} str - 原始字符串
 * @returns {string} 脱敏后的字符串
 */
function maskPatterns(str) {
  if (!str || typeof str !== 'string') return str;
  
  let masked = str;
  
  SENSITIVE_PATTERNS.forEach(pattern => {
    masked = masked.replace(pattern, (match) => {
      // 根据匹配内容判断类型
      if (match.includes('@')) {
        return maskString(match, 'email');
      } else if (/^1[3-9]\d{9}$/.test(match)) {
        return maskString(match, 'phone');
      } else if (/^\d{17}[\dXx]$/.test(match)) {
        return maskString(match, 'id_card');
      } else if (/^\d{16,19}$/.test(match)) {
        return maskString(match, 'bank_card');
      } else if (/^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(match)) {
        return maskString(match, 'ip');
      } else if (match.startsWith('eyJ')) {
        return maskString(match, 'token');
      } else {
        return maskString(match);
      }
    });
  });
  
  return masked;
}

/**
 * 脱敏日志数据
 * @param {any} data - 日志数据
 * @param {Object} options - 脱敏选项
 * @returns {any} 脱敏后的数据
 */
function maskLogData(data, options = {}) {
  const {
    maskObjects = true,
    maskStrings = true,
    customFields = [],
    preserveStructure = true
  } = options;
  
  if (!data) return data;
  
  // 处理字符串
  if (typeof data === 'string') {
    return maskStrings ? maskPatterns(data) : data;
  }
  
  // 处理对象
  if (typeof data === 'object' && data !== null) {
    if (maskObjects) {
      return maskObject(data, customFields);
    }
    return data;
  }
  
  // 其他类型直接返回
  return data;
}

/**
 * 创建脱敏函数
 * @param {Object} options - 脱敏配置
 * @returns {Function} 脱敏函数
 */
function createMasker(options = {}) {
  return (data) => maskLogData(data, options);
}

// 导出工具函数
export {
  maskString,
  maskObject,
  maskPatterns,
  maskLogData,
  createMasker,
  SENSITIVE_FIELDS,
  SENSITIVE_PATTERNS
};

// 默认导出
export default {
  maskString,
  maskObject,
  maskPatterns,
  maskLogData,
  createMasker,
  SENSITIVE_FIELDS,
  SENSITIVE_PATTERNS
};
