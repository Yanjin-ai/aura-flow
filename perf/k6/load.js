/**
 * Aura Flow 负载测试
 * 测试系统在高负载下的性能表现
 */

import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend } from 'k6/metrics';

// 自定义指标
const errorRate = new Rate('errors');
const taskCreationTime = new Trend('task_creation_time');
const insightGenerationTime = new Trend('insight_generation_time');

// 测试配置
export const options = {
  stages: [
    { duration: '2m', target: 10 },   // 预热阶段
    { duration: '5m', target: 50 },   // 负载阶段
    { duration: '2m', target: 100 },  // 压力阶段
    { duration: '5m', target: 100 },  // 稳定阶段
    { duration: '2m', target: 50 },   // 逐步减少
    { duration: '1m', target: 0 },    // 结束
  ],
  thresholds: {
    http_req_failed: ['rate<0.01'],     // 错误率 < 1%
    http_req_duration: ['p(95)<300'],   // 95% 请求 < 300ms
    http_req_duration: ['p(99)<1000'],  // 99% 请求 < 1000ms
    errors: ['rate<0.01'],              // 自定义错误率 < 1%
    checks: ['rate>0.99'],              // 检查通过率 > 99%
    task_creation_time: ['p(95)<300'],  // 任务创建 95% < 300ms
    insight_generation_time: ['p(95)<2000'], // 洞察生成 95% < 2000ms
  },
};

// 配置
const BASE_URL = __ENV.BASE_URL || 'http://localhost:3001';
const TEST_EMAIL = __ENV.TEST_EMAIL || 'loadtest@example.com';
const TEST_PASSWORD = __ENV.TEST_PASSWORD || 'loadtestpassword';

// 全局变量
let authToken = null;
let userId = null;

export function setup() {
  console.log('🚀 开始负载测试...');
  console.log(`目标 URL: ${BASE_URL}`);
  
  // 检查服务健康状态
  const healthResponse = http.get(`${BASE_URL}/health`);
  if (healthResponse.status !== 200) {
    throw new Error(`健康检查失败: ${healthResponse.status}`);
  }
  
  // 创建测试用户
  const registerPayload = JSON.stringify({
    email: TEST_EMAIL,
    name: 'Load Test User',
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
  
  if (scenario < 0.3) {
    // 30% - 用户信息查询
    testUserInfo(baseUrl, authToken);
  } else if (scenario < 0.6) {
    // 30% - 任务管理
    testTaskManagement(baseUrl, authToken);
  } else if (scenario < 0.8) {
    // 20% - 洞察生成
    testInsightGeneration(baseUrl, authToken);
  } else {
    // 20% - 混合操作
    testMixedOperations(baseUrl, authToken);
  }
  
  sleep(Math.random() * 2 + 0.5); // 0.5-2.5秒随机间隔
}

function testUserInfo(baseUrl, authToken) {
  const meResponse = http.get(`${baseUrl}/auth/me`, {
    headers: { 'Authorization': `Bearer ${authToken}` },
  });
  
  const meCheck = check(meResponse, {
    '用户信息状态码': (r) => r.status === 200,
    '用户信息响应时间': (r) => r.timings.duration < 200,
  });
  errorRate.add(!meCheck);
}

function testTaskManagement(baseUrl, authToken) {
  // 创建任务
  const taskPayload = JSON.stringify({
    title: `Load Test Task ${Date.now()}-${Math.random()}`,
    description: 'This is a load test task',
    priority: ['LOW', 'MEDIUM', 'HIGH'][Math.floor(Math.random() * 3)]
  });
  
  const createStart = Date.now();
  const createTaskResponse = http.post(`${baseUrl}/tasks`, taskPayload, {
    headers: { 
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${authToken}`
    },
  });
  const createEnd = Date.now();
  
  const createTaskCheck = check(createTaskResponse, {
    '创建任务状态码': (r) => r.status === 200,
    '创建任务响应时间': (r) => r.timings.duration < 300,
  });
  errorRate.add(!createTaskCheck);
  taskCreationTime.add(createEnd - createStart);
  
  if (createTaskCheck) {
    const taskId = createTaskResponse.json('id');
    
    // 获取任务列表
    const tasksResponse = http.get(`${baseUrl}/tasks`, {
      headers: { 'Authorization': `Bearer ${authToken}` },
    });
    
    const tasksCheck = check(tasksResponse, {
      '任务列表状态码': (r) => r.status === 200,
      '任务列表响应时间': (r) => r.timings.duration < 200,
    });
    errorRate.add(!tasksCheck);
    
    // 更新任务
    if (taskId && Math.random() < 0.5) {
      const updatePayload = JSON.stringify({
        title: `Updated Load Test Task ${Date.now()}`,
        status: 'COMPLETED'
      });
      
      const updateTaskResponse = http.put(`${baseUrl}/tasks/${taskId}`, updatePayload, {
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
      });
      
      const updateTaskCheck = check(updateTaskResponse, {
        '更新任务状态码': (r) => r.status === 200,
        '更新任务响应时间': (r) => r.timings.duration < 300,
      });
      errorRate.add(!updateTaskCheck);
    }
  }
}

function testInsightGeneration(baseUrl, authToken) {
  const insightTypes = ['DAILY', 'WEEKLY', 'CUSTOM'];
  const insightType = insightTypes[Math.floor(Math.random() * insightTypes.length)];
  
  const insightPayload = JSON.stringify({
    type: insightType
  });
  
  const insightStart = Date.now();
  const insightResponse = http.post(`${baseUrl}/insights/generate`, insightPayload, {
    headers: { 
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${authToken}`
    },
  });
  const insightEnd = Date.now();
  
  const insightCheck = check(insightResponse, {
    '洞察生成状态码': (r) => r.status === 200,
    '洞察生成响应时间': (r) => r.timings.duration < 2000,
  });
  errorRate.add(!insightCheck);
  insightGenerationTime.add(insightEnd - insightStart);
}

function testMixedOperations(baseUrl, authToken) {
  // 随机执行多个操作
  const operations = [
    () => testUserInfo(baseUrl, authToken),
    () => testTaskManagement(baseUrl, authToken),
    () => testInsightGeneration(baseUrl, authToken)
  ];
  
  // 随机选择1-3个操作
  const numOperations = Math.floor(Math.random() * 3) + 1;
  const selectedOperations = operations.sort(() => 0.5 - Math.random()).slice(0, numOperations);
  
  selectedOperations.forEach(operation => {
    try {
      operation();
    } catch (error) {
      console.error('操作执行失败:', error);
      errorRate.add(1);
    }
  });
}

export function teardown(data) {
  console.log('🏁 负载测试完成');
  console.log(`测试目标: ${data.baseUrl}`);
  console.log(`测试用户: ${data.userId}`);
}
