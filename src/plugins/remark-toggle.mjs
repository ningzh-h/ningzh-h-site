import { visit } from 'unist-util-visit';

/**
 * 把 `:::toggle[标题]` 容器转换成 <details><summary>。
 *
 *   :::toggle[点开看看]
 *   这里是 **Markdown**。
 *   :::
 *
 * 标题本身保留为 Markdown 节点，所以 `$公式$`、`**加粗**` 都能正常渲染。
 */
export default function remarkToggle() {
  return (tree) => {
    visit(tree, 'containerDirective', (node, index, parent) => {
      if (!parent || typeof index !== 'number' || node.name !== 'toggle') return;

      const children = [...node.children];
      let labelChildren = [];

      const labelIndex = children.findIndex((child) => child.data?.directiveLabel);
      if (labelIndex >= 0) {
        const labelNode = children[labelIndex];
        labelChildren = labelNode.children ?? [];
        children.splice(labelIndex, 1);
      }

      const open = Object.prototype.hasOwnProperty.call(node.attributes ?? {}, 'open');
      const openAttribute = open ? ' open' : '';

      const summary = {
        type: 'paragraph',
        data: { hName: 'summary' },
        children:
          labelChildren.length > 0
            ? labelChildren
            : [{ type: 'text', value: '展开' }],
      };

      parent.children.splice(
        index,
        1,
        {
          type: 'html',
          value: `<details class="notion-toggle"${openAttribute}>`,
        },
        summary,
        ...children,
        { type: 'html', value: '</details>' },
      );

      return index + children.length + 2;
    });
  };
}
