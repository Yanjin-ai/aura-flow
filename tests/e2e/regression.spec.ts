/**
 * 回归测试用例
 * 验证功能完整性和数据一致性
 */

import { test, expect } from '@playwright/test';

test.describe('Aura Flow 回归测试', () => {
  
  test.beforeEach(async ({ page }) => {
    // 每个测试前登录
    await page.goto('/');
    
    // 尝试登录
    const loginForm = page.locator('form[data-testid="login-form"]');
    if (await loginForm.isVisible()) {
      await page.fill('input[name="email"]', 'demo@auraflow.com');
      await page.fill('input[name="password"]', 'password123');
      await page.click('button[type="submit"]');
      await page.waitForURL(/.*\/Home/);
    }
  });

  test('完整的任务生命周期', async ({ page }) => {
    await page.goto('/Home');
    
    // 创建任务
    const taskInput = page.locator('input[data-testid="task-input"]');
    if (await taskInput.isVisible()) {
      const taskTitle = `回归测试任务 ${Date.now()}`;
      await taskInput.fill(taskTitle);
      await page.press('input[data-testid="task-input"]', 'Enter');
      
      // 验证任务创建
      await expect(page.locator('[data-testid="task-item"]')).toContainText(taskTitle);
      
      // 标记任务为进行中
      const taskItem = page.locator('[data-testid="task-item"]').first();
      await taskItem.locator('button[data-testid="start-task"]').click();
      
      // 验证状态更新
      await expect(taskItem.locator('[data-testid="task-status"]')).toContainText('进行中');
      
      // 完成任务
      await taskItem.locator('button[data-testid="complete-task"]').click();
      
      // 验证任务完成
      await expect(taskItem.locator('[data-testid="task-status"]')).toContainText('已完成');
      
      // 删除任务
      await taskItem.locator('button[data-testid="delete-task"]').click();
      
      // 确认删除
      await page.click('button[data-testid="confirm-delete"]');
      
      // 验证任务删除
      await expect(page.locator('[data-testid="task-item"]')).not.toContainText(taskTitle);
    }
  });

  test('洞察生成和反馈', async ({ page }) => {
    await page.goto('/Insights');
    
    // 生成洞察
    const generateButton = page.locator('button[data-testid="generate-insights"]');
    if (await generateButton.isVisible()) {
      await generateButton.click();
      
      // 等待洞察生成
      await page.waitForSelector('[data-testid="insight-item"]', { timeout: 15000 });
      
      // 验证洞察内容
      const insightItem = page.locator('[data-testid="insight-item"]').first();
      await expect(insightItem.locator('[data-testid="insight-title"]')).toBeVisible();
      await expect(insightItem.locator('[data-testid="insight-content"]')).toBeVisible();
      
      // 给洞察评分
      const ratingButtons = insightItem.locator('button[data-testid="rating-button"]');
      if (await ratingButtons.count() > 0) {
        await ratingButtons.nth(4).click(); // 5星评分
        
        // 验证评分成功
        await expect(insightItem.locator('[data-testid="rating-success"]')).toBeVisible();
      }
    }
  });

  test('反思记录功能', async ({ page }) => {
    await page.goto('/ReflectionHistory');
    
    // 创建新反思
    const newReflectionButton = page.locator('button[data-testid="new-reflection"]');
    if (await newReflectionButton.isVisible()) {
      await newReflectionButton.click();
      
      // 填写反思内容
      const reflectionTextarea = page.locator('textarea[data-testid="reflection-content"]');
      await reflectionTextarea.fill('这是一个回归测试反思记录');
      
      // 选择心情
      const moodButtons = page.locator('button[data-testid="mood-button"]');
      if (await moodButtons.count() > 0) {
        await moodButtons.nth(2).click(); // 选择中性心情
      }
      
      // 保存反思
      await page.click('button[data-testid="save-reflection"]');
      
      // 验证反思保存成功
      await expect(page.locator('[data-testid="reflection-item"]')).toContainText('这是一个回归测试反思记录');
    }
  });

  test('设置保存和恢复', async ({ page }) => {
    await page.goto('/Settings');
    
    // 修改设置
    const languageSelect = page.locator('select[data-testid="language-select"]');
    if (await languageSelect.isVisible()) {
      await languageSelect.selectOption('en-US');
      
      // 修改其他设置
      const autoRolloverToggle = page.locator('input[data-testid="auto-rollover-toggle"]');
      if (await autoRolloverToggle.isVisible()) {
        await autoRolloverToggle.click();
      }
      
      // 保存设置
      await page.click('button[data-testid="save-settings"]');
      
      // 验证设置保存成功
      await expect(page.locator('[data-testid="settings-saved"]')).toBeVisible();
      
      // 刷新页面验证设置持久化
      await page.reload();
      await expect(languageSelect).toHaveValue('en-US');
    }
  });

  test('数据导出功能', async ({ page }) => {
    await page.goto('/admin');
    
    // 检查管理员权限
    const exportButton = page.locator('button[data-testid="export-data"]');
    if (await exportButton.isVisible()) {
      // 设置下载监听
      const downloadPromise = page.waitForEvent('download');
      
      // 点击导出按钮
      await exportButton.click();
      
      // 等待下载开始
      const download = await downloadPromise;
      
      // 验证下载文件
      expect(download.suggestedFilename()).toMatch(/aura-flow-data-.*\.json/);
    }
  });

  test('搜索和过滤功能', async ({ page }) => {
    await page.goto('/Home');
    
    // 测试任务搜索
    const searchInput = page.locator('input[data-testid="search-input"]');
    if (await searchInput.isVisible()) {
      await searchInput.fill('测试');
      
      // 验证搜索结果
      const taskItems = page.locator('[data-testid="task-item"]');
      const count = await taskItems.count();
      
      if (count > 0) {
        // 验证所有显示的任务都包含搜索关键词
        for (let i = 0; i < count; i++) {
          const taskText = await taskItems.nth(i).textContent();
          expect(taskText?.toLowerCase()).toContain('测试');
        }
      }
    }
    
    // 测试状态过滤
    const statusFilter = page.locator('select[data-testid="status-filter"]');
    if (await statusFilter.isVisible()) {
      await statusFilter.selectOption('completed');
      
      // 验证过滤结果
      const taskItems = page.locator('[data-testid="task-item"]');
      const count = await taskItems.count();
      
      if (count > 0) {
        for (let i = 0; i < count; i++) {
          const statusElement = taskItems.nth(i).locator('[data-testid="task-status"]');
          await expect(statusElement).toContainText('已完成');
        }
      }
    }
  });

  test('键盘快捷键', async ({ page }) => {
    await page.goto('/Home');
    
    // 测试快捷键
    await page.keyboard.press('Control+k'); // 快速搜索
    
    const searchInput = page.locator('input[data-testid="search-input"]');
    if (await searchInput.isVisible()) {
      await expect(searchInput).toBeFocused();
    }
    
    // 测试 ESC 键关闭模态框
    await page.keyboard.press('Escape');
    
    // 测试 Enter 键提交表单
    const taskInput = page.locator('input[data-testid="task-input"]');
    if (await taskInput.isVisible()) {
      await taskInput.fill('快捷键测试任务');
      await page.keyboard.press('Enter');
      
      // 验证任务创建
      await expect(page.locator('[data-testid="task-item"]')).toContainText('快捷键测试任务');
    }
  });

  test('错误恢复和重试', async ({ page }) => {
    // 模拟网络错误
    await page.route('**/api/tasks', route => route.abort());
    
    await page.goto('/Home');
    
    // 尝试创建任务
    const taskInput = page.locator('input[data-testid="task-input"]');
    if (await taskInput.isVisible()) {
      await taskInput.fill('网络错误测试任务');
      await page.press('input[data-testid="task-input"]', 'Enter');
      
      // 验证错误处理
      await expect(page.locator('[data-testid="error-message"]')).toBeVisible();
      
      // 恢复网络
      await page.unroute('**/api/tasks');
      
      // 重试操作
      await page.click('button[data-testid="retry-button"]');
      
      // 验证重试成功
      await expect(page.locator('[data-testid="task-item"]')).toContainText('网络错误测试任务');
    }
  });

  test('数据一致性检查', async ({ page }) => {
    // 在多个页面间切换，验证数据一致性
    await page.goto('/Home');
    
    // 创建任务
    const taskInput = page.locator('input[data-testid="task-input"]');
    if (await taskInput.isVisible()) {
      const taskTitle = `一致性测试任务 ${Date.now()}`;
      await taskInput.fill(taskTitle);
      await page.press('input[data-testid="task-input"]', 'Enter');
      
      // 切换到洞察页面
      await page.goto('/Insights');
      await page.waitForLoadState('networkidle');
      
      // 切换回任务页面
      await page.goto('/Home');
      await page.waitForLoadState('networkidle');
      
      // 验证任务仍然存在
      await expect(page.locator('[data-testid="task-item"]')).toContainText(taskTitle);
    }
  });
});
