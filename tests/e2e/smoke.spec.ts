import { expect, test } from '@playwright/test';

test('首页可以打开，且没有控制台错误', async ({ page, isMobile }) => {
  const errors: string[] = [];
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text());
  });
  page.on('pageerror', (error) => errors.push(error.message));

  await page.goto('/');
  await expect(page).toHaveTitle(/.+/);
  await expect(page.locator('.home-name')).toBeVisible();
  await expect(page.locator('.home-prose')).toBeVisible();
  await expect(page.locator('a.post-card').first()).toBeVisible();

  if (isMobile) {
    await expect(page.locator('[data-menu-toggle]')).toBeVisible();
  } else {
    await expect(page.locator('.site-nav')).toBeVisible();
    await expect(page.locator('.site-nav')).toContainText('笔记');
  }

  expect(errors).toEqual([]);
});

test('博客列表 → 语法测试文章', async ({ page }) => {
  await page.goto('/blog/');
  await expect(page.locator('h1.page-title')).toHaveText('博客');

  await page.locator('a.post-card').filter({ hasText: '排版与语法测试' }).click();
  await expect(page.locator('.article-title')).toContainText('排版与语法测试');
  await expect(page.locator('.katex').first()).toBeVisible();
  await expect(page.locator('summary .katex').first()).toBeVisible();
  await expect(page.locator('.prose mark').first()).toBeVisible();
  await expect(page.locator('.prose .spoiler').first()).toBeVisible();
});

test('文章页有返回上一页按钮', async ({ page }) => {
  await page.goto('/blog/test/');
  await expect(page.locator('.back-link')).toBeVisible();
  await page.locator('.back-link').click();
  await expect(page).toHaveURL(/\/blog\/$/);
});

test('笔记、书影音、卡片的内容测试文件', async ({ page }) => {
  await page.goto('/notes/');
  await expect(page.locator('h1.page-title')).toHaveText('笔记');
  await page.locator('a.book-card').filter({ hasText: '笔记功能测试' }).click();
  await expect(page.locator('.book-chapter-title')).toContainText('笔记功能测试');
  await expect(page.locator('.book-sidebar')).toContainText('第一章');
  await expect(page.locator('.book-sidebar')).toContainText('子目录章节');

  await page.goto('/notes/test/basics/');
  await expect(page.locator('.toc')).toContainText('普通章节');

  await page.goto('/shelf/');
  await expect(page.locator('h1.page-title')).toHaveText('书影音');
  await expect(page.locator('.shelf-category-card')).toHaveCount(1);
  await page.goto('/shelf/anime/');
  await expect(page.locator('.letter-heading')).toHaveText(['测试分组']);
  await expect(page.locator('a.review-card')).toContainText('书影音功能测试');
  await page.locator('a.review-card').click();
  await expect(page.locator('.article-title')).toContainText('书影音功能测试');

  await page.goto('/cards/');
  await expect(page.locator('h1.page-title')).toHaveText('卡片');
  await expect(page.locator('.card-note')).toHaveCount(1);
  await page.locator('.card-note-title').click();
  await expect(page.locator('.article-title')).toContainText('卡片功能测试');

  await page.goto('/about/');
  await expect(page.locator('h1.page-title')).toBeVisible();
});

test('草稿默认不显示', async ({ page, request }) => {
  await page.goto('/blog/');
  await expect(page.locator('.post-card').filter({ hasText: '模板文件' })).toHaveCount(0);

  const response = await request.get('/blog/empty/');
  expect(response.status()).toBe(404);
});

test('搜索框可以打开并返回结果', async ({ page }) => {
  await page.goto('/');
  await page.locator('[data-search-open]').click();
  const input = page.locator('[data-search-input]');
  await expect(input).toBeVisible();
  await input.fill('排版');
  await expect(page.locator('.search-result').first()).toBeVisible();
});

test('主题切换会写入 html[data-theme] 并在刷新后保留', async ({ page }) => {
  await page.goto('/');
  const html = page.locator('html');
  const before = await html.getAttribute('data-theme');
  await page.locator('[data-theme-toggle]').click();
  const after = await html.getAttribute('data-theme');
  expect(after).not.toBe(before);
  await page.reload();
  await expect(html).toHaveAttribute('data-theme', after ?? '');
});

test('颜色主题可以切换并在刷新后保留', async ({ page }) => {
  await page.goto('/');
  const html = page.locator('html');
  await page.locator('[data-accent-toggle]').click();
  await expect(page.locator('[data-accent-menu]')).toBeVisible();
  await page.locator('[data-accent-value="clay"]').click();
  await expect(html).toHaveAttribute('data-accent', 'clay');
  await page.reload();
  await expect(html).toHaveAttribute('data-accent', 'clay');
});

test('移动端菜单可用', async ({ page, isMobile }) => {
  test.skip(!isMobile, '只在移动端项目运行');

  await page.goto('/');
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - window.innerWidth,
  );
  expect(overflow).toBeLessThanOrEqual(1);

  await page.locator('[data-menu-toggle]').click();
  await expect(page.locator('[data-mobile-nav]')).toBeVisible();
  await page.locator('[data-mobile-nav] a').filter({ hasText: '笔记' }).click();
  await expect(page.locator('h1.page-title')).toHaveText('笔记');
});
