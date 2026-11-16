import { visit } from 'unist-util-visit';

const SKIP_PARENTS = new Set([
  'code',
  'pre',
  'script',
  'style',
  'math',
  'annotation',
  'semantics',
]);

const MARKER = /(==([^=\n]+)==|\|\|([^|\n]+)\|\|)/g;

/**
 * 行内标记：
 *   ==高亮==  → <mark>高亮</mark>
 *   ||剧透||  → <span class="spoiler">剧透</span>
 *
 * 只处理纯文本节点；代码、公式里不会替换。
 */
export default function rehypeInlineMarkers() {
  return (tree) => {
    visit(tree, 'text', (node, index, parent) => {
      if (!parent || typeof index !== 'number' || parent.type !== 'element') return;
      if (SKIP_PARENTS.has(parent.tagName)) return;

      const value = node.value;
      if (!value.includes('==') && !value.includes('||')) return;

      MARKER.lastIndex = 0;
      const children = [];
      let last = 0;
      let match;

      while ((match = MARKER.exec(value)) !== null) {
        if (match.index > last) {
          children.push({ type: 'text', value: value.slice(last, match.index) });
        }

        if (match[2]) {
          children.push({
            type: 'element',
            tagName: 'mark',
            properties: {},
            children: [{ type: 'text', value: match[2] }],
          });
        } else {
          children.push({
            type: 'element',
            tagName: 'span',
            properties: { className: ['spoiler'], tabIndex: 0 },
            children: [{ type: 'text', value: match[3] }],
          });
        }

        last = MARKER.lastIndex;
      }

      if (children.length === 0) return;
      if (last < value.length) {
        children.push({ type: 'text', value: value.slice(last) });
      }

      parent.children.splice(index, 1, ...children);
      return index + children.length;
    });
  };
}
