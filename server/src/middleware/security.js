/**
 * 安全中间件集合
 * 包含 CSP、CORS、Cookie 安全等配置
 */

import helmet from 'helmet';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import crypto from 'crypto';

/**
 * 生成 CSP nonce
 */
export const generateNonce = () => {
  return crypto.randomBytes(16).toString('base64');
};

/**
 * Helmet 安全头配置
 */
export const helmetConfig = helmet({
  // 内容安全策略
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: [
        "'self'",
        "'unsafe-inline'", // 允许内联样式（Tailwind CSS 需要）
        "https://fonts.googleapis.com"
      ],
      scriptSrc: [
        "'self'",
        (req, res) => {
          // 动态注入 nonce
          const nonce = res.locals.nonce || generateNonce();
          res.locals.nonce = nonce;
          return `'nonce-${nonce}'`;
        }
      ],
      fontSrc: [
        "'self'",
        "https://fonts.gstatic.com"
      ],
      imgSrc: [
        "'self'",
        "data:",
        "https:"
      ],
      connectSrc: [
        "'self'",
        "https://api.openai.com",
        "https://api.sentry.io"
      ],
      frameSrc: ["'none'"],
      objectSrc: ["'none'"],
      baseUri: ["'self'"],
      formAction: ["'self'"],
      upgradeInsecureRequests: []
    }
  },
  
  // 其他安全头
  crossOriginEmbedderPolicy: false, // 允许跨域嵌入
  crossOriginResourcePolicy: { policy: "cross-origin" },
  
  // HSTS 配置
  hsts: {
    maxAge: 31536000, // 1年
    includeSubDomains: true,
    preload: true
  },
  
  // 其他安全头
  noSniff: true,
  xssFilter: true,
  referrerPolicy: { policy: "strict-origin-when-cross-origin" },
  
  // 权限策略
  permissionsPolicy: {
    camera: [],
    microphone: [],
    geolocation: [],
    payment: [],
    usb: [],
    magnetometer: [],
    gyroscope: [],
    accelerometer: []
  }
});

/**
 * CORS 配置
 */
export const corsConfig = cors({
  origin: function (origin, callback) {
    // 允许的域名列表
    const allowedOrigins = [
      process.env.CORS_ORIGIN || 'http://localhost:5173',
      'http://localhost:3000',
      'http://127.0.0.1:5173',
      'https://yourdomain.com',
      'https://www.yourdomain.com'
    ];
    
    // 开发环境允许所有来源
    if (process.env.NODE_ENV === 'development' || !process.env.NODE_ENV) {
      return callback(null, true);
    }
    
    // 生产环境检查来源
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.log('CORS 拒绝来源:', origin);
      callback(new Error('CORS 策略不允许此来源'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'X-Requested-With',
    'X-CSRF-Token',
    'X-Nonce'
  ],
  exposedHeaders: ['X-Nonce'],
  maxAge: 86400 // 24小时
});

/**
 * 通用速率限制
 */
export const generalRateLimit = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 60000, // 1分钟
  max: parseInt(process.env.RATE_LIMIT_MAX) || 120, // 每分钟120次请求
  message: {
    error: '请求过于频繁，请稍后再试',
    retryAfter: Math.ceil((parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 60000) / 1000)
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    res.status(429).json({
      error: '请求过于频繁，请稍后再试',
      retryAfter: Math.ceil((parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 60000) / 1000)
    });
  }
});

/**
 * 登录速率限制
 */
export const loginRateLimit = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_LOGIN_WINDOW_MS) || 900000, // 15分钟
  max: parseInt(process.env.RATE_LIMIT_LOGIN_MAX) || 5, // 15分钟内最多5次登录尝试
  message: {
    error: '登录尝试过于频繁，请15分钟后再试',
    retryAfter: Math.ceil((parseInt(process.env.RATE_LIMIT_LOGIN_WINDOW_MS) || 900000) / 1000)
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true, // 成功请求不计入限制
  handler: (req, res) => {
    res.status(429).json({
      error: '登录尝试过于频繁，请15分钟后再试',
      retryAfter: Math.ceil((parseInt(process.env.RATE_LIMIT_LOGIN_WINDOW_MS) || 900000) / 1000)
    });
  }
});

/**
 * 注册速率限制
 */
export const registerRateLimit = rateLimit({
  windowMs: 3600000, // 1小时
  max: 3, // 1小时内最多3次注册
  message: {
    error: '注册过于频繁，请1小时后再试',
    retryAfter: 3600
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    res.status(429).json({
      error: '注册过于频繁，请1小时后再试',
      retryAfter: 3600
    });
  }
});

/**
 * 密码重置速率限制
 */
export const passwordResetRateLimit = rateLimit({
  windowMs: 3600000, // 1小时
  max: 3, // 1小时内最多3次密码重置请求
  message: {
    error: '密码重置请求过于频繁，请1小时后再试',
    retryAfter: 3600
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    res.status(429).json({
      error: '密码重置请求过于频繁，请1小时后再试',
      retryAfter: 3600
    });
  }
});

/**
 * 文件上传速率限制
 */
export const uploadRateLimit = rateLimit({
  windowMs: 300000, // 5分钟
  max: 10, // 5分钟内最多10次上传
  message: {
    error: '文件上传过于频繁，请5分钟后再试',
    retryAfter: 300
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    res.status(429).json({
      error: '文件上传过于频繁，请5分钟后再试',
      retryAfter: 300
    });
  }
});

/**
 * 请求 ID 中间件
 */
export const requestIdMiddleware = (req, res, next) => {
  req.requestId = crypto.randomUUID();
  res.setHeader('X-Request-ID', req.requestId);
  next();
};

/**
 * 安全响应头中间件
 */
export const securityHeadersMiddleware = (req, res, next) => {
  // 生成 nonce 并存储到 locals
  if (!res.locals.nonce) {
    res.locals.nonce = generateNonce();
  }
  
  // 设置安全响应头
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  
  next();
};
