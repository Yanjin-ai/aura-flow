// 任务分类 Prompt 配置 - task-classify-v1

export const CLASSIFY_PROMPT_VERSION = "task-classify-v1";

// JSON Schema for classification result
export const CLASSIFY_RESULT_SCHEMA = {
  type: "object",
  properties: {
    category: {
      type: "string",
      enum: ["工作", "学习", "生活", "健康", "娱乐", "其他"],
      description: "任务的主要分类"
    },
    confidence: {
      type: "number",
      minimum: 0,
      maximum: 1,
      description: "分类的置信度，0-1之间"
    },
    secondary: {
      type: ["string", "null"],
      enum: ["工作", "学习", "生活", "健康", "娱乐", "其他", null],
      description: "可选的次要分类"
    },
    source: {
      type: "string",
      enum: ["mock", "live"],
      description: "分类来源"
    },
    prompt_version: {
      type: "string",
      description: "使用的Prompt版本"
    }
  },
  required: ["category", "confidence", "source", "prompt_version"],
  additionalProperties: false
};

// 分类系统提示词
export const CLASSIFY_SYSTEM_PROMPT = `你是一个智能任务分类助手。请根据用户输入的任务内容，将其分类到以下六个类别之一：

工作：与职业、工作相关的任务，如会议、报告、项目、邮件等
学习：与学习、教育相关的任务，如阅读、课程、练习、研究等  
生活：日常生活相关的任务，如购物、家务、缴费、维修等
健康：与健康、锻炼相关的任务，如运动、医院、体检等
娱乐：休闲娱乐相关的任务，如电影、游戏、聚会、旅行等
其他：无法明确归类到以上类别的任务

请返回严格的JSON格式，包含category（主分类）、confidence（置信度0-1）、secondary（可选次要分类）、source和prompt_version字段。`;

// 用户输入模板
export function buildClassifyUserPrompt(text, locale = "zh-CN") {
  return `请对以下任务进行分类：

任务内容："${text}"

请返回JSON格式的分类结果。`;
}

// 验证分类结果格式
export function validateClassifyResponse(response) {
  try {
    const data = typeof response === 'string' ? JSON.parse(response) : response;
    
    // 基本结构检查
    if (!data || typeof data !== 'object') return false;
    if (!data.category || !CLASSIFY_RESULT_SCHEMA.properties.category.enum.includes(data.category)) return false;
    if (typeof data.confidence !== 'number' || data.confidence < 0 || data.confidence > 1) return false;
    if (!['mock', 'live'].includes(data.source)) return false;
    if (!data.prompt_version || data.prompt_version !== CLASSIFY_PROMPT_VERSION) return false;
    
    // 次要分类检查（可选）
    if (data.secondary !== undefined && data.secondary !== null) {
      if (!CLASSIFY_RESULT_SCHEMA.properties.secondary.enum.includes(data.secondary)) return false;
    }
    
    return true;
  } catch (error) {
    console.error("Classify response validation error:", error);
    return false;
  }
}