#!/usr/bin/env node
/**
 * 把 dist/notes 下的所有笔记页面导出为 PDF，并打成一个 zip。
 *
 * 用法：
 *   npm run export:notes                 # 自动 build + preview + 导出
 *   npm run export:notes -- <baseUrl>    # 使用已经运行的服务
 *
 * 产物：exports/notes-pdf/** 和 exports/notes-export-*.zip
 */
import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import { mkdir, readdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, join, relative, resolve } from 'node:path';
import { chromium } from '@playwright/test';
import JSZip from 'jszip';

const root = resolve('.');
const distNotes = join(root, 'dist', 'notes');
const outRoot = join(root, 'exports');
const pdfRoot = join(outRoot, 'notes-pdf');
const astroBin = join(root, 'node_modules', 'astro', 'bin', 'astro.mjs');
const npm = process.platform === 'win32' ? 'npm.cmd' : 'npm';
const channel = process.env.PW_CHANNEL ?? 'msedge';
const port = 4323;
const argUrl = process.argv.find((arg) => arg.startsWith('http'));
let baseUrl = (argUrl ?? `http://127.0.0.1:${port}`).replace(/\/$/, '');
let server;

async function stopServer() {
  if (!server) return;
  const exited = new Promise((resolvePromise) => server.once('exit', resolvePromise));
  server.kill();
  await Promise.race([exited, new Promise((resolvePromise) => setTimeout(resolvePromise, 3000))]);
  server = undefined;
}

function runNpm(args) {
  return new Promise((resolvePromise, reject) => {
    const child = spawn(npm, args, { stdio: 'inherit', shell: true });
    child.on('error', reject);
    child.on('exit', (code) => {
      if (code === 0) resolvePromise();
      else reject(new Error(`npm ${args.join(' ')} 退出码 ${code}`));
    });
  });
}

async function waitForServer(url, timeout = 30000) {
  const start = Date.now();
  while (Date.now() - start < timeout) {
    try {
      const response = await fetch(`${url}/notes/`);
      if (response.ok) return;
    } catch {
      // 还没启动
    }
    await new Promise((resolvePromise) => setTimeout(resolvePromise, 500));
  }
  throw new Error(`服务没有在 ${timeout}ms 内启动：${url}`);
}

async function collectNotePages(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const pages = [];
  for (const entry of entries) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) pages.push(...(await collectNotePages(full)));
    else if (entry.name === 'index.html') pages.push(full);
  }
  return pages;
}

try {
  if (!argUrl) {
    await runNpm(['run', 'build']);
    server = spawn(
      process.execPath,
      [astroBin, 'preview', '--host', '127.0.0.1', '--port', String(port)],
      { stdio: 'inherit' },
    );
    await waitForServer(baseUrl);
  }

  if (!existsSync(distNotes)) {
    throw new Error('找不到 dist/notes，请先运行 npm run build');
  }

  const pages = await collectNotePages(distNotes);
  if (pages.length === 0) {
    console.log('没有找到笔记页面，先往 src/content/notes/ 里添加内容再导出。');
    process.exitCode = 0;
    await stopServer();
    process.exit(0);
  }

  await mkdir(pdfRoot, { recursive: true });
  const browser = await chromium.launch({ channel });
  const page = await browser.newPage({ viewport: { width: 1100, height: 1600 }, locale: 'zh-CN' });
  const zip = new JSZip();

  for (const file of pages) {
    const rel = relative(distNotes, file).replace(/\\/g, '/');
    const route = rel === 'index.html' ? '/notes/' : `/notes/${rel.replace(/\/index\.html$/, '')}/`;
    const url = `${baseUrl}${route}`;
    const output = join(pdfRoot, `${rel.replace(/\/index\.html$/, '').replace(/^index\.html$/, 'notes')}.pdf`);
    await mkdir(dirname(output), { recursive: true });
    await page.goto(url, { waitUntil: 'load' });
    await page.waitForTimeout(300);
    await page.evaluate(() => {
      document.querySelectorAll('details').forEach((item) => {
        item.open = true;
      });
    });
    const pdf = await page.pdf({
      path: output,
      format: 'A4',
      printBackground: true,
      margin: { top: '18mm', bottom: '18mm', left: '16mm', right: '16mm' },
    });
    zip.file(relative(pdfRoot, output).replace(/\\/g, '/'), pdf);
    console.log(`已导出 ${route}`);
  }

  await browser.close();

  const stamp = new Date().toISOString().replace(/[:T]/g, '-').slice(0, 16);
  const zipPath = join(outRoot, `notes-export-${stamp}.zip`);
  zip.file(
    'README.txt',
    [
      '笔记导出包',
      `生成时间：${new Date().toLocaleString('zh-CN')}`,
      `页面数量：${pages.length}`,
      '',
      'PDF 由本地浏览器打印生成，包含笔记正文；导航、侧边栏和交互按钮已在打印样式中隐藏。',
      '如果 PDF 里出现残缺的公式或字体，请用同一台电脑重新运行 npm run export:notes。',
    ].join('\n'),
  );
  const buffer = await zip.generateAsync({ type: 'nodebuffer', compression: 'DEFLATE' });
  await writeFile(zipPath, buffer);

  console.log(`\n完成：${pdfRoot}`);
  console.log(`压缩包：${zipPath}`);
} finally {
  await stopServer();
}
