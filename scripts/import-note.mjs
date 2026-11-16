#!/usr/bin/env node
/**
 * 把旧笔记导入为一本书（单文件书）。
 *
 * 用法：
 *   node scripts/import-note.mjs "C:\path\to\old-note.md" my-note --title "旧笔记"
 *   node scripts/import-note.mjs "...\Dart.md" dart-notes --dry-run
 *
 * 行为：
 *   - 没有 frontmatter 时自动补一份；
 *   - 把正文第一个 H1 提升为 title 并从正文删除；
 *   - 去掉 Docsify 的 [toc] 占位；
 *   - 写入 src/content/notes/<slug>/index.md。
 *
 * 默认不覆盖已有文件，除非加 --force。
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { basename, dirname, join, resolve } from 'node:path';

const args = process.argv.slice(2);
const positional = args.filter((arg) => !arg.startsWith('--'));
const flag = (name) => args.includes(name);
const option = (name, fallback) => {
  const index = args.indexOf(name);
  return index >= 0 ? (args[index + 1] ?? fallback) : fallback;
};

const source = positional[0];
const slug = positional[1];

if (!source || !slug) {
  console.error(
    '用法：node scripts/import-note.mjs <源文件.md> <书籍目录名> [--title 标题] [--dry-run] [--force]',
  );
  process.exit(1);
}

if (!/^[a-z0-9][a-z0-9-]*$/i.test(slug)) {
  console.error(`笔记目录名只能包含字母、数字和连字符，当前：${slug}`);
  process.exit(1);
}

const sourcePath = resolve(source);
if (!existsSync(sourcePath)) {
  console.error(`找不到源文件：${sourcePath}`);
  process.exit(1);
}

const raw = readFileSync(sourcePath, 'utf8').replace(/^\uFEFF/, '');
const dryRun = flag('--dry-run');
const force = flag('--force');

const hasFrontmatter = /^---\r?\n/.test(raw);
let body = raw;
let title = option('--title');
let frontmatter = null;

if (hasFrontmatter) {
  const end = raw.indexOf('\n---', 4);
  const block = end >= 0 ? raw.slice(4, end) : '';
  body = end >= 0 ? raw.slice(raw.indexOf('\n', end + 4) + 1) : '';
  const titleMatch = block.match(/^title:\s*(.+)$/m);
  title = title ?? titleMatch?.[1]?.trim();
  frontmatter = block.trim();
} else {
  const h1 = body.match(/^#\s+(.+)$/m);
  if (h1) {
    title = title ?? h1[1].trim();
    body = body.replace(h1[0], '').replace(/^\s*\n/, '');
  }
}

title = (title ?? basename(sourcePath, '.md')).trim();
body = body.replace(/^\s*\[toc\]\s*$/gim, '').replace(/\n{3,}/g, '\n\n').trimStart();

const escapedTitle = title.replace(/"/g, '\\"');
const extra = frontmatter
  ? ''
  : [
      `title: "${escapedTitle}"`,
      'description: "从旧笔记导入，后续再慢慢整理。"',
      'status: reading',
      'tags: [导入]',
      'mode: single',
    ].join('\n');

const output = `---\n${extra}\n---\n\n${body.trimEnd()}\n`;
const target = resolve('src/content/notes', slug, 'index.md');

console.log(`源文件：${sourcePath}`);
console.log(`目标：  ${target}`);
console.log(`标题：  ${title}`);
console.log(`字数：  约 ${body.replace(/\s/g, '').length} 字\n`);

if (dryRun) {
  console.log('--- 预览（--dry-run，不写文件）---');
  console.log(output.slice(0, 800));
  process.exit(0);
}

if (existsSync(target) && !force) {
  console.error('目标文件已存在。加 --force 覆盖，或换一个书籍目录名。');
  process.exit(1);
}

mkdirSync(dirname(target), { recursive: true });
writeFileSync(target, output, 'utf8');
console.log('已写入。接下来：');
console.log('  1. npm run dev 打开 /books/ 查看效果；');
console.log('  2. 图片如果是相对路径，移到 public/images/ 并改成 /images/...；');
console.log('  3. 按需在 frontmatter 里补 description、tags、status。');
