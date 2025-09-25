/**
 * 认证流程 E2E 测试
 * 测试用户注册、登录、登出流程
 */

import { test, expect } from '@playwright/test';

test.describe('认证流程', () => {
  test.beforeEach(async ({ page }) => {
    // 访问应用首页
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test('用户注册流程', async ({ page }) => {
    // 点击注册按钮
    await page.click('text=注册');
    
    // 填写注册表单
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="name"]', 'Test User');
    await page.fill('input[name="password"]', 'password123');
    await page.fill('input[name="confirmPassword"]', 'password123');
    
    // 提交表单
    await page.click('button[type="submit"]');
    
    // 验证注册成功
    await expect(page.locator('text=注册成功')).toBeVisible();
  });

  test('用户登录流程', async ({ page }) => {
    // 点击登录按钮
    await page.click('text=登录');
    
    // 填写登录表单
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', 'password123');
    
    // 提交表单
    await page.click('button[type="submit"]');
    
    // 验证登录成功
    await expect(page.locator('text=欢迎回来')).toBeVisible();
  });

  test('用户登出流程', async ({ page }) => {
    // 先登录
    await page.click('text=登录');
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');
    
    // 等待登录完成
    await page.waitForSelector('text=欢迎回来');
    
    // 点击登出
    await page.click('text=登出');
    
    // 验证登出成功
    await expect(page.locator('text=登录')).toBeVisible();
  });

  test('无效凭据登录', async ({ page }) => {
    // 点击登录按钮
    await page.click('text=登录');
    
    // 填写无效凭据
    await page.fill('input[name="email"]', 'invalid@example.com');
    await page.fill('input[name="password"]', 'wrongpassword');
    
    // 提交表单
    await page.click('button[type="submit"]');
    
    // 验证错误消息
    await expect(page.locator('text=登录失败')).toBeVisible();
  });

  test('表单验证', async ({ page }) => {
    // 测试空表单提交
    await page.click('text=登录');
    await page.click('button[type="submit"]');
    
    // 验证验证错误
    await expect(page.locator('text=请输入邮箱')).toBeVisible();
    await expect(page.locator('text=请输入密码')).toBeVisible();
  });
});
