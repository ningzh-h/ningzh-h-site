# 内容目录

这里放站点内容。每类内容的字段和写法见 [写作与内容规范](../docs/写作与内容规范.md)。

| 目录 | 放什么 | 入口 |
| --- | --- | --- |
| `blog/` | 博客文章，可建子目录分组 | `/blog/` |
| `notes/` | 任意层级笔记，`index.md` 是每层入口 | `/notes/` |
| `recreation/` | 书影音，分类 + 文件夹分组 | `/shelf/` |
| `cards/` | 短文本卡片 | `/cards/` |
| `pages/` | 首页、关于页 | `/`、`/about/` |

每个模块都带一组演示文件：

| 模块 | 演示 | 模板 |
| --- | --- | --- |
| 博客 | `blog/test.md` | `blog/empty.md`（draft） |
| 笔记 | `notes/test/` | `notes/empty/`（draft） |
| 书影音 | `recreation/anime/01-测试分组/test.md` | 同目录 `empty.md`（draft） |
| 卡片 | `cards/test.md` | `cards/empty.md`（draft） |

演示文件会出现在页面上，模板文件是 `draft: true`，不会显示。复制模板、改 `title` 和 `draft` 即可开始写。
