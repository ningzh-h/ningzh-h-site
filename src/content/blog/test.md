---
title: 排版与语法测试
description: 一个用来测试全站 Markdown 语法、frontmatter 字段和交互组件的示例文件。
date: 2026-11-16
updated: 2026-11-16
tags: [Markdown, 测试, 排版]
featured: false
cover: /logo-v1.svg
draft: false
---

这是一篇用来测试排版的文章。下面所有内容都可以直接复制到自己的文章里。

## 文字样式

普通正文，**加粗**，*斜体*，~~删除线~~，`行内代码`。

高亮：==这是高亮文字==。

剧透：这个角色 ||其实没有死||，把鼠标移上去才会显示。

[站内链接](/notes/) 和 [站外链接](https://example.com)。

![示例图片](/logo-v1.svg)

## 列表

- 无序列表
- 第二项
  - 嵌套项
  - 另一个嵌套项

1. 有序列表
2. 第二项
3. 第三项

- [x] 已经完成
- [ ] 还没完成

## 引用与分隔线

> 一级引用。
>
> > 嵌套引用。
>
> 引用里的 **加粗** 和 $a^2+b^2=c^2$。

上面是一段。

---

下面是分隔线之后的内容。

## 表格

| 语法 | 写法 | 效果 |
| --- | --- | --- |
| 高亮 | `==文字==` | ==文字== |
| 剧透 | `\|\|文字\|\|` | \|\|黑块\|\| |
| 折叠 | `:::toggle[标题]` | 可展开 |

## 代码

```dart
Future<void> main() async {
  final value = await Future.value(42);
  print(value);
}
```

```bash
npm run dev
```

## 数学

行内公式：$E \subseteq \mathbb{R}$，$\sup E$，$\inf E$。

块级公式：

$$
\sup E = -\inf(-E)
$$

## 折叠块

:::toggle[公式 $a^2+b^2=c^2$ 点开看看]

这里是 **Markdown**，可以放列表、代码和公式。

- 第一项
- 第二项

$$
a^2 + b^2 = c^2
$$

:::

:::toggle[默认展开]{open}
这个块默认是展开的。
:::

> :::toggle[引用里的折叠块]
> 折叠块也可以放在引用里。
> :::

## 脚注

这里有一个脚注[^1]。

[^1]: 这是脚注内容。

## 标题层级

### 三级标题

#### 四级标题

##### 五级标题

###### 六级标题

---

## 复制用模板

```yaml
---
title: 文章标题
description: 一句话摘要
date: 2026-11-16
updated: 2026-11-16
tags: [标签一, 标签二]
featured: false
cover: /logo-v1.svg
draft: false
---
```

正文从这里开始。
