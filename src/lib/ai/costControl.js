/**
 * AI 成本控制服务
 * 提供成本上限、降级逻辑和用量监控
 */

import { logger } from '../platform/telemetry.js';

class AICostControlService {
  constructor() {
    this.dailyCostLimit = parseFloat(import.meta.env.VITE_AI_DAILY_COST_LIMIT) || 10.0; // 默认每日10美元
    this.monthlyCostLimit = parseFloat(import.meta.env.VITE_AI_MONTHLY_COST_LIMIT) || 100.0; // 默认每月100美元
    this.costTracking = new Map(); // 存储成本跟踪数据
    this.fallbackEnabled = import.meta.env.VITE_AI_FALLBACK_ENABLED === 'true';
    this.providerPriority = (import.meta.env.VITE_AI_PROVIDER_PRIORITY || 'openai,qwen,minimax').split(',');
    
    // 成本估算（每1000 tokens的价格，单位：美元）
    this.costEstimates = {
      openai: {
        'gpt-3.5-turbo': { input: 0.0015, output: 0.002 },
        'gpt-4': { input: 0.03, output: 0.06 },
        'gpt-4-turbo': { input: 0.01, output: 0.03 }
      },
      qwen: {
        'qwen-turbo': { input: 0.0008, output: 0.0012 },
        'qwen-plus': { input: 0.002, output: 0.006 },
        'qwen-max': { input: 0.008, output: 0.02 }
      },
      minimax: {
        'abab5.5-chat': { input: 0.001, output: 0.002 },
        'abab5.5-s': { input: 0.0005, output: 0.001 }
      }
    };
    
    this.initializeCostTracking();
  }

  /**
   * 初始化成本跟踪
   */
  initializeCostTracking() {
    const today = new Date().toISOString().split('T')[0];
    const month = new Date().toISOString().substring(0, 7);
    
    if (!this.costTracking.has('daily')) {
      this.costTracking.set('daily', { date: today, cost: 0 });
    }
    
    if (!this.costTracking.has('monthly')) {
      this.costTracking.set('monthly', { month, cost: 0 });
    }
    
    // 检查是否需要重置每日成本
    if (this.costTracking.get('daily').date !== today) {
      this.costTracking.set('daily', { date: today, cost: 0 });
    }
    
    // 检查是否需要重置每月成本
    if (this.costTracking.get('monthly').month !== month) {
      this.costTracking.set('monthly', { month, cost: 0 });
    }
  }

  /**
   * 估算请求成本
   */
  estimateCost(provider, model, inputTokens, outputTokens = 0) {
    const providerCosts = this.costEstimates[provider];
    if (!providerCosts || !providerCosts[model]) {
      // 使用默认成本估算
      return (inputTokens + outputTokens) * 0.002 / 1000; // 默认每1000 tokens 0.002美元
    }
    
    const modelCosts = providerCosts[model];
    const inputCost = (inputTokens / 1000) * modelCosts.input;
    const outputCost = (outputTokens / 1000) * modelCosts.output;
    
    return inputCost + outputCost;
  }

  /**
   * 检查是否超过成本限制
   */
  checkCostLimit(estimatedCost) {
    const dailyCost = this.costTracking.get('daily').cost;
    const monthlyCost = this.costTracking.get('monthly').cost;
    
    const wouldExceedDaily = dailyCost + estimatedCost > this.dailyCostLimit;
    const wouldExceedMonthly = monthlyCost + estimatedCost > this.monthlyCostLimit;
    
    return {
      canProceed: !wouldExceedDaily && !wouldExceedMonthly,
      wouldExceedDaily,
      wouldExceedMonthly,
      dailyCost,
      monthlyCost,
      dailyRemaining: this.dailyCostLimit - dailyCost,
      monthlyRemaining: this.monthlyCostLimit - monthlyCost
    };
  }

  /**
   * 记录实际成本
   */
  recordCost(actualCost) {
    const today = new Date().toISOString().split('T')[0];
    const month = new Date().toISOString().substring(0, 7);
    
    // 更新每日成本
    const dailyData = this.costTracking.get('daily');
    if (dailyData.date === today) {
      dailyData.cost += actualCost;
    } else {
      this.costTracking.set('daily', { date: today, cost: actualCost });
    }
    
    // 更新每月成本
    const monthlyData = this.costTracking.get('monthly');
    if (monthlyData.month === month) {
      monthlyData.cost += actualCost;
    } else {
      this.costTracking.set('monthly', { month, cost: actualCost });
    }
    
    // 记录到本地存储
    this.saveCostTracking();
    
    logger.info('AI 成本记录', {
      actualCost,
      dailyCost: this.costTracking.get('daily').cost,
      monthlyCost: this.costTracking.get('monthly').cost
    });
  }

  /**
   * 获取降级策略
   */
  getFallbackStrategy(currentProvider, currentModel) {
    if (!this.fallbackEnabled) {
      return null;
    }
    
    const currentIndex = this.providerPriority.indexOf(currentProvider);
    if (currentIndex === -1 || currentIndex === this.providerPriority.length - 1) {
      return null; // 已经是最后一个提供商
    }
    
    // 返回下一个提供商和对应的模型
    const nextProvider = this.providerPriority[currentIndex + 1];
    const fallbackModels = {
      openai: 'gpt-3.5-turbo',
      qwen: 'qwen-turbo',
      minimax: 'abab5.5-chat'
    };
    
    return {
      provider: nextProvider,
      model: fallbackModels[nextProvider] || 'default',
      reason: 'cost_limit_exceeded'
    };
  }

  /**
   * 处理成本限制超出
   */
  handleCostLimitExceeded(estimatedCost, currentProvider, currentModel) {
    const fallback = this.getFallbackStrategy(currentProvider, currentModel);
    
    if (fallback) {
      logger.warn('AI 成本限制超出，尝试降级', {
        currentProvider,
        currentModel,
        fallbackProvider: fallback.provider,
        fallbackModel: fallback.model,
        estimatedCost
      });
      
      return {
        action: 'fallback',
        fallback,
        message: `成本限制超出，已切换到 ${fallback.provider}`
      };
    } else {
      logger.error('AI 成本限制超出，无可用降级选项', {
        currentProvider,
        currentModel,
        estimatedCost,
        dailyCost: this.costTracking.get('daily').cost,
        monthlyCost: this.costTracking.get('monthly').cost
      });
      
      return {
        action: 'reject',
        message: 'AI 服务暂时不可用，请稍后再试'
      };
    }
  }

  /**
   * 验证请求并返回处理结果
   */
  validateRequest(provider, model, inputTokens, outputTokens = 0) {
    this.initializeCostTracking();
    
    const estimatedCost = this.estimateCost(provider, model, inputTokens, outputTokens);
    const costCheck = this.checkCostLimit(estimatedCost);
    
    if (!costCheck.canProceed) {
      return this.handleCostLimitExceeded(estimatedCost, provider, model);
    }
    
    return {
      action: 'proceed',
      estimatedCost,
      costInfo: costCheck
    };
  }

  /**
   * 获取成本统计
   */
  getCostStats() {
    this.initializeCostTracking();
    
    const dailyData = this.costTracking.get('daily');
    const monthlyData = this.costTracking.get('monthly');
    
    return {
      daily: {
        cost: dailyData.cost,
        limit: this.dailyCostLimit,
        remaining: this.dailyCostLimit - dailyData.cost,
        percentage: (dailyData.cost / this.dailyCostLimit) * 100
      },
      monthly: {
        cost: monthlyData.cost,
        limit: this.monthlyCostLimit,
        remaining: this.monthlyCostLimit - monthlyData.cost,
        percentage: (monthlyData.cost / this.monthlyCostLimit) * 100
      },
      limits: {
        daily: this.dailyCostLimit,
        monthly: this.monthlyCostLimit
      }
    };
  }

  /**
   * 重置成本跟踪
   */
  resetCostTracking() {
    this.costTracking.clear();
    this.initializeCostTracking();
    this.saveCostTracking();
    
    logger.info('AI 成本跟踪已重置');
  }

  /**
   * 保存成本跟踪数据到本地存储
   */
  saveCostTracking() {
    try {
      const data = {
        daily: this.costTracking.get('daily'),
        monthly: this.costTracking.get('monthly'),
        timestamp: new Date().toISOString()
      };
      localStorage.setItem('ai_cost_tracking', JSON.stringify(data));
    } catch (error) {
      logger.error('保存成本跟踪数据失败', { error: error.message });
    }
  }

  /**
   * 从本地存储加载成本跟踪数据
   */
  loadCostTracking() {
    try {
      const data = localStorage.getItem('ai_cost_tracking');
      if (data) {
        const parsed = JSON.parse(data);
        this.costTracking.set('daily', parsed.daily);
        this.costTracking.set('monthly', parsed.monthly);
      }
    } catch (error) {
      logger.error('加载成本跟踪数据失败', { error: error.message });
    }
  }

  /**
   * 更新成本限制
   */
  updateCostLimits(dailyLimit, monthlyLimit) {
    this.dailyCostLimit = dailyLimit;
    this.monthlyCostLimit = monthlyLimit;
    
    logger.info('AI 成本限制已更新', {
      dailyLimit,
      monthlyLimit
    });
  }

  /**
   * 获取提供商优先级
   */
  getProviderPriority() {
    return [...this.providerPriority];
  }

  /**
   * 更新提供商优先级
   */
  updateProviderPriority(priority) {
    this.providerPriority = priority;
    
    logger.info('AI 提供商优先级已更新', { priority });
  }
}

// 创建单例实例
const costControlService = new AICostControlService();

// 加载历史数据
costControlService.loadCostTracking();

export default costControlService;
