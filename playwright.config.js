// @ts-check
const { defineConfig } = require('@playwright/test');

module.exports = defineConfig({
  testDir: './tests',
  timeout: 60 * 1000,
  expect: {
    timeout: 10000
  },
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 1,
  workers: 16,
  reporter: [
    ['html'],
    ['list']
  ],
  use: {
    actionTimeout: 15000,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'on-first-retry'
  },
  projects: [
    {
      name: 'electron',
      use: { 
        // 配置特定于项目的设置，这里不需要特殊配置
      },
    }
  ],
}); 