import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright E2E 测试配置
 * 用于冒烟测试和回归测试
 */
export default defineConfig({
  testDir: './tests/e2e',
  /* 并行运行测试 */
  fullyParallel: true,
  /* 失败时重试 */
  retries: process.env.CI ? 2 : 0,
  /* 并行工作进程 */
  workers: process.env.CI ? 1 : undefined,
  /* 报告器配置 */
  reporter: [
    ['html'],
    ['json', { outputFile: 'test-results/results.json' }],
    ['junit', { outputFile: 'test-results/results.xml' }]
  ],
  /* 全局测试配置 */
  use: {
    /* 基础 URL */
    baseURL: process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:5173',
    
    /* 收集失败时的追踪信息 */
    trace: 'on-first-retry',
    
    /* 截图配置 */
    screenshot: 'only-on-failure',
    
    /* 视频录制 */
    video: 'retain-on-failure',
    
    /* 浏览器上下文选项 */
    viewport: { width: 1280, height: 720 },
    ignoreHTTPSErrors: true,
    
    /* 超时设置 */
    actionTimeout: 10000,
    navigationTimeout: 30000,
  },

  /* 项目配置 - 多浏览器测试 */
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
    /* 移动端测试 */
    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 5'] },
    },
    {
      name: 'Mobile Safari',
      use: { ...devices['iPhone 12'] },
    },
  ],

  /* 开发服务器配置 */
  webServer: process.env.CI ? undefined : {
    command: 'pnpm dev',
    url: 'http://localhost:5173',
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000,
  },

  /* 输出目录 */
  outputDir: 'test-results/',
  
  /* 全局设置和拆卸 */
  globalSetup: require.resolve('./tests/e2e/global-setup.ts'),
  globalTeardown: require.resolve('./tests/e2e/global-teardown.ts'),
});