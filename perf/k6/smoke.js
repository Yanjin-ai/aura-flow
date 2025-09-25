/**
 * Aura Flow Smoke 测试
 * 验证基本功能可用性
 */

import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate } from 'k6/metrics';

// 自定义指标
const errorRate = new Rate('errors');

// 测试配置
export const options = {
  stages: [
    { duration: '30s', target: 1 },   // 预热
    { duration: '1m', target: 5 },    // 逐步增加
    { duration: '30s', target: 0 },   // 逐步减少
  ],
  thresholds: {
    http_req_failed: ['rate<0.01'],     // 错误率 < 1%
    http_req_duration: ['p(95)<300'],   // 95% 请求 < 300ms
    errors: ['rate<0.01'],              // 自定义错误率 < 1%
    checks: ['rate>0.99'],              // 检查通过率 > 99%
  },
};

// 配置
const BASE_URL = __ENV.BASE_URL || 'http://localhost:3001';
const TEST_EMAIL = __ENV.TEST_EMAIL || 'test@example.com';
const TEST_PASSWORD = __ENV.TEST_PASSWORD || 'testpassword';

// 全局变量
let authToken = null;

export function setup() {
  console.log('🚀 开始 Smoke 测试...');
  console.log(`目标 URL: ${BASE_URL}`);
  
  // 检查服务健康状态
  const healthResponse = http.get(`${BASE_URL}/health`);
  if (healthResponse.status !== 200) {
    throw new Error(`健康检查失败: ${healthResponse.status}`);
  }
  
  console.log('✅ 服务健康检查通过');
  return { baseUrl: BASE_URL };
}

export default function(data) {
  const baseUrl = data.baseUrl;
  
  // 1. 健康检查
  const healthResponse = http.get(`${baseUrl}/health`);
  const healthCheck = check(healthResponse, {
    '健康检查状态码': (r) => r.status === 200,
    '健康检查响应时间': (r) => r.timings.duration < 100,
  });
  errorRate.add(!healthCheck);
  
  if (!healthCheck) {
    console.error('❌ 健康检查失败');
    return;
  }
  
  // 2. 用户注册
  const registerPayload = JSON.stringify({
    email: `${Date.now()}@example.com`,
    name: 'K6 Test User',
    password: TEST_PASSWORD
  });
  
  const registerResponse = http.post(`${baseUrl}/auth/register`, registerPayload, {
    headers: { 'Content-Type': 'application/json' },
  });
  
  const registerCheck = check(registerResponse, {
    '注册状态码': (r) => r.status === 200 || r.status === 409, // 409 = 用户已存在
    '注册响应时间': (r) => r.timings.duration < 500,
  });
  errorRate.add(!registerCheck);
  
  // 3. 用户登录
  const loginPayload = JSON.stringify({
    email: TEST_EMAIL,
    password: TEST_PASSWORD
  });
  
  const loginResponse = http.post(`${baseUrl}/auth/login`, loginPayload, {
    headers: { 'Content-Type': 'application/json' },
  });
  
  const loginCheck = check(loginResponse, {
    '登录状态码': (r) => r.status === 200,
    '登录响应时间': (r) => r.timings.duration < 500,
    '登录返回令牌': (r) => r.json('access_token') !== undefined,
  });
  errorRate.add(!loginCheck);
  
  if (loginCheck) {
    authToken = loginResponse.json('access_token');
  }
  
  // 4. 获取用户信息
  if (authToken) {
    const meResponse = http.get(`${baseUrl}/auth/me`, {
      headers: { 'Authorization': `Bearer ${authToken}` },
    });
    
    const meCheck = check(meResponse, {
      '用户信息状态码': (r) => r.status === 200,
      '用户信息响应时间': (r) => r.timings.duration < 200,
      '用户信息包含邮箱': (r) => r.json('email') !== undefined,
    });
    errorRate.add(!meCheck);
  }
  
  // 5. 创建任务
  if (authToken) {
    const taskPayload = JSON.stringify({
      title: `K6 Test Task ${Date.now()}`,
      description: 'This is a K6 smoke test task',
      priority: 'MEDIUM'
    });
    
    const createTaskResponse = http.post(`${baseUrl}/tasks`, taskPayload, {
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      },
    });
    
    const createTaskCheck = check(createTaskResponse, {
      '创建任务状态码': (r) => r.status === 200,
      '创建任务响应时间': (r) => r.timings.duration < 300,
      '创建任务返回ID': (r) => r.json('id') !== undefined,
    });
    errorRate.add(!createTaskCheck);
  }
  
  // 6. 获取任务列表
  if (authToken) {
    const tasksResponse = http.get(`${baseUrl}/tasks`, {
      headers: { 'Authorization': `Bearer ${authToken}` },
    });
    
    const tasksCheck = check(tasksResponse, {
      '任务列表状态码': (r) => r.status === 200,
      '任务列表响应时间': (r) => r.timings.duration < 200,
      '任务列表返回数组': (r) => Array.isArray(r.json()),
    });
    errorRate.add(!tasksCheck);
  }
  
  // 7. 生成洞察 (Mock)
  if (authToken) {
    const insightPayload = JSON.stringify({
      type: 'DAILY'
    });
    
    const insightResponse = http.post(`${baseUrl}/insights/generate`, insightPayload, {
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      },
    });
    
    const insightCheck = check(insightResponse, {
      '洞察生成状态码': (r) => r.status === 200,
      '洞察生成响应时间': (r) => r.timings.duration < 1000,
      '洞察生成返回数据': (r) => r.json('insights') !== undefined,
    });
    errorRate.add(!insightCheck);
  }
  
  sleep(1);
}

export function teardown(data) {
  console.log('🏁 Smoke 测试完成');
  console.log(`测试目标: ${data.baseUrl}`);
}
