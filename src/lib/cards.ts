import { getCollection, type CollectionEntry } from 'astro:content';
import { excerpt, stripMarkdown } from './content';
import { includeDraftsByDefault } from './drafts';
import { withBase } from './url';

export type CardEntry = CollectionEntry<'cards'>;

export interface CardItem {
  entry: CardEntry;
  id: string;
  /** 子目录分组；直接放在 cards/ 下时为 undefined */
  group?: string;
  title: string;
  date?: Date;
  tags: string[];
  href: string;
  excerpt: string;
}

function firstLine(body: string): string {
  const line =
    body
      .split(/\r?\n/)
      .map((item) => item.trim())
      .find((item) => item.length > 0) ?? '';

  const plain = stripMarkdown(line.replace(/^#{1,6}\s+/, '')).trim();
  if (!plain) return '未命名卡片';
  return plain.length > 36 ? `${plain.slice(0, 36)}…` : plain;
}

function buildCardContent(entry: CardEntry): { title: string; excerpt: string } {
  const body = entry.body ?? '';
  const lines = body.split(/\r?\n/);

  if (entry.data.title) {
    return { title: entry.data.title, excerpt: excerpt(body, 180) };
  }

  const firstIndex = lines.findIndex((line) => line.trim().length > 0);
  const title = firstLine(body);
  if (firstIndex >= 0) lines.splice(firstIndex, 1);
  const rest = lines.join('\n').trim();

  return {
    title,
    excerpt: excerpt(rest || body, 180),
  };
}

/** 读取卡片，按日期倒序；没有日期的排最后。 */
export async function getCards(
  includeDrafts = includeDraftsByDefault,
): Promise<CardItem[]> {
  const entries = await getCollection(
    'cards',
    ({ data }) => includeDrafts || !data.draft,
  );

  return entries
    .map((entry) => {
      const parts = entry.id.split('/');
      parts.pop();
      const group = parts.join('/') || undefined;
      const content = buildCardContent(entry);

      return {
        entry,
        id: entry.id,
        group,
        title: content.title,
        date: entry.data.date,
        tags: entry.data.tags,
        href: withBase(`/cards/${entry.id}/`),
        excerpt: content.excerpt,
      } satisfies CardItem;
    })
    .sort((a, b) => (b.date?.valueOf() ?? 0) - (a.date?.valueOf() ?? 0));
}
