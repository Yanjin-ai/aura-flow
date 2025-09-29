// 验证脚本 - 检查所有功能是否正常
import fetch from 'node-fetch';

const BASE_URL = 'http://localhost:5173';

async function testAPI(endpoint, method = 'GET', body = null) {
  try {
    const options = {
      method,
      headers: {
        'Content-Type': 'application/json',
      },
    };
    
    if (body) {
      options.body = JSON.stringify(body);
    }
    
    const response = await fetch(`${BASE_URL}${endpoint}`, options);
    const data = await response.json();
    
    return {
      success: response.ok,
      status: response.status,
      data
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}

async function runVerification() {
  console.log('🔍 开始验证 Aura Flow 功能...\n');
  
  // 1. 测试健康检查
  console.log('1. 测试健康检查 API...');
  const health = await testAPI('/api/health');
  console.log(`   状态: ${health.success ? '✅ 正常' : '❌ 失败'}`);
  if (health.data) {
    console.log(`   数据库: ${health.data.services?.database?.status || '未知'}`);
  }
  
  // 2. 测试用户注册
  console.log('\n2. 测试用户注册...');
  const testUser = {
    email: `test-${Date.now()}@example.com`,
    password: 'Test123!@#',
    name: '测试用户'
  };
  
  const register = await testAPI('/api/auth/register', 'POST', testUser);
  console.log(`   状态: ${register.success ? '✅ 成功' : '❌ 失败'}`);
  if (register.data?.token) {
    console.log(`   Token: ${register.data.token.substring(0, 20)}...`);
  }
  
  // 3. 测试用户登录
  console.log('\n3. 测试用户登录...');
  const login = await testAPI('/api/auth/login', 'POST', {
    email: testUser.email,
    password: testUser.password
  });
  console.log(`   状态: ${login.success ? '✅ 成功' : '❌ 失败'}`);
  
  // 4. 测试获取用户信息
  if (login.data?.token) {
    console.log('\n4. 测试获取用户信息...');
    const userInfo = await testAPI('/api/auth/me', 'GET', null, login.data.token);
    console.log(`   状态: ${userInfo.success ? '✅ 成功' : '❌ 失败'}`);
    if (userInfo.data?.user) {
      console.log(`   用户: ${userInfo.data.user.name} (${userInfo.data.user.email})`);
    }
  }
  
  // 5. 测试任务创建
  if (login.data?.token) {
    console.log('\n5. 测试任务创建...');
    const task = await testAPI('/api/tasks', 'POST', {
      title: '测试任务',
      content: '这是一个测试任务',
      date: new Date().toISOString().split('T')[0]
    }, login.data.token);
    console.log(`   状态: ${task.success ? '✅ 成功' : '❌ 失败'}`);
  }
  
  // 6. 测试安全检查
  console.log('\n6. 测试安全检查...');
  const security = await testAPI('/api/security/check');
  console.log(`   状态: ${security.success ? '✅ 成功' : '❌ 失败'}`);
  if (security.data?.overallStatus) {
    console.log(`   安全状态: ${security.data.overallStatus}`);
  }
  
  console.log('\n🎉 验证完成！');
}

// 运行验证
runVerification().catch(console.error);
