import { getCollection, type CollectionEntry } from 'astro:content';
import { pinyin } from 'pinyin-pro';
import { includeDraftsByDefault } from './drafts';
import { withBase } from './url';

export type RecreationEntry = CollectionEntry<'recreation'>;

export interface RecreationItem {
  entry: RecreationEntry;
  /** 集合 id，例如 anime/01-神作/jojo */
  id: string;
  category: string;
  categoryLabel: string;
  /** 分类目录之后的完整 URL 段，例如 01-神作/jojo */
  slug: string;
  /** 分类目录之后的文件夹路径，例如 01-神作；直接放在分类下为空 */
  groupPath: string;
  groupLabel: string;
  title: string;
  description: string;
  date: Date;
  creator?: string;
  rating?: number;
  status: string;
  tags: string[];
  href: string;
  initial: string;
  coverB: string;
}

export interface RecreationGroupNode {
  path: string;
  label: string;
  items: RecreationItem[];
  intro?: RecreationEntry;
}

export interface RecreationCategory {
  key: string;
  label: string;
  description: string;
  href: string;
  coverB: string;
  items: RecreationItem[];
  groups: RecreationGroupNode[];
  initials: string[];
  intro?: RecreationEntry;
}

export interface RecreationGroup {
  letter: string;
  items: RecreationItem[];
}

interface CategoryMeta {
  label: string;
  description: string;
  coverB: string;
}

const CATEGORY_META: Record<string, CategoryMeta> = {
  books: { label: '书籍', description: '读过的书，和一些论文。', coverB: '#1f2a3a' },
  anime: { label: '动画', description: '看过的动画。', coverB: '#2c3742' },
  manga: { label: '漫画', description: '看过的漫画。', coverB: '#2f2744' },
  film: { label: '电影', description: '看过并想记下来的电影。', coverB: '#2f2720' },
  game: { label: '游戏', description: '玩过并想记下来的游戏。', coverB: '#2b2433' },
};

const CATEGORY_ORDER = ['books', 'anime', 'manga', 'film', 'game'];

const collator = new Intl.Collator('zh-CN', { sensitivity: 'base', numeric: true });

function metaFor(key: string): CategoryMeta {
  return (
    CATEGORY_META[key] ?? {
      label: key,
      description: `「${key}」分类。`,
      coverB: '#2c3742',
    }
  );
}

/** 去掉数字前缀，用于文件夹显示名。 */
function labelFromName(name: string): string {
  return name.replace(/^\d+[-_.]\s*/, '');
}

function orderFromName(name: string): number {
  const match = name.match(/^(\d+)[-_.]/);
  return match ? Number(match[1]) : Number.POSITIVE_INFINITY;
}

/** 去掉书名号、引号等前缀，取拼音首字母 / 拉丁首字母 / #。 */
export function initialOf(title: string): string {
  const cleaned = title.replace(/^[\s《〈“"‘'「『（(【\[]+/, '');
  const first = Array.from(cleaned)[0];
  if (!first) return '#';
  if (/[a-zA-Z]/.test(first)) return first.toUpperCase();
  if (!/[\u3400-\u9fff]/.test(first)) return '#';

  const [initial] = pinyin(first, {
    pattern: 'first',
    toneType: 'none',
    type: 'array',
  });
  const letter = (initial ?? '').toUpperCase();
  return /^[A-Z]$/.test(letter) ? letter : '#';
}

function sortLetter(a: string, b: string): number {
  if (a === '#') return 1;
  if (b === '#') return -1;
  return a.localeCompare(b);
}

export function shelfAnchor(letter: string): string {
  return `letter-${letter === '#' ? 'other' : letter}`;
}

export function shelfGroupAnchor(path: string): string {
  const key = path
    .split('/')
    .map(labelFromName)
    .join('-')
    .replace(/[^\p{L}\p{N}-]+/gu, '-')
    .replace(/-+/g, '-');
  return `group-${key || 'all'}`;
}

function relativeRecreationPath(entry: RecreationEntry): string {
  const marker = 'src/content/recreation/';
  const raw = (entry.filePath ?? entry.id).replace(/\\/g, '/');
  const markerIndex = raw.indexOf(marker);
  return (markerIndex >= 0 ? raw.slice(markerIndex + marker.length) : raw).replace(/^\.?\//, '');
}

function isIndexEntry(entry: RecreationEntry): boolean {
  return /(^|\/)index\.(md|mdx)$/i.test(relativeRecreationPath(entry));
}

/** 读取书影音条目；category/index.md 是分类介绍，不会被当成条目。 */
export async function getRecreationEntries(
  includeDrafts = includeDraftsByDefault,
): Promise<RecreationItem[]> {
  const entries = await getCollection(
    'recreation',
    ({ data }) => includeDrafts || !data.draft,
  );

  return entries
    .filter((entry) => !isIndexEntry(entry))
    .map((entry) => {
      const rel = relativeRecreationPath(entry);
      const withoutExt = rel.replace(/\.(md|mdx)$/i, '');
      const parts = withoutExt.split('/');
      const category = parts.shift();
      const slug = parts.join('/');

      if (!category || !slug) {
        throw new Error(
          `[recreation] 条目必须放在分类目录下：src/content/recreation/<category>/...（当前：${entry.id}）`,
        );
      }

      const meta = metaFor(category);
      const title = entry.data.title;
      const groupPath = parts.slice(0, -1).join('/');

      return {
        entry,
        id: entry.id,
        category,
        categoryLabel: meta.label,
        slug,
        groupPath,
        groupLabel: groupPath
          ? groupPath.split('/').map(labelFromName).join(' / ')
          : '全部',
        title,
        description: entry.data.description,
        date: entry.data.date,
        creator: entry.data.creator,
        rating: entry.data.rating,
        status: entry.data.status,
        tags: entry.data.tags,
        href: withBase(`/shelf/${category}/${slug}/`),
        initial: initialOf(title),
        coverB: meta.coverB,
      } satisfies RecreationItem;
    })
    .sort((a, b) => b.date.valueOf() - a.date.valueOf());
}

/** 分类入口 / 分组入口的 index.md。key 形如 anime 或 anime/01-神作。 */
export async function getRecreationIntros(
  includeDrafts = includeDraftsByDefault,
): Promise<Map<string, RecreationEntry>> {
  const entries = await getCollection(
    'recreation',
    ({ data }) => includeDrafts || !data.draft,
  );
  const intros = new Map<string, RecreationEntry>();

  for (const entry of entries) {
    if (!isIndexEntry(entry)) continue;
    const rel = relativeRecreationPath(entry).replace(/\.(md|mdx)$/i, '');
    const key = rel.replace(/\/index$/i, '');
    intros.set(key, entry);
  }

  return intros;
}

function sortCategoryKeys(a: string, b: string): number {
  const ai = CATEGORY_ORDER.indexOf(a);
  const bi = CATEGORY_ORDER.indexOf(b);
  if (ai !== -1 || bi !== -1) {
    return (ai === -1 ? 999 : ai) - (bi === -1 ? 999 : bi);
  }
  return a.localeCompare(b);
}

function compareGroupPath(a: string, b: string): number {
  if (!a) return -1;
  if (!b) return 1;
  const aFirst = a.split('/')[0] ?? a;
  const bFirst = b.split('/')[0] ?? b;
  const orderA = orderFromName(aFirst);
  const orderB = orderFromName(bFirst);
  if (orderA !== orderB) return orderA - orderB;
  return collator.compare(a, b);
}

/** 把条目按分类、再按文件夹分组；每组内按标题拼音排序。 */
export function groupRecreation(
  items: RecreationItem[],
  intros: Map<string, RecreationEntry> = new Map(),
): RecreationCategory[] {
  const grouped = new Map<string, RecreationItem[]>();

  for (const item of items) {
    const list = grouped.get(item.category) ?? [];
    list.push(item);
    grouped.set(item.category, list);
  }

  return [...grouped.entries()]
    .sort(([a], [b]) => sortCategoryKeys(a, b))
    .map(([key, list]) => {
      const meta = metaFor(key);
      const groupMap = new Map<string, RecreationItem[]>();
      for (const item of list) {
        const group = groupMap.get(item.groupPath) ?? [];
        group.push(item);
        groupMap.set(item.groupPath, group);
      }

      const groups: RecreationGroupNode[] = [...groupMap.entries()]
        .sort(([a], [b]) => compareGroupPath(a, b))
        .map(([path, groupItems]) => ({
          path,
          label: path ? path.split('/').map(labelFromName).join(' / ') : '全部',
          items: [...groupItems].sort((a, b) => collator.compare(a.title, b.title)),
          intro: path ? intros.get(`${key}/${path}`) : undefined,
        }));

      const sorted = [...list].sort((a, b) => collator.compare(a.title, b.title));
      const initials = [...new Set(sorted.map((item) => item.initial))].sort(sortLetter);

      return {
        key,
        label: meta.label,
        description: meta.description,
        href: withBase(`/shelf/${key}/`),
        coverB: meta.coverB,
        items: sorted,
        groups,
        initials,
        intro: intros.get(key),
      } satisfies RecreationCategory;
    });
}

/** 按首字母分组，A–Z 升序，# 放最后。 */
export function groupRecreationByInitial(items: RecreationItem[]): RecreationGroup[] {
  const grouped = new Map<string, RecreationItem[]>();

  for (const item of items) {
    const list = grouped.get(item.initial) ?? [];
    list.push(item);
    grouped.set(item.initial, list);
  }

  return [...grouped.entries()]
    .sort(([a], [b]) => sortLetter(a, b))
    .map(([letter, list]) => ({ letter, items: list }));
}

/** 同一个分类内的上一篇 / 下一篇（按时间排序）。 */
export function getRecreationNeighbors(
  category: RecreationCategory,
  slug: string,
): { prev?: RecreationItem; next?: RecreationItem } {
  const ascending = [...category.items].sort(
    (a, b) => a.date.valueOf() - b.date.valueOf(),
  );
  const index = ascending.findIndex((item) => item.slug === slug);
  if (index === -1) return {};
  return {
    prev: index > 0 ? ascending[index - 1] : undefined,
    next: index < ascending.length - 1 ? ascending[index + 1] : undefined,
  };
}
