/**
 * Playwright 全局设置
 * 在测试运行前执行
 */

import { chromium, FullConfig } from '@playwright/test';

async function globalSetup(config: FullConfig) {
  console.log('🚀 开始 E2E 测试全局设置...');
  
  // 启动浏览器进行健康检查
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  try {
    // 检查前端服务是否可用
    console.log('📡 检查前端服务...');
    await page.goto(config.projects[0].use.baseURL || 'http://localhost:5173');
    await page.waitForLoadState('networkidle');
    console.log('✅ 前端服务正常');
    
    // 检查后端 API 是否可用
    console.log('🔧 检查后端 API...');
    const response = await page.request.get('/api/health');
    if (response.ok()) {
      console.log('✅ 后端 API 正常');
    } else {
      throw new Error(`后端 API 响应异常: ${response.status()}`);
    }
    
    // 检查数据库连接
    console.log('🗄️ 检查数据库连接...');
    const healthResponse = await page.request.get('/api/health');
    const healthData = await healthResponse.json();
    if (healthData.status === 'healthy') {
      console.log('✅ 数据库连接正常');
    } else {
      throw new Error('数据库连接异常');
    }
    
  } catch (error) {
    console.error('❌ 全局设置失败:', error);
    throw error;
  } finally {
    await browser.close();
  }
  
  console.log('🎉 E2E 测试全局设置完成');
}

export default globalSetup;
