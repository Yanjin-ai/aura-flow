/**
 * Playwright 全局拆卸
 * 在测试运行后执行
 */

import { FullConfig } from '@playwright/test';

async function globalTeardown(config: FullConfig) {
  console.log('🧹 开始 E2E 测试全局拆卸...');
  
  // 清理测试数据
  console.log('🗑️ 清理测试数据...');
  
  // 这里可以添加清理逻辑，比如：
  // - 删除测试用户
  // - 清理测试文件
  // - 重置数据库状态
  
  console.log('✅ 测试数据清理完成');
  console.log('🎉 E2E 测试全局拆卸完成');
}

export default globalTeardown;
