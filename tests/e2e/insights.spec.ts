/**
 * AI 洞察生成 E2E 测试
 * 测试 AI 洞察的生成、查看、反馈等功能
 */

import { test, expect } from '@playwright/test';

test.describe('AI 洞察生成', () => {
  test.beforeEach(async ({ page }) => {
    // 登录用户
    await page.goto('/');
    await page.click('text=登录');
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForSelector('text=欢迎回来');
  });

  test('生成每日洞察', async ({ page }) => {
    // 导航到洞察页面
    await page.click('text=洞察');
    
    // 点击生成每日洞察按钮
    await page.click('text=生成每日洞察');
    
    // 等待 AI 处理
    await expect(page.locator('text=正在生成洞察...')).toBeVisible();
    
    // 等待洞察生成完成
    await expect(page.locator('[data-testid="insight-card"]')).toBeVisible({ timeout: 30000 });
    
    // 验证洞察内容
    await expect(page.locator('[data-testid="insight-card"] h3')).toBeVisible();
    await expect(page.locator('[data-testid="insight-card"] p')).toBeVisible();
  });

  test('生成每周洞察', async ({ page }) => {
    // 导航到洞察页面
    await page.click('text=洞察');
    
    // 点击生成每周洞察按钮
    await page.click('text=生成每周洞察');
    
    // 等待 AI 处理
    await expect(page.locator('text=正在生成洞察...')).toBeVisible();
    
    // 等待洞察生成完成
    await expect(page.locator('[data-testid="insight-card"]')).toBeVisible({ timeout: 30000 });
    
    // 验证洞察类型
    await expect(page.locator('[data-testid="insight-card"] .insight-type-weekly')).toBeVisible();
  });

  test('洞察反馈功能', async ({ page }) => {
    // 导航到洞察页面
    await page.click('text=洞察');
    
    // 等待洞察卡片加载
    await page.waitForSelector('[data-testid="insight-card"]');
    
    // 点击反馈按钮
    await page.click('[data-testid="insight-card"] button[aria-label="反馈"]');
    
    // 填写反馈
    await page.selectOption('select[name="rating"]', '5');
    await page.fill('textarea[name="comment"]', '这个洞察很有帮助！');
    
    // 提交反馈
    await page.click('button[type="submit"]');
    
    // 验证反馈提交成功
    await expect(page.locator('text=反馈提交成功')).toBeVisible();
  });

  test('洞察历史查看', async ({ page }) => {
    // 导航到洞察页面
    await page.click('text=洞察');
    
    // 点击查看历史按钮
    await page.click('text=查看历史');
    
    // 验证历史洞察列表
    await expect(page.locator('[data-testid="insight-history"]')).toBeVisible();
    
    // 验证历史洞察项目
    await expect(page.locator('[data-testid="insight-history-item"]')).toBeVisible();
  });

  test('洞察分享功能', async ({ page }) => {
    // 导航到洞察页面
    await page.click('text=洞察');
    
    // 等待洞察卡片加载
    await page.waitForSelector('[data-testid="insight-card"]');
    
    // 点击分享按钮
    await page.click('[data-testid="insight-card"] button[aria-label="分享"]');
    
    // 验证分享选项
    await expect(page.locator('text=复制链接')).toBeVisible();
    await expect(page.locator('text=导出PDF')).toBeVisible();
    
    // 测试复制链接功能
    await page.click('text=复制链接');
    await expect(page.locator('text=链接已复制到剪贴板')).toBeVisible();
  });

  test('AI 服务降级处理', async ({ page }) => {
    // 模拟 AI 服务不可用
    await page.route('**/api/insights/generate', route => {
      route.fulfill({
        status: 503,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'AI 服务暂时不可用' })
      });
    });
    
    // 导航到洞察页面
    await page.click('text=洞察');
    
    // 点击生成洞察按钮
    await page.click('text=生成每日洞察');
    
    // 验证降级处理
    await expect(page.locator('text=AI 服务暂时不可用，使用模拟数据')).toBeVisible();
    
    // 验证模拟洞察显示
    await expect(page.locator('[data-testid="insight-card"] .mock-insight')).toBeVisible();
  });

  test('洞察个性化设置', async ({ page }) => {
    // 导航到设置页面
    await page.click('text=设置');
    
    // 找到 AI 洞察设置
    await page.click('text=AI 洞察设置');
    
    // 修改洞察偏好
    await page.check('input[name="daily-insights"]');
    await page.uncheck('input[name="weekly-insights"]');
    await page.selectOption('select[name="insight-style"]', 'detailed');
    
    // 保存设置
    await page.click('button[type="submit"]');
    
    // 验证设置保存成功
    await expect(page.locator('text=设置保存成功')).toBeVisible();
    
    // 返回洞察页面验证设置生效
    await page.click('text=洞察');
    await expect(page.locator('text=生成每日洞察')).toBeVisible();
    await expect(page.locator('text=生成每周洞察')).not.toBeVisible();
  });
});
