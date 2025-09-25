/**
 * AI 预算压测脚本
 * 模拟高频调用触发限速/熔断/降级
 */

import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend, Counter } from 'k6/metrics';

// 自定义指标
const errorRate = new Rate('errors');
const degradedRate = new Rate('degraded');
const aiLatency = new Trend('ai_latency');
const aiCostTotal = new Counter('ai_cost_total');
const rateLimitHits = new Counter('rate_limit_hits');
const circuitBreakerHits = new Counter('circuit_breaker_hits');
const budgetLimitHits = new Counter('budget_limit_hits');

// 测试配置
export const options = {
  stages: [
    { duration: '30s', target: 1 },   // 预热
    { duration: '2m', target: 10 },   // 逐步增加
    { duration: '3m', target: 50 },   // 高负载
    { duration: '2m', target: 100 },  // 压力测试
    { duration: '1m', target: 0 },    // 逐步减少
  ],
  thresholds: {
    http_req_failed: ['rate<0.01'],     // 错误率 < 1%
    http_req_duration: ['p(95)<300'],   // 95% 请求 < 300ms
    checks: ['rate>0.99'],              // 检查通过率 > 99%
    errors: ['rate<0.1'],               // 自定义错误率 < 10%
    degraded: ['rate<0.3'],             // 降级率 < 30%
    ai_latency: ['p(95)<3000'],         // AI 延迟 95% < 3s
  },
};

// 配置
const BASE_URL = __ENV.BASE_URL || 'http://localhost:3001';
const TEST_EMAIL = __ENV.TEST_EMAIL || 'budgettest@example.com';
const TEST_PASSWORD = __ENV.TEST_PASSWORD || 'budgettestpassword';

// 全局变量
let authToken = null;
let userId = null;

export function setup() {
  console.log('🚀 开始 AI 预算压测...');
  console.log(`目标 URL: ${BASE_URL}`);
  
  // 检查服务健康状态
  const healthResponse = http.get(`${BASE_URL}/health`);
  if (healthResponse.status !== 200) {
    throw new Error(`健康检查失败: ${healthResponse.status}`);
  }
  
  // 创建测试用户
  const registerPayload = JSON.stringify({
    email: TEST_EMAIL,
    name: 'Budget Test User',
    password: TEST_PASSWORD
  });
  
  const registerResponse = http.post(`${BASE_URL}/auth/register`, registerPayload, {
    headers: { 'Content-Type': 'application/json' },
  });
  
  if (registerResponse.status !== 200 && registerResponse.status !== 409) {
    throw new Error(`用户注册失败: ${registerResponse.status}`);
  }
  
  // 登录获取令牌
  const loginPayload = JSON.stringify({
    email: TEST_EMAIL,
    password: TEST_PASSWORD
  });
  
  const loginResponse = http.post(`${BASE_URL}/auth/login`, loginPayload, {
    headers: { 'Content-Type': 'application/json' },
  });
  
  if (loginResponse.status !== 200) {
    throw new Error(`用户登录失败: ${loginResponse.status}`);
  }
  
  const token = loginResponse.json('access_token');
  const userInfo = loginResponse.json('user');
  
  console.log('✅ 测试用户准备完成');
  return { 
    baseUrl: BASE_URL, 
    authToken: token, 
    userId: userInfo.id 
  };
}

export default function(data) {
  const { baseUrl, authToken, userId } = data;
  
  // 随机选择测试场景
  const scenario = Math.random();
  
  if (scenario < 0.7) {
    // 70% - AI 洞察生成（高频调用）
    testInsightGeneration(baseUrl, authToken, userId);
  } else if (scenario < 0.9) {
    // 20% - 任务分类
    testTaskClassification(baseUrl, authToken, userId);
  } else {
    // 10% - 获取 AI 指标
    testAIMetrics(baseUrl, authToken);
  }
  
  // 短间隔以触发限流
  sleep(Math.random() * 0.5 + 0.1); // 0.1-0.6秒
}

function testInsightGeneration(baseUrl, authToken, userId) {
  const startTime = Date.now();
  
  const insightPayload = JSON.stringify({
    type: 'DAILY',
    prompt: `Generate insights for user ${userId} at ${new Date().toISOString()}`
  });
  
  const response = http.post(`${baseUrl}/insights/generate`, insightPayload, {
    headers: { 
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${authToken}`
    },
  });
  
  const endTime = Date.now();
  const latency = endTime - startTime;
  
  const checks = check(response, {
    '洞察生成状态码': (r) => r.status === 200,
    '洞察生成响应时间': (r) => r.timings.duration < 10000,
  });
  
  errorRate.add(!checks);
  aiLatency.add(latency);
  
  // 检查响应内容
  if (response.status === 200) {
    const responseData = response.json();
    
    // 检查是否降级
    if (responseData.degraded) {
      degradedRate.add(1);
      console.log(`AI 请求降级: ${responseData.reason}`);
      
      // 记录降级原因
      if (responseData.reason === 'rate_limit_exceeded') {
        rateLimitHits.add(1);
      } else if (responseData.reason === 'circuit_breaker_open') {
        circuitBreakerHits.add(1);
      } else if (responseData.reason === 'daily_budget_exceeded' || 
                 responseData.reason === 'monthly_budget_exceeded') {
        budgetLimitHits.add(1);
      }
    } else {
      degradedRate.add(0);
      
      // 记录成本
      if (responseData.costUsd) {
        aiCostTotal.add(responseData.costUsd);
      }
    }
  } else {
    errorRate.add(1);
    console.log(`AI 请求失败: ${response.status} - ${response.body}`);
  }
}

function testTaskClassification(baseUrl, authToken, userId) {
  const startTime = Date.now();
  
  const taskPayload = JSON.stringify({
    title: `Test task ${Date.now()}`,
    description: `This is a test task for classification at ${new Date().toISOString()}`
  });
  
  const response = http.post(`${baseUrl}/tasks/classify`, taskPayload, {
    headers: { 
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${authToken}`
    },
  });
  
  const endTime = Date.now();
  const latency = endTime - startTime;
  
  const checks = check(response, {
    '任务分类状态码': (r) => r.status === 200,
    '任务分类响应时间': (r) => r.timings.duration < 5000,
  });
  
  errorRate.add(!checks);
  aiLatency.add(latency);
  
  if (response.status === 200) {
    const responseData = response.json();
    
    if (responseData.degraded) {
      degradedRate.add(1);
      console.log(`任务分类降级: ${responseData.reason}`);
    } else {
      degradedRate.add(0);
      
      if (responseData.costUsd) {
        aiCostTotal.add(responseData.costUsd);
      }
    }
  } else {
    errorRate.add(1);
  }
}

function testAIMetrics(baseUrl, authToken) {
  const response = http.get(`${baseUrl}/metrics/ai/stats`, {
    headers: { 'Authorization': `Bearer ${authToken}` },
  });
  
  const checks = check(response, {
    'AI 指标状态码': (r) => r.status === 200,
    'AI 指标响应时间': (r) => r.timings.duration < 1000,
  });
  
  errorRate.add(!checks);
  
  if (response.status === 200) {
    const stats = response.json();
    console.log(`AI 统计: 总请求=${stats.summary.totalRequests}, 成功率=${stats.summary.successRate}%, 总成本=$${stats.summary.totalCost}`);
  }
}

export function teardown(data) {
  console.log('🏁 AI 预算压测完成');
  console.log(`测试目标: ${data.baseUrl}`);
  console.log(`测试用户: ${data.userId}`);
  
  // 输出最终统计
  console.log('\n📊 压测结果摘要:');
  console.log(`- 错误率: ${errorRate.count > 0 ? (errorRate.count / (errorRate.count + errorRate.passes) * 100).toFixed(2) : 0}%`);
  console.log(`- 降级率: ${degradedRate.count > 0 ? (degradedRate.count / (degradedRate.count + degradedRate.passes) * 100).toFixed(2) : 0}%`);
  console.log(`- 限流命中: ${rateLimitHits.count}`);
  console.log(`- 熔断命中: ${circuitBreakerHits.count}`);
  console.log(`- 预算限制命中: ${budgetLimitHits.count}`);
  console.log(`- 总 AI 成本: $${aiCostTotal.count.toFixed(4)}`);
}
