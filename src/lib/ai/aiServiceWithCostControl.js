/**
 * 带成本控制的 AI 服务包装器
 * 集成成本控制逻辑到 AI 服务中
 */

import { createAIService } from '../platform/ai.js';
import costControlService from './costControl.js';
import { logger } from '../platform/telemetry.js';

class AIServiceWithCostControl {
  constructor() {
    this.baseService = createAIService();
    this.currentProvider = this.getCurrentProvider();
    this.currentModel = this.getCurrentModel();
  }

  /**
   * 获取当前提供商
   */
  getCurrentProvider() {
    const config = JSON.parse(import.meta.env.VITE_AI_PROVIDER || 'mock');
    return config;
  }

  /**
   * 获取当前模型
   */
  getCurrentModel() {
    const provider = this.getCurrentProvider();
    const modelMap = {
      openai: 'gpt-3.5-turbo',
      qwen: 'qwen-turbo',
      minimax: 'abab5.5-chat',
      mock: 'mock-model'
    };
    return modelMap[provider] || 'default';
  }

  /**
   * 估算输入 tokens
   */
  estimateTokens(text) {
    // 简单的 token 估算：中文字符按 1.5 个 token 计算，英文按 0.75 个 token 计算
    const chineseChars = (text.match(/[\u4e00-\u9fff]/g) || []).length;
    const englishChars = text.length - chineseChars;
    return Math.ceil(chineseChars * 1.5 + englishChars * 0.75);
  }

  /**
   * 处理成本控制逻辑
   */
  async handleCostControl(provider, model, inputTokens, outputTokens = 0) {
    const validation = costControlService.validateRequest(provider, model, inputTokens, outputTokens);
    
    if (validation.action === 'reject') {
      throw new Error(validation.message);
    }
    
    if (validation.action === 'fallback') {
      logger.warn('AI 服务降级', {
        from: { provider, model },
        to: validation.fallback
      });
      
      // 更新当前提供商和模型
      this.currentProvider = validation.fallback.provider;
      this.currentModel = validation.fallback.model;
      
      // 重新创建服务实例
      this.baseService = createAIService();
    }
    
    return validation;
  }

  /**
   * 记录实际成本
   */
  recordActualCost(provider, model, inputTokens, outputTokens) {
    const actualCost = costControlService.estimateCost(provider, model, inputTokens, outputTokens);
    costControlService.recordCost(actualCost);
    
    return actualCost;
  }

  /**
   * 生成洞察（带成本控制）
   */
  async generateInsights(input) {
    try {
      // 估算输入 tokens
      const tasksText = input.tasks.map(t => `${t.title} ${t.description || ''}`).join(' ');
      const inputTokens = this.estimateTokens(tasksText);
      const estimatedOutputTokens = 500; // 预估输出 tokens
      
      // 成本控制检查
      await this.handleCostControl(this.currentProvider, this.currentModel, inputTokens, estimatedOutputTokens);
      
      // 调用基础服务
      const result = await this.baseService.generateInsights(input);
      
      // 记录实际成本
      const actualOutputTokens = this.estimateTokens(result.content);
      const actualCost = this.recordActualCost(this.currentProvider, this.currentModel, inputTokens, actualOutputTokens);
      
      // 添加成本信息到元数据
      result.metadata = {
        ...result.metadata,
        cost: actualCost,
        input_tokens: inputTokens,
        output_tokens: actualOutputTokens,
        provider: this.currentProvider,
        model: this.currentModel
      };
      
      logger.info('AI 洞察生成完成', {
        provider: this.currentProvider,
        model: this.currentModel,
        cost: actualCost,
        tokens: { input: inputTokens, output: actualOutputTokens }
      });
      
      return result;
    } catch (error) {
      logger.error('AI 洞察生成失败', {
        error: error.message,
        provider: this.currentProvider,
        model: this.currentModel
      });
      throw error;
    }
  }

  /**
   * 任务分类（带成本控制）
   */
  async classifyTask(input) {
    try {
      // 估算输入 tokens
      const inputText = `${input.title} ${input.description || ''} ${input.context || ''}`;
      const inputTokens = this.estimateTokens(inputText);
      const estimatedOutputTokens = 100; // 预估输出 tokens
      
      // 成本控制检查
      await this.handleCostControl(this.currentProvider, this.currentModel, inputTokens, estimatedOutputTokens);
      
      // 调用基础服务
      const result = await this.baseService.classifyTask(input);
      
      // 记录实际成本
      const resultText = JSON.stringify(result);
      const actualOutputTokens = this.estimateTokens(resultText);
      const actualCost = this.recordActualCost(this.currentProvider, this.currentModel, inputTokens, actualOutputTokens);
      
      logger.info('AI 任务分类完成', {
        provider: this.currentProvider,
        model: this.currentModel,
        cost: actualCost,
        tokens: { input: inputTokens, output: actualOutputTokens }
      });
      
      return result;
    } catch (error) {
      logger.error('AI 任务分类失败', {
        error: error.message,
        provider: this.currentProvider,
        model: this.currentModel
      });
      throw error;
    }
  }

  /**
   * 文本生成（带成本控制）
   */
  async generateText(input) {
    try {
      // 估算输入 tokens
      const inputTokens = this.estimateTokens(input.prompt);
      const estimatedOutputTokens = input.max_tokens || 500;
      
      // 成本控制检查
      await this.handleCostControl(this.currentProvider, this.currentModel, inputTokens, estimatedOutputTokens);
      
      // 调用基础服务
      const result = await this.baseService.generateText(input);
      
      // 记录实际成本
      const actualOutputTokens = this.estimateTokens(result.text);
      const actualCost = this.recordActualCost(this.currentProvider, this.currentModel, inputTokens, actualOutputTokens);
      
      // 添加成本信息到元数据
      result.metadata = {
        ...result.metadata,
        cost: actualCost,
        input_tokens: inputTokens,
        output_tokens: actualOutputTokens,
        provider: this.currentProvider,
        model: this.currentModel
      };
      
      logger.info('AI 文本生成完成', {
        provider: this.currentProvider,
        model: this.currentModel,
        cost: actualCost,
        tokens: { input: inputTokens, output: actualOutputTokens }
      });
      
      return result;
    } catch (error) {
      logger.error('AI 文本生成失败', {
        error: error.message,
        provider: this.currentProvider,
        model: this.currentModel
      });
      throw error;
    }
  }

  /**
   * 获取成本统计
   */
  getCostStats() {
    return costControlService.getCostStats();
  }

  /**
   * 获取当前提供商信息
   */
  getCurrentProviderInfo() {
    return {
      provider: this.currentProvider,
      model: this.currentModel
    };
  }

  /**
   * 重置成本跟踪
   */
  resetCostTracking() {
    costControlService.resetCostTracking();
  }

  /**
   * 更新成本限制
   */
  updateCostLimits(dailyLimit, monthlyLimit) {
    costControlService.updateCostLimits(dailyLimit, monthlyLimit);
  }
}

// 创建单例实例
const aiServiceWithCostControl = new AIServiceWithCostControl();

export default aiServiceWithCostControl;
