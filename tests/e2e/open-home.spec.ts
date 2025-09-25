import { test, expect } from '@playwright/test'

test('首页到 FeatureX 列表链路', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByText('Home')).toBeVisible()
  await page.getByRole('link', { name: '前往 FeatureX 列表' }).click()
  await expect(page.getByText('FeatureX 列表')).toBeVisible()
})

// 简单注释：E2E 用例，验证首页打开并能跳转到列表页。

