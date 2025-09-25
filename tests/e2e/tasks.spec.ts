/**
 * 任务管理 E2E 测试
 * 测试任务的创建、编辑、删除、完成等操作
 */

import { test, expect } from '@playwright/test';

test.describe('任务管理', () => {
  test.beforeEach(async ({ page }) => {
    // 登录用户
    await page.goto('/');
    await page.click('text=登录');
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForSelector('text=欢迎回来');
  });

  test('创建新任务', async ({ page }) => {
    // 导航到任务页面
    await page.click('text=任务');
    
    // 点击新建任务按钮
    await page.click('text=新建任务');
    
    // 填写任务信息
    await page.fill('input[name="title"]', '测试任务');
    await page.fill('textarea[name="description"]', '这是一个测试任务的描述');
    await page.selectOption('select[name="priority"]', 'HIGH');
    
    // 提交任务
    await page.click('button[type="submit"]');
    
    // 验证任务创建成功
    await expect(page.locator('text=测试任务')).toBeVisible();
    await expect(page.locator('text=任务创建成功')).toBeVisible();
  });

  test('编辑任务', async ({ page }) => {
    // 导航到任务页面
    await page.click('text=任务');
    
    // 等待任务列表加载
    await page.waitForSelector('[data-testid="task-item"]');
    
    // 点击编辑按钮
    await page.click('[data-testid="task-item"] button[aria-label="编辑"]');
    
    // 修改任务标题
    await page.fill('input[name="title"]', '修改后的任务标题');
    
    // 保存修改
    await page.click('button[type="submit"]');
    
    // 验证修改成功
    await expect(page.locator('text=修改后的任务标题')).toBeVisible();
    await expect(page.locator('text=任务更新成功')).toBeVisible();
  });

  test('完成任务', async ({ page }) => {
    // 导航到任务页面
    await page.click('text=任务');
    
    // 等待任务列表加载
    await page.waitForSelector('[data-testid="task-item"]');
    
    // 点击完成按钮
    await page.click('[data-testid="task-item"] button[aria-label="完成"]');
    
    // 验证任务状态更新
    await expect(page.locator('[data-testid="task-item"] .status-completed')).toBeVisible();
  });

  test('删除任务', async ({ page }) => {
    // 导航到任务页面
    await page.click('text=任务');
    
    // 等待任务列表加载
    await page.waitForSelector('[data-testid="task-item"]');
    
    // 点击删除按钮
    await page.click('[data-testid="task-item"] button[aria-label="删除"]');
    
    // 确认删除
    await page.click('text=确认删除');
    
    // 验证任务已删除
    await expect(page.locator('[data-testid="task-item"]')).not.toBeVisible();
    await expect(page.locator('text=任务删除成功')).toBeVisible();
  });

  test('任务搜索和过滤', async ({ page }) => {
    // 导航到任务页面
    await page.click('text=任务');
    
    // 使用搜索功能
    await page.fill('input[placeholder="搜索任务..."]', '测试');
    
    // 验证搜索结果
    await expect(page.locator('[data-testid="task-item"]')).toContainText('测试');
    
    // 使用优先级过滤
    await page.selectOption('select[name="priority-filter"]', 'HIGH');
    
    // 验证过滤结果
    await expect(page.locator('[data-testid="task-item"] .priority-high')).toBeVisible();
  });

  test('任务拖拽排序', async ({ page }) => {
    // 导航到任务页面
    await page.click('text=任务');
    
    // 等待任务列表加载
    await page.waitForSelector('[data-testid="task-item"]');
    
    // 获取第一个任务元素
    const firstTask = page.locator('[data-testid="task-item"]').first();
    const secondTask = page.locator('[data-testid="task-item"]').nth(1);
    
    // 拖拽第一个任务到第二个位置
    await firstTask.dragTo(secondTask);
    
    // 验证任务顺序已更新
    await expect(page.locator('text=任务顺序已更新')).toBeVisible();
  });
});
