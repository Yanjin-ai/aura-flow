// API 测试脚本
const testAPI = async () => {
  const baseURL = 'https://aura-flow-yanjin3.vercel.app';
  
  console.log('开始测试 API...');
  
  // 测试注册 API
  try {
    console.log('\n1. 测试注册 API...');
    const registerResponse = await fetch(`${baseURL}/api/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'test@example.com',
        password: 'testpassword',
        name: '测试用户'
      })
    });
    
    console.log('注册响应状态:', registerResponse.status);
    const registerData = await registerResponse.text();
    console.log('注册响应内容:', registerData);
    
  } catch (error) {
    console.error('注册 API 错误:', error);
  }
  
  // 测试登录 API
  try {
    console.log('\n2. 测试登录 API...');
    const loginResponse = await fetch(`${baseURL}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'test@example.com',
        password: 'testpassword'
      })
    });
    
    console.log('登录响应状态:', loginResponse.status);
    const loginData = await loginResponse.text();
    console.log('登录响应内容:', loginData);
    
  } catch (error) {
    console.error('登录 API 错误:', error);
  }
  
  // 测试用户信息 API
  try {
    console.log('\n3. 测试用户信息 API...');
    const meResponse = await fetch(`${baseURL}/api/auth/me`, {
      method: 'GET',
      headers: {
        'Authorization': 'Bearer test-token'
      }
    });
    
    console.log('用户信息响应状态:', meResponse.status);
    const meData = await meResponse.text();
    console.log('用户信息响应内容:', meData);
    
  } catch (error) {
    console.error('用户信息 API 错误:', error);
  }
};

// 运行测试
testAPI();
