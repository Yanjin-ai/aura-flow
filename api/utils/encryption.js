// 数据加密工具
import crypto from 'crypto'

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || crypto.randomBytes(32).toString('hex')
const ALGORITHM = 'aes-256-gcm'

/**
 * 加密敏感数据
 */
export function encrypt(text) {
  if (!text) return text;
  
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipher(ALGORITHM, ENCRYPTION_KEY);
  cipher.setAAD(Buffer.from('aura-flow', 'utf8'));
  
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  const authTag = cipher.getAuthTag();
  
  return {
    encrypted,
    iv: iv.toString('hex'),
    authTag: authTag.toString('hex')
  };
}

/**
 * 解密敏感数据
 */
export function decrypt(encryptedData) {
  if (!encryptedData || typeof encryptedData === 'string') return encryptedData;
  
  const { encrypted, iv, authTag } = encryptedData;
  
  const decipher = crypto.createDecipher(ALGORITHM, ENCRYPTION_KEY);
  decipher.setAAD(Buffer.from('aura-flow', 'utf8'));
  decipher.setAuthTag(Buffer.from(authTag, 'hex'));
  
  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  
  return decrypted;
}

/**
 * 生成安全的随机字符串
 */
export function generateSecureRandom(length = 32) {
  return crypto.randomBytes(length).toString('hex');
}

/**
 * 生成安全的哈希
 */
export function generateHash(data, salt = null) {
  const actualSalt = salt || crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(data, actualSalt, 10000, 64, 'sha512');
  return {
    hash: hash.toString('hex'),
    salt: actualSalt
  };
}

/**
 * 验证哈希
 */
export function verifyHash(data, hash, salt) {
  const newHash = crypto.pbkdf2Sync(data, salt, 10000, 64, 'sha512');
  return newHash.toString('hex') === hash;
}

/**
 * 生成 API 密钥
 */
export function generateApiKey() {
  const prefix = 'ak_';
  const randomPart = crypto.randomBytes(24).toString('hex');
  return prefix + randomPart;
}

/**
 * 验证 API 密钥格式
 */
export function validateApiKey(apiKey) {
  const apiKeyRegex = /^ak_[a-f0-9]{48}$/;
  return apiKeyRegex.test(apiKey);
}
