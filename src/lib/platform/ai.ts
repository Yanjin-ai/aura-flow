/**
 * AI 服务适配层
 * 统一 AI 提供方接口，支持多厂商切换
 */

import { getPlatformConfig } from './config';

export interface AIProvider {
  // 生成洞察
  generateInsights(input: GenerateInsightsInput): Promise<GenerateInsightsOutput>;
  
  // 任务分类
  classifyTask(input: ClassifyTaskInput): Promise<ClassifyTaskOutput>;
  
  // 通用文本生成
  generateText(input: GenerateTextInput): Promise<GenerateTextOutput>;
}

export interface GenerateInsightsInput {
  tasks: Array<{
    title: string;
    description?: string;
    status: string;
    created_at: string;
  }>;
  type: 'daily' | 'weekly';
  user_preferences?: {
    language: string;
    style?: string;
  };
}

export interface GenerateInsightsOutput {
  title: string;
  content: string;
  type: 'daily' | 'weekly';
  metadata?: {
    provider: string;
    model: string;
    tokens_used?: number;
  };
}

export interface ClassifyTaskInput {
  title: string;
  description?: string;
  context?: string;
}

export interface ClassifyTaskOutput {
  category: string;
  priority: 'low' | 'medium' | 'high';
  estimated_duration?: number; // 分钟
  tags: string[];
  confidence: number; // 0-1
}

export interface GenerateTextInput {
  prompt: string;
  max_tokens?: number;
  temperature?: number;
  context?: string;
}

export interface GenerateTextOutput {
  text: string;
  metadata?: {
    provider: string;
    model: string;
    tokens_used?: number;
  };
}

/**
 * 创建 AI 服务实例
 */
export function createAIService(): AIProvider {
  const config = getPlatformConfig();
  
  switch (config.ai_provider) {
    case 'openai':
      return new OpenAIProvider(config);
    case 'qwen':
      return new QwenProvider(config);
    case 'minimax':
      return new MinimaxProvider(config);
    case 'mock':
    default:
      return new MockAIProvider();
  }
}

/**
 * Mock AI 服务（开发环境使用）
 */
class MockAIProvider implements AIProvider {
  async generateInsights(input: GenerateInsightsInput): Promise<GenerateInsightsOutput> {
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const taskCount = input.tasks.length;
    const completedCount = input.tasks.filter(t => t.status === 'completed').length;
    
    return {
      title: `${input.type === 'daily' ? '每日' : '每周'}洞察 - ${new Date().toLocaleDateString()}`,
      content: `基于您的 ${taskCount} 个任务，完成了 ${completedCount} 个。建议保持当前节奏，注意任务优先级管理。`,
      type: input.type,
      metadata: {
        provider: 'mock',
        model: 'mock-model'
      }
    };
  }
  
  async classifyTask(input: ClassifyTaskInput): Promise<ClassifyTaskOutput> {
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // 简单的关键词匹配分类
    const title = input.title.toLowerCase();
    let category = '其他';
    let priority: 'low' | 'medium' | 'high' = 'medium';
    const tags: string[] = [];
    
    if (title.includes('紧急') || title.includes('urgent')) {
      priority = 'high';
      tags.push('紧急');
    }
    
    if (title.includes('会议') || title.includes('meeting')) {
      category = '会议';
      tags.push('会议');
    } else if (title.includes('开发') || title.includes('code')) {
      category = '开发';
      tags.push('开发');
    } else if (title.includes('设计') || title.includes('design')) {
      category = '设计';
      tags.push('设计');
    }
    
    return {
      category,
      priority,
      estimated_duration: 30,
      tags,
      confidence: 0.8
    };
  }
  
  async generateText(input: GenerateTextInput): Promise<GenerateTextOutput> {
    await new Promise(resolve => setTimeout(resolve, 800));
    
    return {
      text: `基于您的输入"${input.prompt}"，这是一个模拟的 AI 回复。在实际环境中，这里会调用真实的 AI 服务。`,
      metadata: {
        provider: 'mock',
        model: 'mock-model'
      }
    };
  }
}

/**
 * OpenAI 提供方
 */
class OpenAIProvider implements AIProvider {
  constructor(private config: any) {}
  
  private async request(prompt: string, options: any = {}): Promise<any> {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.config.ai_api_key}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: this.config.ai_model || 'gpt-3.5-turbo',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: options.max_tokens || 1000,
        temperature: options.temperature || 0.7,
        ...options
      })
    });
    
    if (!response.ok) {
      throw new Error(`OpenAI API 请求失败: ${response.status}`);
    }
    
    return response.json();
  }
  
  async generateInsights(input: GenerateInsightsInput): Promise<GenerateInsightsOutput> {
    const prompt = `基于以下任务数据生成${input.type === 'daily' ? '每日' : '每周'}洞察：

任务列表：
${input.tasks.map(t => `- ${t.title} (${t.status})`).join('\n')}

请生成一个简洁的洞察报告，包括：
1. 任务完成情况分析
2. 效率建议
3. 改进方向

语言：${input.user_preferences?.language || '中文'}`;

    const response = await this.request(prompt);
    const content = response.choices[0].message.content;
    
    return {
      title: `${input.type === 'daily' ? '每日' : '每周'}洞察 - ${new Date().toLocaleDateString()}`,
      content,
      type: input.type,
      metadata: {
        provider: 'openai',
        model: this.config.ai_model,
        tokens_used: response.usage?.total_tokens
      }
    };
  }
  
  async classifyTask(input: ClassifyTaskInput): Promise<ClassifyTaskOutput> {
    const prompt = `请分析以下任务并返回 JSON 格式的分类结果：

任务标题：${input.title}
任务描述：${input.description || '无'}
上下文：${input.context || '无'}

请返回以下格式的 JSON：
{
  "category": "任务分类",
  "priority": "low/medium/high",
  "estimated_duration": 预估分钟数,
  "tags": ["标签1", "标签2"],
  "confidence": 0.0-1.0
}`;

    const response = await this.request(prompt);
    const content = response.choices[0].message.content;
    
    try {
      return JSON.parse(content);
    } catch {
      // 如果解析失败，返回默认值
      return {
        category: '其他',
        priority: 'medium',
        estimated_duration: 30,
        tags: [],
        confidence: 0.5
      };
    }
  }
  
  async generateText(input: GenerateTextInput): Promise<GenerateTextOutput> {
    const response = await this.request(input.prompt, {
      max_tokens: input.max_tokens,
      temperature: input.temperature
    });
    
    return {
      text: response.choices[0].message.content,
      metadata: {
        provider: 'openai',
        model: this.config.ai_model,
        tokens_used: response.usage?.total_tokens
      }
    };
  }
}

/**
 * 通义千问提供方
 */
class QwenProvider implements AIProvider {
  constructor(private config: any) {}
  
  private async request(prompt: string, options: any = {}): Promise<any> {
    const response = await fetch('https://dashscope.aliyuncs.com/api/v1/services/aigc/text-generation/generation', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.config.ai_api_key}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: this.config.ai_model || 'qwen-turbo',
        input: { messages: [{ role: 'user', content: prompt }] },
        parameters: {
          max_tokens: options.max_tokens || 1000,
          temperature: options.temperature || 0.7
        }
      })
    });
    
    if (!response.ok) {
      throw new Error(`通义千问 API 请求失败: ${response.status}`);
    }
    
    return response.json();
  }
  
  async generateInsights(input: GenerateInsightsInput): Promise<GenerateInsightsOutput> {
    const prompt = `基于以下任务数据生成${input.type === 'daily' ? '每日' : '每周'}洞察：

任务列表：
${input.tasks.map(t => `- ${t.title} (${t.status})`).join('\n')}

请生成一个简洁的洞察报告，包括：
1. 任务完成情况分析
2. 效率建议
3. 改进方向

语言：${input.user_preferences?.language || '中文'}`;

    const response = await this.request(prompt);
    const content = response.output.text;
    
    return {
      title: `${input.type === 'daily' ? '每日' : '每周'}洞察 - ${new Date().toLocaleDateString()}`,
      content,
      type: input.type,
      metadata: {
        provider: 'qwen',
        model: this.config.ai_model,
        tokens_used: response.usage?.total_tokens
      }
    };
  }
  
  async classifyTask(input: ClassifyTaskInput): Promise<ClassifyTaskOutput> {
    const prompt = `请分析以下任务并返回 JSON 格式的分类结果：

任务标题：${input.title}
任务描述：${input.description || '无'}
上下文：${input.context || '无'}

请返回以下格式的 JSON：
{
  "category": "任务分类",
  "priority": "low/medium/high",
  "estimated_duration": 预估分钟数,
  "tags": ["标签1", "标签2"],
  "confidence": 0.0-1.0
}`;

    const response = await this.request(prompt);
    const content = response.output.text;
    
    try {
      return JSON.parse(content);
    } catch {
      return {
        category: '其他',
        priority: 'medium',
        estimated_duration: 30,
        tags: [],
        confidence: 0.5
      };
    }
  }
  
  async generateText(input: GenerateTextInput): Promise<GenerateTextOutput> {
    const response = await this.request(input.prompt, {
      max_tokens: input.max_tokens,
      temperature: input.temperature
    });
    
    return {
      text: response.output.text,
      metadata: {
        provider: 'qwen',
        model: this.config.ai_model,
        tokens_used: response.usage?.total_tokens
      }
    };
  }
}

/**
 * Minimax 提供方
 */
class MinimaxProvider implements AIProvider {
  constructor(private config: any) {}
  
  private async request(prompt: string, options: any = {}): Promise<any> {
    const response = await fetch('https://api.minimax.chat/v1/text/chatcompletion', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.config.ai_api_key}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: this.config.ai_model || 'abab5.5-chat',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: options.max_tokens || 1000,
        temperature: options.temperature || 0.7
      })
    });
    
    if (!response.ok) {
      throw new Error(`Minimax API 请求失败: ${response.status}`);
    }
    
    return response.json();
  }
  
  async generateInsights(input: GenerateInsightsInput): Promise<GenerateInsightsOutput> {
    const prompt = `基于以下任务数据生成${input.type === 'daily' ? '每日' : '每周'}洞察：

任务列表：
${input.tasks.map(t => `- ${t.title} (${t.status})`).join('\n')}

请生成一个简洁的洞察报告，包括：
1. 任务完成情况分析
2. 效率建议
3. 改进方向

语言：${input.user_preferences?.language || '中文'}`;

    const response = await this.request(prompt);
    const content = response.choices[0].message.content;
    
    return {
      title: `${input.type === 'daily' ? '每日' : '每周'}洞察 - ${new Date().toLocaleDateString()}`,
      content,
      type: input.type,
      metadata: {
        provider: 'minimax',
        model: this.config.ai_model,
        tokens_used: response.usage?.total_tokens
      }
    };
  }
  
  async classifyTask(input: ClassifyTaskInput): Promise<ClassifyTaskOutput> {
    const prompt = `请分析以下任务并返回 JSON 格式的分类结果：

任务标题：${input.title}
任务描述：${input.description || '无'}
上下文：${input.context || '无'}

请返回以下格式的 JSON：
{
  "category": "任务分类",
  "priority": "low/medium/high",
  "estimated_duration": 预估分钟数,
  "tags": ["标签1", "标签2"],
  "confidence": 0.0-1.0
}`;

    const response = await this.request(prompt);
    const content = response.choices[0].message.content;
    
    try {
      return JSON.parse(content);
    } catch {
      return {
        category: '其他',
        priority: 'medium',
        estimated_duration: 30,
        tags: [],
        confidence: 0.5
      };
    }
  }
  
  async generateText(input: GenerateTextInput): Promise<GenerateTextOutput> {
    const response = await this.request(input.prompt, {
      max_tokens: input.max_tokens,
      temperature: input.temperature
    });
    
    return {
      text: response.choices[0].message.content,
      metadata: {
        provider: 'minimax',
        model: this.config.ai_model,
        tokens_used: response.usage?.total_tokens
      }
    };
  }
}

// 导出默认实例
export const aiService = createAIService();
