#!/usr/bin/env node
/**
 * 构建产物内部链接检查。
 *
 * 用法：
 *   node scripts/check-links.mjs --dir dist --base /
 *   node scripts/check-links.mjs --dir dist --base /<repo>/
 *
 * 检查项：
 *   1. 站内链接 / 图片 / 脚本 / 样式是否存在于 dist；
 *   2. 子路径部署时，以 / 开头但没有 base 前缀的链接会单独报错。
 */
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { dirname, extname, join, resolve } from 'node:path';

const args = process.argv.slice(2);
const getArg = (name, fallback) => {
  const index = args.indexOf(name);
  return index >= 0 ? (args[index + 1] ?? fallback) : fallback;
};

const distDir = resolve(getArg('--dir', 'dist'));
const rawBase = getArg('--base', process.env.BASE_PATH ?? '/');
const base = normalizeBase(rawBase);

function normalizeBase(value) {
  let next = value.trim() || '/';
  if (!next.startsWith('/')) next = `/${next}`;
  if (!next.endsWith('/')) next = `${next}/`;
  return next;
}

if (!existsSync(distDir)) {
  console.error(`[check-links] 找不到构建目录：${distDir}，请先运行 npm run build`);
  process.exit(1);
}

function walk(dir) {
  const files = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    const stats = statSync(full);
    if (stats.isDirectory()) files.push(...walk(full));
    else if (extname(entry) === '.html') files.push(full);
  }
  return files;
}

const decodeEntities = (value) =>
  value
    .replace(/&amp;/g, '&')
    .replace(/&#38;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");

const pageFiles = walk(distDir);
const broken = [];
const missingBase = [];
let checked = 0;

for (const file of pageFiles) {
  const html = readFileSync(file, 'utf8');
  const attrPattern = /\s(?:href|src|poster)="([^"]*)"/g;
  let match;

  while ((match = attrPattern.exec(html)) !== null) {
    let url = decodeEntities(match[1].trim());
    if (!url) continue;

    const lowered = url.toLowerCase();
    if (
      lowered.startsWith('http://') ||
      lowered.startsWith('https://') ||
      lowered.startsWith('mailto:') ||
      lowered.startsWith('tel:') ||
      lowered.startsWith('data:') ||
      lowered.startsWith('javascript:') ||
      lowered.startsWith('//') ||
      lowered.startsWith('#')
    ) {
      continue;
    }

    url = url.split('#')[0].split('?')[0];
    if (!url) continue;

    checked += 1;

    let relativePath;
    if (url.startsWith(base)) {
      relativePath = url.slice(base.length);
    } else if (url.startsWith('/')) {
      missingBase.push({ page: file, url });
      continue;
    } else {
      // 相对链接：相对于当前页面的目录
      const pageDir = dirname(file);
      const absolute = resolve(pageDir, url);
      if (!existsSync(absolute) && !existsSync(join(absolute, 'index.html'))) {
        broken.push({ page: file, url, reason: '文件不存在（相对链接）' });
      }
      continue;
    }

    if (relativePath === '') relativePath = 'index.html';
    const decoded = safeDecode(relativePath);
    const candidates = [];
    if (url.endsWith('/') || relativePath === 'index.html') {
      candidates.push(join(distDir, decoded, 'index.html'));
      candidates.push(join(distDir, decoded));
    } else {
      candidates.push(join(distDir, decoded));
      if (!extname(decoded)) {
        candidates.push(join(distDir, `${decoded}.html`));
        candidates.push(join(distDir, decoded, 'index.html'));
      }
    }

    if (!candidates.some((candidate) => existsSync(candidate))) {
      broken.push({ page: file, url, reason: '文件不存在' });
    }
  }
}

function safeDecode(value) {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

const relativeTo = (file) => file.replace(`${distDir}\\`, '').replace(`${distDir}/`, '');

if (missingBase.length > 0) {
  console.error(`\n[check-links] ${missingBase.length} 个站内链接缺少 base 前缀（base=${base}）：`);
  for (const item of missingBase.slice(0, 30)) {
    console.error(`  ${relativeTo(item.page)}  ->  ${item.url}`);
  }
  if (missingBase.length > 30) console.error(`  …还有 ${missingBase.length - 30} 条`);
}

if (broken.length > 0) {
  console.error(`\n[check-links] ${broken.length} 个断链：`);
  for (const item of broken.slice(0, 30)) {
    console.error(`  ${relativeTo(item.page)}  ->  ${item.url}  (${item.reason})`);
  }
  if (broken.length > 30) console.error(`  …还有 ${broken.length - 30} 条`);
}

console.log(
  `\n[check-links] 扫描 ${pageFiles.length} 个 HTML，检查 ${checked} 个站内链接：` +
    `${broken.length} 个断链，${missingBase.length} 个缺少 base。`,
);

process.exit(broken.length > 0 || missingBase.length > 0 ? 1 : 0);
