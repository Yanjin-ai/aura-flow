// 简单缓存实现 - 支持幂等与过期
import { generateCacheKey } from './types';

// 内存缓存存储
const memoryCache = new Map();

// 缓存配置
const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24小时过期
const MAX_CACHE_SIZE = 1000; // 最大缓存条目数

/**
 * 从缓存获取数据
 * @param {string} key - 缓存键
 * @returns {Object|null} 缓存的数据或null
 */
export function getFromCache(key) {
  const entry = memoryCache.get(key);
  
  if (!entry) {
    return null;
  }
  
  // 检查是否过期
  if (Date.now() - entry.timestamp > CACHE_TTL_MS) {
    memoryCache.delete(key);
    if (import.meta.env.DEV) console.log(`Cache entry expired and removed: ${key}`);
    return null;
  }
  
if (import.meta.env.DEV) console.log(`Cache hit: ${key}`);
  return entry;
}

/**
 * 将数据存入缓存
 * @param {string} key - 缓存键
 * @param {any} data - 要缓存的数据
 * @param {string} checksum - 数据校验和
 */
export function setToCache(key, data, checksum) {
  // 如果缓存已满，删除最老的条目
  if (memoryCache.size >= MAX_CACHE_SIZE) {
    const firstKey = memoryCache.keys().next().value;
    memoryCache.delete(firstKey);
  if (import.meta.env.DEV) console.log(`Cache full, removed oldest entry: ${firstKey}`);
  }
  
  const entry = {
    key,
    data,
    checksum,
    timestamp: Date.now()
  };
  
  memoryCache.set(key, entry);
if (import.meta.env.DEV) console.log(`Cache stored: ${key}`);
}

/**
 * 删除缓存条目
 * @param {string} key - 缓存键
 */
export function removeFromCache(key) {
  const deleted = memoryCache.delete(key);
  if (deleted) {
  if (import.meta.env.DEV) console.log(`Cache entry removed: ${key}`);
  }
  return deleted;
}

/**
 * 清空所有缓存
 */
export function clearCache() {
  const size = memoryCache.size;
  memoryCache.clear();
if (import.meta.env.DEV) console.log(`Cache cleared, removed ${size} entries`);
}

/**
 * 获取缓存统计信息
 * @returns {Object} 缓存统计
 */
export function getCacheStats() {
  return {
    size: memoryCache.size,
    maxSize: MAX_CACHE_SIZE,
    ttlMs: CACHE_TTL_MS
  };
}

/**
 * 检查特定键是否在缓存中
 * @param {string} key - 缓存键
 * @returns {boolean} 是否存在
 */
export function hasCached(key) {
  return memoryCache.has(key) && getFromCache(key) !== null;
}

/**
 * 批量检查缓存状态
 * @param {string[]} keys - 缓存键数组
 * @returns {Object} 键值对状态映射
 */
export function batchCheckCache(keys) {
  const result = {};
  keys.forEach(key => {
    result[key] = hasCached(key);
  });
  return result;
}

/**
 * 为特定用户生成每日洞察缓存键
 * @param {string} userId - 用户ID
 * @param {string} date - 日期 YYYY-MM-DD
 * @returns {string} 缓存键
 */
export function getDailyCacheKey(userId, date) {
  return generateCacheKey(userId, "daily", date, "insight-daily-v1");
}

/**
 * 为特定用户生成每周洞察缓存键
 * @param {string} userId - 用户ID
 * @param {string} weekStart - 周起始日期 YYYY-MM-DD
 * @returns {string} 缓存键
 */
export function getWeeklyCacheKey(userId, weekStart) {
  return generateCacheKey(userId, "weekly", weekStart, "insight-weekly-v1");
}