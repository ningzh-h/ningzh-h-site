#!/usr/bin/env node
/**
 * 用系统 Edge 给本地站点截图，输出到 docs/screenshots/。
 * 前置：先跑 npm run dev（默认 4321 端口）。
 *
 * 用法：node scripts/screenshots.mjs [http://127.0.0.1:4321]
 */
import { mkdirSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { chromium, devices } from '@playwright/test';

const baseUrl = (process.argv[2] ?? 'http://127.0.0.1:4321').replace(/\/$/, '');
const outDir = resolve('docs/screenshots');
mkdirSync(outDir, { recursive: true });

const channel = process.env.PW_CHANNEL ?? 'msedge';

const browser = await chromium.launch({ channel });
const context = await browser.newContext({
  viewport: { width: 1440, height: 1000 },
  deviceScaleFactor: 1,
  locale: 'zh-CN',
});
const page = await context.newPage();

async function shot(path, name, options = {}) {
  await page.goto(`${baseUrl}${path}`, { waitUntil: 'load' });
  await page.waitForTimeout(600);
  await page.screenshot({ path: join(outDir, name), ...options });
  console.log(`已截图 ${name} ← ${path}`);
}

await shot('/', 'home-light.png');
await page.screenshot({ path: join(outDir, 'home-full.png'), fullPage: true });
console.log('已截图 home-full.png');

await page.click('[data-accent-toggle]');
await page.waitForTimeout(250);
await page.screenshot({ path: join(outDir, 'themes.png') });
console.log('已截图 themes.png');
await page.click('[data-accent-value="clay"]');
await page.waitForTimeout(300);
await page.screenshot({ path: join(outDir, 'home-clay.png') });
console.log('已截图 home-clay.png');
await page.click('[data-accent-toggle]');
await page.click('[data-accent-value="pine"]');
await page.waitForTimeout(200);

await page.click('[data-theme-toggle]');
await page.waitForTimeout(250);
await page.screenshot({ path: join(outDir, 'home-dark.png') });
console.log('已截图 home-dark.png');
await page.goto(`${baseUrl}/`, { waitUntil: 'load' });
await page.click('[data-theme-toggle]');

await shot('/blog/', 'blog.png');
await shot('/blog/test/', 'blog-test.png');
await shot('/notes/', 'notes.png');
await shot('/shelf/', 'shelf.png');
await shot('/cards/', 'cards.png');
await shot('/about/', 'about.png');

await page.goto(`${baseUrl}/`, { waitUntil: 'load' });
await page.click('[data-search-open]');
await page.waitForTimeout(400);
await page.screenshot({ path: join(outDir, 'search.png') });
console.log('已截图 search.png ← 搜索弹窗');

const mobile = await browser.newContext({
  ...devices['Pixel 7'],
  locale: 'zh-CN',
});
const mobilePage = await mobile.newPage();
await mobilePage.goto(`${baseUrl}/`, { waitUntil: 'load' });
await mobilePage.waitForTimeout(500);
await mobilePage.screenshot({ path: join(outDir, 'mobile-home.png'), fullPage: true });
console.log('已截图 mobile-home.png');
await mobilePage.goto(`${baseUrl}/notes/`, { waitUntil: 'load' });
await mobilePage.waitForTimeout(400);
await mobilePage.screenshot({ path: join(outDir, 'mobile-notes.png') });
console.log('已截图 mobile-notes.png');
await mobile.close();

await context.close();
await browser.close();
console.log(`\n完成，截图目录：${outDir}`);
