
// AI 模块通用类型定义和工具函数

// 预定义的任务类别
export const TASK_CATEGORIES = [
  { id: 'work', name: '工作', keywords: ['工作', '会议', '报告', '项目', '邮件', '客户'] },
  { id: 'study', name: '学习', keywords: ['学习', '阅读', '课程', '练习', '研究', '考试'] },
  { id: 'life', name: '生活', keywords: ['购物', '家务', '缴费', '维修', '清洁', '整理'] },
  { id: 'health', name: '健康', keywords: ['运动', '跑步', '健身', '医院', '体检', '锻炼'] },
  { id: 'entertainment', name: '娱乐', keywords: ['电影', '游戏', '聚会', '旅行', '音乐', '休闲'] },
  { id: 'other', name: '其他', keywords: [] }
];

// 类型检查工具函数
export function isValidCategory(category) {
  return TASK_CATEGORIES.some(cat => cat.id === category || cat.name === category);
}

export function isValidConfidence(confidence) {
  return typeof confidence === 'number' && confidence >= 0 && confidence <= 1;
}

export function isValidInsightType(type) {
  return type === 'daily' || type === 'weekly';
}

// 数据验证函数
export function validateClassifyResult(result) {
  if (!result || typeof result !== 'object') return false;
  if (!result.category || !isValidCategory(result.category)) return false;
  if (result.confidence !== undefined && !isValidConfidence(result.confidence)) return false;
  if (!['mock', 'live'].includes(result.source)) return false;
  if (!result.prompt_version || typeof result.prompt_version !== 'string') return false;
  return true;
}

export function validateInsightResult(result) {
  if (!result || typeof result !== 'object') return false;
  if (!result.content || typeof result.content !== 'string') return false;
  if (!result.summary || typeof result.summary !== 'string') return false;
  if (!Array.isArray(result.highlights) || !Array.isArray(result.recommendations)) return false;
  if (result.confidence !== undefined && !isValidConfidence(result.confidence)) return false;
  return true;
}

// 字符数验证
export function validateCharCount(text, min, max) {
  if (!text || typeof text !== 'string') return false;
  const count = text.length;
  return count >= min && count <= max;
}

// Checksum 生成 - 修复中文字符编码问题
export function generateChecksum(data) {
  try {
    const jsonString = JSON.stringify(data);
    // 使用简单的哈希算法代替 btoa, 避免中文字符编码问题
    let hash = 0;
    if (jsonString.length === 0) return hash.toString(16);
    
    for (let i = 0; i < jsonString.length; i++) {
      const char = jsonString.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // 转为32位整数
    }
    
    // 返回16位十六进制字符串
    return Math.abs(hash).toString(16).slice(0, 16).padStart(16, '0');
  } catch (error) {
    console.warn("Checksum generation failed:", error);
    // 回退到时间戳
    return Date.now().toString(16).slice(-16);
  }
}

// 缓存键生成
export function generateCacheKey(userId, type, date, promptVersion, locale = 'zh-CN') {
  return `${userId}:${type}:${date}:${promptVersion}:${locale}`;
}
