
// AI 服务层 - 对外暴露的主要接口
import { classifyTask as providerClassifyTask, generateDailyInsight as providerGenerateDaily, generateWeeklyInsight as providerGenerateWeekly } from './provider';
import { getFromCache, setToCache } from './cache';
import { generateCacheKey } from './types';
import { InvokeLLM } from '@/api/integrations';

/**
 * 任务分类服务
 * @param {Object} params - 分类参数
 * @param {string} params.text - 任务文本
 * @param {string} params.locale - 语言环境
 * @returns {Promise<Object>} 分类结果
 */
export async function classifyTask({ text, locale = "zh-CN" }) {
  try {
    const response = await providerClassifyTask({ text, locale });
    
    return {
      category: response.json.category,
      confidence: response.json.confidence,
      secondary: response.json.secondary,
      source: response.json.source,
      prompt_version: response.prompt_version,
      ai_updated_at: Date.now()
    };
  } catch (error) {
    console.error("Classification service error:", error);
    // 返回默认分类
    return {
      category: "其他",
      confidence: 0.5,
      secondary: null,
      source: "mock",
      prompt_version: "task-classify-v1",
      ai_updated_at: Date.now()
    };
  }
}

/**
 * 从URL提取任务详情服务
 * @param {string} url - 要提取的URL
 * @returns {Promise<Object>} 提取结果
 */
export async function extractTaskFromUrl(url) {
  try {
    console.log("Extracting task details from URL:", url);
    
    const prompt = `请分析以下链接的内容，并提取出可作为待办任务的信息。请关注页面的标题、主要内容、关键行动项、日期信息等。

链接: ${url}

请以JSON格式返回提取的任务信息，包括建议的任务标题、描述、类别等。`;

    const response = await InvokeLLM({
      prompt: prompt,
      add_context_from_internet: true,
      response_json_schema: {
        type: "object",
        properties: {
          title: {
            type: "string",
            description: "建议的任务标题"
          },
          description: {
            type: "string", 
            description: "任务的详细描述"
          },
          category: {
            type: "string",
            enum: ["工作", "学习", "生活", "健康", "娱乐", "其他"],
            description: "建议的任务类别"
          },
          urgency: {
            type: "string",
            enum: ["高", "中", "低"],
            description: "任务紧急程度"
          },
          extractedInfo: {
            type: "object",
            properties: {
              pageTitle: { type: "string" },
              domain: { type: "string" },
              summary: { type: "string" }
            }
          },
          confidence: {
            type: "number",
            minimum: 0,
            maximum: 1,
            description: "提取准确度"
          }
        },
        required: ["title", "category", "confidence"]
      }
    });

    return {
      success: true,
      data: response,
      originalUrl: url
    };
    
  } catch (error) {
    console.error("URL extraction failed:", error);
    
    // 降级处理：至少提取域名作为任务标题
    try {
      const domain = new URL(url).hostname;
      return {
        success: true,
        data: {
          title: `查看 ${domain}`,
          description: `访问链接: ${url}`,
          category: "其他",
          urgency: "中",
          confidence: 0.3,
          extractedInfo: {
            domain: domain,
            pageTitle: "未能获取",
            summary: "链接内容提取失败，请手动编辑任务详情"
          }
        },
        originalUrl: url,
        fallback: true
      };
    } catch (urlError) {
      return {
        success: false,
        error: "无效的URL格式",
        originalUrl: url
      };
    }
  }
}

/**
 * 每日洞察生成服务
 * @param {Object} payload - 每日数据负载
 * @returns {Promise<Object>} 洞察结果
 */
export async function generateDailyInsight(payload) {
  try {
    const locale = payload.locale || 'zh-CN';
    // 生成缓存键
    const cacheKey = generateCacheKey(payload.userId, "daily", payload.date, "insight-daily-v1", locale);
    
    // 尝试从缓存获取
    const cached = getFromCache(cacheKey);
    if (cached && cached.checksum === payload.checksum) {
      console.log("Daily insight cache hit");
      return cached.data;
    }
    
    // 生成新的洞察
    const response = await providerGenerateDaily(payload);
    
    const result = {
      json: response.json,
      prompt_version: response.prompt_version,
      source: response.mode,
      checksum: response.checksum,
      created_at: Date.now()
    };
    
    // 存入缓存
    setToCache(cacheKey, result, response.checksum);
    
    return result;
  } catch (error) {
    console.error("Daily insight service error:", error);
    // 返回占位内容
    return {
      json: {
        content: "今日复盘生成失败，请稍后重试。你可以手动记录今天的收获和明天的计划。",
        summary: "生成失败",
        highlights: ["请手动记录"],
        recommendations: ["稍后重试"],
        confidence: 0.0
      },
      prompt_version: "insight-daily-v1",
      source: "mock",
      checksum: "fallback",
      created_at: Date.now()
    };
  }
}

/**
 * 每周总结生成服务
 * @param {Object} payload - 每周数据负载
 * @returns {Promise<Object>} 洞察结果
 */
export async function generateWeeklyInsight(payload) {
  try {
    const locale = payload.locale || 'zh-CN';
    // 生成缓存键
    const cacheKey = generateCacheKey(payload.userId, "weekly", payload.weekStart, "insight-weekly-v1", locale);
    
    // 尝试从缓存获取
    const cached = getFromCache(cacheKey);
    if (cached && cached.checksum === payload.checksum) {
      console.log("Weekly insight cache hit");
      return cached.data;
    }
    
    // 生成新的洞察
    const response = await providerGenerateWeekly(payload);
    
    const result = {
      json: response.json,
      prompt_version: response.prompt_version,
      source: response.mode,
      checksum: response.checksum,
      created_at: Date.now()
    };
    
    // 存入缓存
    setToCache(cacheKey, result, response.checksum);
    
    return result;
  } catch (error) {
    console.error("Weekly insight service error:", error);
    // 返回占位内容
    return {
      json: {
        content: "本周总结生成失败，请稍后重试。你可以手动回顾本周的任务完成情况和下周的规划。",
        summary: "生成失败",
        highlights: ["请手动回顾"],
        recommendations: ["稍后重试"],
        confidence: 0.0
      },
      prompt_version: "insight-weekly-v1",
      source: "mock",
      checksum: "fallback",
      created_at: Date.now()
    };
  }
}
