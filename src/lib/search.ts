import { excerpt, getBooks, getPosts, postHref } from './content';
import { getCards } from './cards';
import { getRecreationEntries } from './recreation';
import { withBase } from './url';

export type SearchItemType = 'post' | 'note' | 'chapter' | 'recreation' | 'card' | 'page';

export interface SearchItem {
  title: string;
  url: string;
  description: string;
  tags: string[];
  type: SearchItemType;
  text: string;
}

/**
 * 构建时生成 /search-index.json。
 * 正文截断到 1500 字，避免索引体积膨胀；客户端打开搜索框时才加载。
 */
export async function buildSearchIndex(): Promise<SearchItem[]> {
  const [posts, notes, recreation, cards] = await Promise.all([
    getPosts(),
    getBooks(),
    getRecreationEntries(),
    getCards(),
  ]);
  const items: SearchItem[] = [];

  for (const post of posts) {
    items.push({
      title: post.data.title,
      url: postHref(post.id),
      description: post.data.description,
      tags: post.data.tags,
      type: 'post',
      text: excerpt(post.body ?? ''),
    });
  }

  for (const note of notes) {
    items.push({
      title: note.title,
      url: note.href,
      description: note.description,
      tags: note.tags,
      type: 'note',
      text: excerpt(note.index.body ?? ''),
    });

    if (note.mode === 'single') continue;

    for (const chapter of note.chapters) {
      items.push({
        title: `${note.title} · ${chapter.title}`,
        url: chapter.href,
        description: note.description,
        tags: note.tags,
        type: 'chapter',
        text: excerpt(chapter.entry.body ?? ''),
      });
    }
  }

  for (const item of recreation) {
    items.push({
      title: item.title,
      url: item.href,
      description: item.description,
      tags: item.tags,
      type: 'recreation',
      text: excerpt(item.entry.body ?? ''),
    });
  }

  for (const card of cards) {
    items.push({
      title: card.title,
      url: card.href,
      description: card.excerpt.slice(0, 120),
      tags: card.tags,
      type: 'card',
      text: excerpt(card.entry.body ?? '', 1000),
    });
  }

  items.push({
    title: '关于这个站点',
    url: withBase('/about/'),
    description: '站点、作者与联系方式。',
    tags: ['关于'],
    type: 'page',
    text: '关于这个站点。作者的学习方向、写作习惯与联系方式。',
  });

  return items;
}
