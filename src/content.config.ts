import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

const tags = z
  .array(z.string())
  .default([])
  .transform((items) => items.map((item) => item.trim()).filter(Boolean));

/** 随笔 / 技术文章：只放博客，不放书影音。 */
const blog = defineCollection({
  loader: glob({ base: './src/content/blog', pattern: '**/*.{md,mdx}' }),
  schema: z.object({
    title: z.string(),
    description: z.string().default(''),
    // 空日期用 1970 兜底，避免一份草稿/测试文件让整站构建失败
    date: z.coerce.date().catch(new Date(0)),
    updated: z.coerce.date().optional(),
    tags,
    featured: z.boolean().default(false),
    cover: z.string().optional(),
    draft: z.boolean().default(false),
  }),
});

/** 学习笔记：一篇笔记一个目录，index.md + 章节。 */
const notes = defineCollection({
  loader: glob({ base: './src/content/notes', pattern: '**/*.{md,mdx}' }),
  schema: z.object({
    title: z.string().optional(),
    description: z.string().default(''),
    status: z.string().default('planned'),
    tags,
    cover: z.string().optional(),
    mode: z.enum(['auto', 'single', 'chapters']).default('auto'),
    draft: z.boolean().default(false),
  }),
});

/**
 * 书影音 / 娱乐：目录名就是分类。
 *   recreation/books/*.md
 *   recreation/anime/*.md
 *   recreation/manga/*.md
 *   recreation/film/*.md（以后）
 */
const recreation = defineCollection({
  loader: glob({ base: './src/content/recreation', pattern: '**/*.{md,mdx}' }),
  schema: z.object({
    title: z.string(),
    description: z.string().default(''),
    date: z.coerce.date(),
    creator: z.string().optional(),
    rating: z.number().min(1).max(5).optional(),
    status: z.string().default('done'),
    link: z.url().optional(),
    tags,
    cover: z.string().optional(),
    draft: z.boolean().default(false),
  }),
});

/** 卡片：一篇文章就是一个短卡片，可以放在子目录里分组。 */
const cards = defineCollection({
  loader: glob({ base: './src/content/cards', pattern: '**/*.{md,mdx}' }),
  schema: z.object({
    title: z.string().optional(),
    date: z.coerce.date().optional(),
    tags,
    draft: z.boolean().default(false),
  }),
});

/** 静态页面：首页、关于页。文案都写在这里。 */
const pages = defineCollection({
  loader: glob({ base: './src/content/pages', pattern: '**/*.{md,mdx}' }),
  schema: z.object({
    title: z.string(),
    description: z.string().default(''),
    status: z.string().default(''),
    avatar: z.string().optional(),
    photos: z
      .array(
        z.object({
          src: z.string(),
          alt: z.string().default(''),
          caption: z.string().optional(),
        }),
      )
      .default([]),
    sections: z
      .array(z.enum(['stats', 'notes', 'posts', 'cards', 'shelf']))
      .default(['stats', 'notes', 'posts', 'cards', 'shelf']),
    draft: z.boolean().default(false),
  }),
});

export const collections = { blog, notes, recreation, cards, pages };
