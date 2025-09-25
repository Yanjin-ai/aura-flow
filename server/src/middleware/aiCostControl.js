/**
 * AI 成本控制中间件
 * 实现限速、并发、熔断、重试和成本预算控制
 */

import { PrismaClient } from '@prisma/client';
import { logger } from './logger.js';
import pLimit from 'p-limit';
import { RateLimiter } from 'limiter';

const prisma = new PrismaClient();

// 配置参数
const AI_TIMEOUT_MS = parseInt(process.env.AI_TIMEOUT_MS || '30000', 10);
const AI_MAX_RETRIES = parseInt(process.env.AI_MAX_RETRIES || '2', 10);
const AI_RPS_LIMIT = parseInt(process.env.AI_RPS_LIMIT || '3', 10);
const AI_CONCURRENCY = parseInt(process.env.AI_CONCURRENCY || '4', 10);
const AI_DAILY_BUDGET_USD = parseFloat(process.env.AI_DAILY_BUDGET_USD || '3.0');
const AI_MONTHLY_BUDGET_USD = parseFloat(process.env.AI_MONTHLY_BUDGET_USD || '30.0');
const AI_CIRCUIT_FAILS = parseInt(process.env.AI_CIRCUIT_FAILS || '5', 10);
const AI_CIRCUIT_COOLDOWN_S = parseInt(process.env.AI_CIRCUIT_COOLDOWN_S || '120', 10);

// 限流器
const rateLimiter = new RateLimiter(AI_RPS_LIMIT, 'second');
const concurrencyLimiter = pLimit(AI_CONCURRENCY);

// 熔断器状态
const circuitBreaker = {
  state: 'CLOSED', // CLOSED, OPEN, HALF_OPEN
  failures: 0,
  lastFailureTime: null,
  successCount: 0
};

// 成本统计
let dailyCost = 0;
let monthlyCost = 0;

// 模拟 AI 服务（降级时使用）
const mockAIService = {
  generateInsights: async (prompt) => {
    logger.info('AI 服务降级: Mock generateInsights', { prompt });
    return { 
      insights: `Mock Insight for: ${prompt}`,
      degraded: true,
      reason: 'cost_limit_exceeded'
    };
  },
  classifyTask: async (task) => {
    logger.info('AI 服务降级: Mock classifyTask', { task });
    return { 
      classification: 'MOCK_CLASSIFICATION',
      degraded: true,
      reason: 'cost_limit_exceeded'
    };
  }
};

// 记录 AI 使用情况
async function recordAIUsage(data) {
  try {
    await prisma.aiUsage.create({
      data: {
        user_id: data.userId || null,
        route: data.route,
        provider: data.provider,
        model: data.model,
        tokens_in: data.tokensIn,
        tokens_out: data.tokensOut,
        cost_usd: data.costUsd,
        status: data.status,
        error_msg: data.errorMsg
      }
    });
  } catch (error) {
    logger.error('记录 AI 使用情况失败', { error: error.message, data });
  }
}

// 检查成本预算
async function checkCostBudget(estimatedCost) {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  // 获取今日成本
  const dailyUsage = await prisma.aiUsage.aggregate({
    where: {
      created_at: { gte: today },
      status: 'success'
    },
    _sum: { cost_usd: true }
  });

  // 获取本月成本
  const monthlyUsage = await prisma.aiUsage.aggregate({
    where: {
      created_at: { gte: monthStart },
      status: 'success'
    },
    _sum: { cost_usd: true }
  });

  const currentDailyCost = dailyUsage._sum.cost_usd || 0;
  const currentMonthlyCost = monthlyUsage._sum.cost_usd || 0;

  // 检查预算
  if (currentDailyCost + estimatedCost > AI_DAILY_BUDGET_USD) {
    logger.warn('AI 日预算超限', { 
      currentDailyCost, 
      estimatedCost, 
      dailyBudget: AI_DAILY_BUDGET_USD 
    });
    return { allowed: false, reason: 'daily_budget_exceeded' };
  }

  if (currentMonthlyCost + estimatedCost > AI_MONTHLY_BUDGET_USD) {
    logger.warn('AI 月预算超限', { 
      currentMonthlyCost, 
      estimatedCost, 
      monthlyBudget: AI_MONTHLY_BUDGET_USD 
    });
    return { allowed: false, reason: 'monthly_budget_exceeded' };
  }

  return { allowed: true };
}

// 熔断器逻辑
function checkCircuitBreaker() {
  const now = Date.now();
  
  switch (circuitBreaker.state) {
    case 'CLOSED':
      if (circuitBreaker.failures >= AI_CIRCUIT_FAILS) {
        circuitBreaker.state = 'OPEN';
        circuitBreaker.lastFailureTime = now;
        logger.warn('熔断器开启', { failures: circuitBreaker.failures });
        return false;
      }
      return true;
      
    case 'OPEN':
      if (now - circuitBreaker.lastFailureTime > AI_CIRCUIT_COOLDOWN_S * 1000) {
        circuitBreaker.state = 'HALF_OPEN';
        circuitBreaker.successCount = 0;
        logger.info('熔断器进入半开状态');
        return true;
      }
      return false;
      
    case 'HALF_OPEN':
      return true;
      
    default:
      return false;
  }
}

// 更新熔断器状态
function updateCircuitBreaker(success) {
  if (success) {
    circuitBreaker.failures = 0;
    if (circuitBreaker.state === 'HALF_OPEN') {
      circuitBreaker.successCount++;
      if (circuitBreaker.successCount >= 3) {
        circuitBreaker.state = 'CLOSED';
        logger.info('熔断器关闭');
      }
    }
  } else {
    circuitBreaker.failures++;
    if (circuitBreaker.state === 'HALF_OPEN') {
      circuitBreaker.state = 'OPEN';
      circuitBreaker.lastFailureTime = Date.now();
      logger.warn('熔断器重新开启');
    }
  }
}

// 指数退避重试
async function retryWithBackoff(fn, maxRetries = AI_MAX_RETRIES) {
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      if (attempt === maxRetries) {
        throw error;
      }
      
      // 只对特定错误重试
      if (!['NETWORK_ERROR', 'TIMEOUT', 'RATE_LIMIT', 'SERVER_ERROR'].includes(error.type)) {
        throw error;
      }
      
      const delay = Math.min(1000 * Math.pow(2, attempt), 10000);
      logger.info(`AI 请求重试 ${attempt + 1}/${maxRetries}`, { delay, error: error.message });
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
}

// AI 成本控制中间件
export const aiCostControl = (req, res, next) => {
  req.aiService = {
    // 生成洞察
    generateInsights: async (prompt, userId = null) => {
      return concurrencyLimiter(async () => {
        // 检查限流
        if (!rateLimiter.tryRemoveTokens(1)) {
          logger.warn('AI 请求被限流');
          await recordAIUsage({
            userId,
            route: '/insights/generate',
            provider: 'rate_limited',
            status: 'failed',
            errorMsg: 'rate_limit_exceeded'
          });
          return mockAIService.generateInsights(prompt);
        }

        // 检查熔断器
        if (!checkCircuitBreaker()) {
          logger.warn('AI 请求被熔断器阻止');
          await recordAIUsage({
            userId,
            route: '/insights/generate',
            provider: 'circuit_breaker',
            status: 'degraded',
            errorMsg: 'circuit_breaker_open'
          });
          return mockAIService.generateInsights(prompt);
        }

        // 检查成本预算
        const estimatedCost = 0.01; // 估算成本
        const budgetCheck = await checkCostBudget(estimatedCost);
        if (!budgetCheck.allowed) {
          logger.warn('AI 请求因预算限制被拒绝', { reason: budgetCheck.reason });
          await recordAIUsage({
            userId,
            route: '/insights/generate',
            provider: 'budget_limit',
            status: 'degraded',
            errorMsg: budgetCheck.reason
          });
          return mockAIService.generateInsights(prompt);
        }

        // 执行 AI 请求
        try {
          const result = await retryWithBackoff(async () => {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), AI_TIMEOUT_MS);
            
            try {
              // 这里应该调用真实的 AI 服务
              // const response = await openai.chat.completions.create({...});
              // 暂时使用模拟响应
              const response = {
                choices: [{ message: { content: `AI Insight: ${prompt}` } }],
                usage: { prompt_tokens: 100, completion_tokens: 50 }
              };
              
              clearTimeout(timeoutId);
              return response;
            } catch (error) {
              clearTimeout(timeoutId);
              throw error;
            }
          });

          // 计算成本
          const tokensIn = result.usage.prompt_tokens;
          const tokensOut = result.usage.completion_tokens;
          const costUsd = (tokensIn * 0.001 + tokensOut * 0.002) / 1000; // 简化计算

          // 记录成功使用
          await recordAIUsage({
            userId,
            route: '/insights/generate',
            provider: 'openai',
            model: 'gpt-3.5-turbo',
            tokensIn,
            tokensOut,
            costUsd,
            status: 'success'
          });

          updateCircuitBreaker(true);
          
          return {
            insights: result.choices[0].message.content,
            tokensIn,
            tokensOut,
            costUsd
          };

        } catch (error) {
          logger.error('AI 请求失败', { error: error.message });
          
          // 记录失败使用
          await recordAIUsage({
            userId,
            route: '/insights/generate',
            provider: 'openai',
            status: 'failed',
            errorMsg: error.message
          });

          updateCircuitBreaker(false);
          
          // 降级到 Mock
          return mockAIService.generateInsights(prompt);
        }
      });
    },

    // 分类任务
    classifyTask: async (task, userId = null) => {
      return concurrencyLimiter(async () => {
        // 类似的逻辑，但针对任务分类
        if (!rateLimiter.tryRemoveTokens(1)) {
          await recordAIUsage({
            userId,
            route: '/tasks/classify',
            provider: 'rate_limited',
            status: 'failed',
            errorMsg: 'rate_limit_exceeded'
          });
          return mockAIService.classifyTask(task);
        }

        if (!checkCircuitBreaker()) {
          await recordAIUsage({
            userId,
            route: '/tasks/classify',
            provider: 'circuit_breaker',
            status: 'degraded',
            errorMsg: 'circuit_breaker_open'
          });
          return mockAIService.classifyTask(task);
        }

        const estimatedCost = 0.005;
        const budgetCheck = await checkCostBudget(estimatedCost);
        if (!budgetCheck.allowed) {
          await recordAIUsage({
            userId,
            route: '/tasks/classify',
            provider: 'budget_limit',
            status: 'degraded',
            errorMsg: budgetCheck.reason
          });
          return mockAIService.classifyTask(task);
        }

        try {
          const result = await retryWithBackoff(async () => {
            // 模拟任务分类
            return {
              classification: 'WORK',
              confidence: 0.85,
              usage: { prompt_tokens: 50, completion_tokens: 10 }
            };
          });

          const tokensIn = result.usage.prompt_tokens;
          const tokensOut = result.usage.completion_tokens;
          const costUsd = (tokensIn * 0.001 + tokensOut * 0.002) / 1000;

          await recordAIUsage({
            userId,
            route: '/tasks/classify',
            provider: 'openai',
            model: 'gpt-3.5-turbo',
            tokensIn,
            tokensOut,
            costUsd,
            status: 'success'
          });

          updateCircuitBreaker(true);
          
          return {
            classification: result.classification,
            confidence: result.confidence,
            tokensIn,
            tokensOut,
            costUsd
          };

        } catch (error) {
          await recordAIUsage({
            userId,
            route: '/tasks/classify',
            provider: 'openai',
            status: 'failed',
            errorMsg: error.message
          });

          updateCircuitBreaker(false);
          return mockAIService.classifyTask(task);
        }
      });
    }
  };
  
  next();
};

// 导出当前成本统计
export const getCurrentAICost = () => ({ dailyCost, monthlyCost });
export const getCircuitBreakerStatus = () => circuitBreaker;