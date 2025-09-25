/**
 * 冒烟测试用例
 * 验证核心功能是否正常工作
 */

import { test, expect } from '@playwright/test';

test.describe('Aura Flow 冒烟测试', () => {
  
  test('应用启动和基本导航', async ({ page }) => {
    // 访问首页
    await page.goto('/');
    
    // 应该重定向到 debug 页面
    await expect(page).toHaveURL(/.*\/debug/);
    
    // 检查页面标题
    await expect(page).toHaveTitle(/Aura Flow/);
    
    // 检查关键元素是否存在
    await expect(page.locator('h1')).toContainText('Aura Flow');
  });

  test('调试页面功能', async ({ page }) => {
    await page.goto('/debug');
    
    // 检查系统状态显示
    await expect(page.locator('[data-testid="system-status"]')).toBeVisible();
    
    // 检查 API 健康状态
    await expect(page.locator('[data-testid="api-health"]')).toBeVisible();
    
    // 检查快速导航链接
    await expect(page.locator('a[href="/Home"]')).toBeVisible();
    await expect(page.locator('a[href="/Insights"]')).toBeVisible();
  });

  test('用户认证流程', async ({ page }) => {
    // 访问需要认证的页面
    await page.goto('/Home');
    
    // 应该重定向到登录页面或显示登录表单
    // 这里假设有登录表单
    const loginForm = page.locator('form[data-testid="login-form"]');
    if (await loginForm.isVisible()) {
      // 填写登录表单
      await page.fill('input[name="email"]', 'demo@auraflow.com');
      await page.fill('input[name="password"]', 'password123');
      
      // 提交登录表单
      await page.click('button[type="submit"]');
      
      // 等待登录成功
      await page.waitForURL(/.*\/Home/);
      
      // 检查是否成功登录
      await expect(page.locator('[data-testid="user-menu"]')).toBeVisible();
    }
  });

  test('任务管理功能', async ({ page }) => {
    // 假设已经登录，访问任务页面
    await page.goto('/Home');
    
    // 检查任务列表是否存在
    await expect(page.locator('[data-testid="task-list"]')).toBeVisible();
    
    // 尝试创建新任务
    const taskInput = page.locator('input[data-testid="task-input"]');
    if (await taskInput.isVisible()) {
      await taskInput.fill('测试任务');
      await page.press('input[data-testid="task-input"]', 'Enter');
      
      // 检查任务是否创建成功
      await expect(page.locator('[data-testid="task-item"]')).toContainText('测试任务');
    }
  });

  test('AI 洞察功能', async ({ page }) => {
    await page.goto('/Insights');
    
    // 检查洞察页面是否加载
    await expect(page.locator('h1')).toContainText('洞察');
    
    // 检查洞察生成按钮
    const generateButton = page.locator('button[data-testid="generate-insights"]');
    if (await generateButton.isVisible()) {
      await generateButton.click();
      
      // 等待洞察生成
      await page.waitForSelector('[data-testid="insight-item"]', { timeout: 10000 });
      
      // 检查洞察是否生成
      await expect(page.locator('[data-testid="insight-item"]')).toBeVisible();
    }
  });

  test('设置页面功能', async ({ page }) => {
    await page.goto('/Settings');
    
    // 检查设置页面是否加载
    await expect(page.locator('h1')).toContainText('设置');
    
    // 检查设置表单
    await expect(page.locator('form[data-testid="settings-form"]')).toBeVisible();
  });

  test('数据管理功能（管理员）', async ({ page }) => {
    // 访问管理页面
    await page.goto('/admin');
    
    // 检查是否需要管理员权限
    const adminPanel = page.locator('[data-testid="admin-panel"]');
    if (await adminPanel.isVisible()) {
      // 检查管理功能
      await expect(page.locator('[data-testid="data-stats"]')).toBeVisible();
      await expect(page.locator('button[data-testid="export-data"]')).toBeVisible();
    } else {
      // 如果没有管理员权限，应该显示权限不足
      await expect(page.locator('text=权限不足')).toBeVisible();
    }
  });

  test('响应式设计', async ({ page }) => {
    // 测试移动端视图
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');
    
    // 检查移动端布局
    await expect(page.locator('nav[data-testid="mobile-nav"]')).toBeVisible();
    
    // 测试平板端视图
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto('/');
    
    // 检查平板端布局
    await expect(page.locator('nav[data-testid="tablet-nav"]')).toBeVisible();
  });

  test('错误处理', async ({ page }) => {
    // 访问不存在的页面
    await page.goto('/non-existent-page');
    
    // 应该显示 404 页面
    await expect(page.locator('text=404')).toBeVisible();
  });

  test('API 健康检查', async ({ page }) => {
    // 直接测试 API 端点
    const response = await page.request.get('/api/health');
    expect(response.ok()).toBeTruthy();
    
    const data = await response.json();
    expect(data.status).toBe('healthy');
  });

  test('性能检查', async ({ page }) => {
    // 记录性能指标
    const startTime = Date.now();
    
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    const loadTime = Date.now() - startTime;
    
    // 页面加载时间应该在合理范围内
    expect(loadTime).toBeLessThan(5000); // 5秒内加载完成
    
    // 检查关键资源是否加载
    const resources = await page.evaluate(() => {
      return performance.getEntriesByType('resource').length;
    });
    
    expect(resources).toBeGreaterThan(0);
  });
});
