import path from 'node:path';
import { visit } from 'unist-util-visit';

const COLLECTIONS = [
  { marker: 'src/content/notes/', base: '/notes/', kind: 'notes' },
  { marker: 'src/content/blog/', base: '/blog/', kind: 'blog' },
  { marker: 'src/content/recreation/', base: '/shelf/', kind: 'recreation' },
];

function stripMd(value) {
  return value.replace(/\.(md|mdx)$/i, '');
}

function stripOrder(value) {
  return value.replace(/^\d+[-_.]\s*/, '');
}

/**
 * CommonMark 不接受带空格的目标地址，[第一节](./1.1 实数.md) 会被当成普通文本。
 * 这里把这种文本补成 link 节点，再统一改写成站内路由。
 */
function linkifyMarkdownPaths(tree) {
  visit(tree, 'text', (node, index, parent) => {
    if (!parent || typeof index !== 'number') return;
    if (parent.type !== 'paragraph' && parent.type !== 'listItem' && parent.type !== 'blockquote') {
      return;
    }

    const pattern = /\[([^\]\n]+)\]\(([^)\n]+\.(?:md|mdx)(?:[?#][^)\n]*)?)\)/gi;
    if (!pattern.test(node.value)) return;
    pattern.lastIndex = 0;

    const children = [];
    let last = 0;
    let match;

    while ((match = pattern.exec(node.value)) !== null) {
      if (match.index > last) {
        children.push({ type: 'text', value: node.value.slice(last, match.index) });
      }
      children.push({
        type: 'link',
        url: match[2].trim(),
        children: [{ type: 'text', value: match[1] }],
      });
      last = pattern.lastIndex;
    }

    if (children.length === 0) return;
    if (last < node.value.length) {
      children.push({ type: 'text', value: node.value.slice(last) });
    }

    parent.children.splice(index, 1, ...children);
    return index + children.length;
  });
}

/**
 * 把内容文件里的相对 Markdown 链接改成站内路由。
 * 例如笔记里的 [第一节](./1.1 实数.md)
 * → /notes/.../1 实数/
 */
export default function remarkRelativeLinks() {
  return (tree, file) => {
    const raw = String(file.path ?? file.history?.[0] ?? '').replace(/\\/g, '/');
    const collection = COLLECTIONS.find((item) => raw.includes(item.marker));
    if (!collection) return;

    const sourceRel = raw.slice(raw.indexOf(collection.marker) + collection.marker.length);
    const sourceDir = path.posix.dirname(sourceRel);

    linkifyMarkdownPaths(tree);

    visit(tree, 'link', (node) => {
      const href = node.url;
      if (!href || /^(?:[a-z]+:|#|\/|\/\/)/i.test(href)) return;

      const match = href.match(/^([^?#]*)([?#].*)?$/);
      if (!match) return;
      const pathPart = match[1];
      const suffix = match[2] ?? '';
      if (!/\.(md|mdx)$/i.test(pathPart)) return;

      const target = path.posix.normalize(
        path.posix.join(sourceDir, decodeURIComponent(pathPart)),
      );
      if (target.startsWith('..')) return;

      let targetPath = stripMd(target);
      if (collection.kind === 'notes') {
        const isIndex = /(^|\/)index$/i.test(targetPath);
        if (isIndex) {
          targetPath = targetPath.replace(/\/index$/i, '');
        } else {
          const dirname = path.posix.dirname(targetPath);
          const filename = stripOrder(path.posix.basename(targetPath));
          targetPath = path.posix.join(dirname, filename);
        }
      } else if (collection.kind === 'recreation') {
        targetPath = targetPath.replace(/\/index$/i, '');
      }

      node.url = `${collection.base}${targetPath}/${suffix}`;
    });
  };
}
