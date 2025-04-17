// @ts-check
const { defineConfig } = require('@playwright/test');

// 检查是否在CI环境中运行
const isCI = process.env.CI === 'true';
console.log('Playwright配置 - CI环境:', isCI);

module.exports = defineConfig({
  testDir: './tests',
  timeout: isCI ? 90 * 1000 : 60 * 1000, // CI环境延长超时时间
  expect: {
    timeout: isCI ? 15000 : 10000
  },
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 1,
  workers: isCI ? 1 : 16, // CI环境减少并发工作进程，避免资源冲突
  reporter: [
    ['html'],
    ['list']
  ],
  use: {
    actionTimeout: isCI ? 30000 : 15000, // CI环境增加操作超时
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: isCI ? 'on' : 'on-first-retry' // CI环境始终记录视频便于调试
  },
  projects: [
    {
      name: 'electron',
      use: {
        // CI环境下的特殊配置
        launchOptions: {
          slowMo: isCI ? 100 : 0, // CI环境下减慢操作速度，提高稳定性
        }
      },
    }
  ],
  // CI环境的全局设置
  globalSetup: isCI ? require.resolve('./tests/ci-global-setup.js') : undefined,
}); 