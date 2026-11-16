import { defineConfig, devices } from '@playwright/test';

/**
 * 本地冒烟测试。默认使用系统 Edge（channel: msedge），无需额外下载浏览器。
 * 如果 Edge 不可用，把 channel 删掉并执行 npx playwright install chromium。
 */
export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: false,
  timeout: 30_000,
  expect: { timeout: 6_000 },
  reporter: 'list',
  use: {
    baseURL: 'http://127.0.0.1:4321',
    channel: 'msedge',
    locale: 'zh-CN',
    trace: 'retain-on-failure',
  },
  webServer: {
    command: 'npm run dev -- --host 127.0.0.1 --port 4321',
    url: 'http://127.0.0.1:4321',
    reuseExistingServer: true,
    timeout: 120_000,
  },
  projects: [
    { name: 'desktop', use: { viewport: { width: 1440, height: 1000 } } },
    { name: 'mobile', use: { ...devices['Pixel 7'] } },
  ],
});
