import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import { unified } from '@astrojs/markdown-remark';
import remarkDirective from 'remark-directive';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import { visit } from 'unist-util-visit';
import rehypeInlineMarkers from './src/plugins/rehype-inline-markers.mjs';
import remarkRelativeLinks from './src/plugins/remark-relative-links.mjs';
import remarkToggle from './src/plugins/remark-toggle.mjs';

/**
 * 部署环境变量：
 *   SITE_URL  站点源地址，例如 https://ningzh-h.github.io
 *   BASE_PATH 子路径，例如 /<repo>/ ；用户站点或自定义域名用 /
 */
const site = process.env.SITE_URL || 'https://ningzh-h.github.io';
const base = normalizeBase(process.env.BASE_PATH || '/');

/** @param {string} value */
function normalizeBase(value) {
  let next = value.trim();
  if (!next.startsWith('/')) next = `/${next}`;
  if (!next.endsWith('/')) next = `${next}/`;
  return next;
}

/**
 * 移除 Docsify 风格的 [toc] 占位段落，站点自己渲染目录。
 * @returns {import('unified').Plugin}
 */
function remarkStripToc() {
  return (tree) => {
    visit(tree, 'paragraph', (node, index, parent) => {
      if (!parent || typeof index !== 'number') return;
      const text = node.children
        .filter((child) => child.type === 'text')
        .map((child) => child.value)
        .join('')
        .trim();
      if (/^\[toc\]$/i.test(text)) {
        parent.children.splice(index, 1);
        return index;
      }
    });
  };
}

/**
 * 把 Markdown 中以 / 开头的站内链接、图片地址加上 base 前缀，
 * 这样部署到 /repo/ 子路径时不会 404。
 * @param {string} basePath
 * @returns {import('unified').Plugin}
 */
function rehypeBaseUrl(basePath) {
  return () => (tree) => {
    const prefix = basePath === '/' ? '' : basePath.replace(/\/$/, '');
    if (!prefix) return;
    visit(tree, 'element', (node) => {
      const props = node.properties || {};
      for (const key of ['src', 'href']) {
        const value = props[key];
        if (
          typeof value === 'string' &&
          value.startsWith('/') &&
          !value.startsWith('//')
        ) {
          props[key] = `${prefix}${value}`;
        }
      }
    });
  };
}

const katexMacros = {
  '\\R': '\\mathbb{R}',
  '\\N': '\\mathbb{N}',
  '\\Z': '\\mathbb{Z}',
  '\\Q': '\\mathbb{Q}',
  '\\C': '\\mathbb{C}',
  '\\dd': '\\mathrm{d}',
  '\\abs': '\\left|#1\\right|',
  '\\norm': '\\left\\|#1\\right\\|',
};

export default defineConfig({
  site,
  base,
  trailingSlash: 'always',
  devToolbar: { enabled: false },
  integrations: [mdx(), sitemap()],
  markdown: {
    processor: unified({
      remarkPlugins: [
        remarkDirective,
        remarkToggle,
        remarkRelativeLinks,
        remarkMath,
        remarkStripToc,
      ],
      rehypePlugins: [
        [rehypeKatex, { macros: katexMacros, throwOnError: false, strict: false }],
        rehypeBaseUrl(base),
        rehypeInlineMarkers,
      ],
    }),
    shikiConfig: {
      themes: {
        light: 'github-light',
        dark: 'github-dark',
      },
      defaultColor: false,
      wrap: true,
    },
  },
});
