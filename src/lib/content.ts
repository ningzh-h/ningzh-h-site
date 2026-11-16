import { getCollection, type CollectionEntry } from 'astro:content';
import { includeDraftsByDefault } from './drafts';
import { countWords, readingTime } from './format';
import { withBase } from './url';

export type BlogPost = CollectionEntry<'blog'>;
export type BookEntry = CollectionEntry<'notes'>;
export type BookStatus = string;

const collator = new Intl.Collator('zh-CN', { sensitivity: 'base', numeric: true });

export interface ChapterInfo {
  entry: BookEntry;
  /** 内容集合里的 id，例如 dart-notes/01-basics */
  id: string;
  /** URL 段，去掉数字前缀，例如 basics */
  slug: string;
  title: string;
  /** 章节所属目录，例如 dart-notes 或 数学散功重修记录/Level-1：基础篇/01-数学分析 */
  dirPath: string;
  draft: boolean;
  href: string;
  readingMinutes: number;
}

export interface NoteAncestor {
  title: string;
  href?: string;
}

/** 侧边栏最多展开几层子目录；更深的目录会以自身入口页为根打开。 */
export const NOTE_SIDEBAR_DEPTH = 2;

/** 笔记里的一个目录。有 index.md 的目录是入口页；没有 index.md 的目录只作为分组。 */
export interface NoteDir {
  path: string;
  name: string;
  title: string;
  description: string;
  href?: string;
  depth: number;
  index?: BookEntry;
  files: ChapterInfo[];
  dirs: NoteDir[];
  /** 这个目录下所有章节文件数（含子目录） */
  fileCount: number;
  /** 这个目录下所有页面数：章节文件 + 子目录 index */
  pageCount: number;
  wordCount: number;
  readingMinutes: number;
}

export interface BookInfo {
  /** 目录 path；顶层笔记也用它做唯一 id */
  slug: string;
  path: string;
  title: string;
  description: string;
  status: BookStatus;
  tags: string[];
  cover?: string;
  mode: 'single' | 'chapters';
  index: BookEntry;
  /** 这个目录下所有章节文件（递归），用于上下篇与计数 */
  chapters: ChapterInfo[];
  /** 当前目录的树 */
  tree: NoteDir;
  /** 从顶层笔记到当前目录父级的路径 */
  ancestors: NoteAncestor[];
  /** 直接父目录，顶层笔记没有 */
  parent?: NoteAncestor;
  pageCount: number;
  wordCount: number;
  readingMinutes: number;
  href: string;
}

export interface TagInfo {
  tag: string;
  count: number;
}

/* -------------------------------------------------------------------------- */
/* 通用文本处理                                                                */
/* -------------------------------------------------------------------------- */

/** 粗略去掉 Markdown 标记，用于搜索索引与字数统计。 */
export function stripMarkdown(markdown: string): string {
  return markdown
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/~~~[\s\S]*?~~~/g, ' ')
    .replace(/`[^`]*`/g, ' ')
    .replace(/!\[[^\]]*\]\([^)]*\)/g, ' ')
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/<[^>]+>/g, ' ')
    .replace(/^\s{0,3}#{1,6}\s+/gm, '')
    .replace(/^\s{0,3}>\s?/gm, '')
    .replace(/^\s*[-*+]\s+/gm, '')
    .replace(/^\s*\d+\.\s+/gm, '')
    .replace(/[*_~]{1,3}/g, '')
    .replace(/\|/g, ' ')
    .replace(/\$\$[\s\S]*?\$\$/g, ' ')
    .replace(/\$[^$\n]*\$/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function excerpt(text: string, length = 1500): string {
  const plain = stripMarkdown(text);
  return plain.length > length ? `${plain.slice(0, length)}…` : plain;
}

/* -------------------------------------------------------------------------- */
/* 博客                                                                        */
/* -------------------------------------------------------------------------- */

/** 已发布文章（草稿默认过滤），按日期倒序。 */
export async function getPosts(
  includeDrafts = includeDraftsByDefault,
): Promise<BlogPost[]> {
  const posts = await getCollection(
    'blog',
    ({ data }) =>
      (includeDrafts || !data.draft) &&
      data.date instanceof Date &&
      data.date.valueOf() > 0,
  );
  return posts.sort((a, b) => b.data.date.valueOf() - a.data.date.valueOf());
}

export async function getPost(
  id: string,
  includeDrafts = includeDraftsByDefault,
): Promise<BlogPost | undefined> {
  const posts = await getPosts(includeDrafts);
  return posts.find((post) => post.id === id);
}

/** 某篇文章的上一篇 / 下一篇（按时间正序的相邻关系）。 */
export function getPostNeighbors(
  posts: BlogPost[],
  id: string,
): { prev?: BlogPost; next?: BlogPost } {
  const ascending = [...posts].sort((a, b) => a.data.date.valueOf() - b.data.date.valueOf());
  const index = ascending.findIndex((post) => post.id === id);
  if (index === -1) return {};
  return {
    prev: index > 0 ? ascending[index - 1] : undefined,
    next: index < ascending.length - 1 ? ascending[index + 1] : undefined,
  };
}

export function getTags(posts: BlogPost[]): TagInfo[] {
  const counter = new Map<string, number>();
  for (const post of posts) {
    for (const tag of post.data.tags) {
      counter.set(tag, (counter.get(tag) ?? 0) + 1);
    }
  }
  return [...counter.entries()]
    .map(([tag, count]) => ({ tag, count }))
    .sort((a, b) => b.count - a.count || a.tag.localeCompare(b.tag, 'zh-CN'));
}

export function postHref(id: string): string {
  return withBase(`/blog/${id}/`);
}

export interface PostGroupInfo {
  group: string;
  label: string;
  count: number;
}

/** 博客文件所在子目录；直接放在 blog/ 下时返回 undefined。 */
export function postGroup(id: string): string | undefined {
  const parts = id.split('/');
  parts.pop();
  const group = parts.join('/');
  return group || undefined;
}

export function postGroupLabel(group: string): string {
  return group.split('/').pop() ?? group;
}

export function groupHref(group: string): string {
  return withBase(`/blog/groups/${group}/`);
}

export function getPostGroups(posts: BlogPost[]): PostGroupInfo[] {
  const counter = new Map<string, number>();
  for (const post of posts) {
    const group = postGroup(post.id);
    if (!group) continue;
    counter.set(group, (counter.get(group) ?? 0) + 1);
  }

  return [...counter.entries()]
    .map(([group, count]) => ({ group, label: postGroupLabel(group), count }))
    .sort((a, b) => a.label.localeCompare(b.label, 'zh-CN'));
}

export function readingMinutesOf(post: BlogPost): number {
  return readingTime(post.body ?? '');
}

/* -------------------------------------------------------------------------- */
/* 书籍                                                                        */
/* -------------------------------------------------------------------------- */

function chapterSlugFromName(name: string): string {
  return name.replace(/\.(md|mdx)$/i, '').replace(/^\d+[-_.]\s*/, '');
}

function orderFromName(name: string): number {
  const match = name.replace(/\.(md|mdx)$/i, '').match(/^(\d+)[-_.]/);
  return match ? Number(match[1]) : Number.POSITIVE_INFINITY;
}

function chapterTitle(entry: BookEntry, slug: string): string {
  return entry.data.title?.trim() || slug.replace(/[-_]/g, ' ').trim() || '未命名章节';
}

interface NoteRecord {
  entry: BookEntry;
  isIndex: boolean;
  dirPath: string;
  slug: string;
  order: number;
}

/** 从 entry 的物理路径得到 notes/ 下的相对路径。 */
function relativeNotePath(entry: BookEntry): string {
  const marker = 'src/content/notes/';
  const raw = (entry.filePath ?? entry.id).replace(/\\/g, '/');
  const markerIndex = raw.indexOf(marker);
  return (markerIndex >= 0 ? raw.slice(markerIndex + marker.length) : raw).replace(/^\.?\//, '');
}

function toNoteRecord(entry: BookEntry): NoteRecord {
  const rel = relativeNotePath(entry);
  const isIndex = /(^|\/)index\.(md|mdx)$/i.test(rel);
  const withoutExt = rel.replace(/\.(md|mdx)$/i, '');
  const dirPath = isIndex
    ? withoutExt.replace(/\/index$/i, '')
    : withoutExt.split('/').slice(0, -1).join('/');
  const name = withoutExt.split('/').pop() ?? withoutExt;

  return {
    entry,
    isIndex,
    dirPath,
    slug: chapterSlugFromName(name),
    order: orderFromName(name),
  };
}

function flattenFiles(dir: NoteDir): ChapterInfo[] {
  return [...dir.files, ...dir.dirs.flatMap((child) => flattenFiles(child))];
}

function ancestorsFor(path: string, dirs: Map<string, NoteDir>): NoteAncestor[] {
  const parts = path.split('/');
  const ancestors: NoteAncestor[] = [];
  for (let i = 1; i < parts.length; i += 1) {
    const ancestorPath = parts.slice(0, i).join('/');
    const ancestor = dirs.get(ancestorPath);
    if (ancestor) {
      ancestors.push({ title: ancestor.title, href: ancestor.href });
    }
  }
  return ancestors;
}

function makeBook(dir: NoteDir, dirs: Map<string, NoteDir>): BookInfo {
  if (!dir.index) {
    throw new Error(`[notes] 目录「${dir.path}」没有 index.md，不能作为入口页`);
  }

  const chapters = flattenFiles(dir);
  const ancestors = ancestorsFor(dir.path, dirs);
  // 最近的一个可点击祖先，作为“返回上一级”
  const parent = [...ancestors].reverse().find((ancestor) => ancestor.href);

  return {
    slug: dir.path,
    path: dir.path,
    title: dir.title,
    description: dir.description,
    status: dir.index.data.status ?? 'planned',
    tags: dir.index.data.tags,
    cover: dir.index.data.cover,
    mode: dir.files.length || dir.dirs.length ? 'chapters' : 'single',
    index: dir.index,
    chapters,
    tree: dir,
    ancestors,
    parent,
    pageCount: dir.pageCount,
    wordCount: dir.wordCount,
    readingMinutes: dir.readingMinutes,
    href: dir.href ?? withBase(`/notes/${dir.path}/`),
  };
}

async function loadNoteTree(includeDrafts: boolean): Promise<{
  top: NoteDir[];
  dirs: Map<string, NoteDir>;
}> {
  const entries = await getCollection('notes', ({ data }) => includeDrafts || !data.draft);
  const records = entries.map(toNoteRecord);
  const buckets = new Map<string, NoteRecord[]>();

  for (const record of records) {
    if (!record.dirPath) {
      throw new Error(
        `[notes] 文件必须放在笔记目录里：src/content/notes/<note>/...（当前：${record.entry.id}）`,
      );
    }
    const list = buckets.get(record.dirPath) ?? [];
    list.push(record);
    buckets.set(record.dirPath, list);
  }

  const dirs = new Map<string, NoteDir>();

  const ensureDir = (path: string): NoteDir => {
    const existing = dirs.get(path);
    if (existing) return existing;

    const name = path.split('/').pop() ?? path;
    const dir: NoteDir = {
      path,
      name,
      title: name,
      description: '',
      href: undefined,
      depth: path.split('/').length - 1,
      index: undefined,
      files: [],
      dirs: [],
      fileCount: 0,
      pageCount: 0,
      wordCount: 0,
      readingMinutes: 1,
    };
    dirs.set(path, dir);
    return dir;
  };

  // 即使某一层没有任何文件，也要为它建立目录节点（只作为分组）。
  for (const path of buckets.keys()) {
    const parts = path.split('/');
    for (let i = 1; i < parts.length; i += 1) {
      ensureDir(parts.slice(0, i).join('/'));
    }
  }

  for (const [path, items] of buckets) {
    const indexRecord = items.find((item) => item.isIndex);
    if (!indexRecord && !path.includes('/')) {
      throw new Error(
        `[notes] 顶层目录「${path}」需要 index.md 作为笔记入口（子目录可以没有 index.md，只作为分组）`,
      );
    }

    const name = path.split('/').pop() ?? path;
    const dir = ensureDir(path);
    dir.title = indexRecord?.entry.data.title?.trim() || name;
    dir.description = indexRecord?.entry.data.description ?? '';
    dir.href = indexRecord ? withBase(`/notes/${path}/`) : undefined;
    dir.index = indexRecord?.entry;
  }

  for (const dir of dirs.values()) {
    if (!dir.path.includes('/') && !dir.index) {
      throw new Error(
        `[notes] 顶层目录「${dir.path}」需要 index.md 作为笔记入口`,
      );
    }
  }

  for (const [path, items] of buckets) {
    const dir = dirs.get(path);
    if (!dir) continue;

    for (const record of items) {
      if (record.isIndex) continue;
      dir.files.push({
        entry: record.entry,
        id: record.entry.id,
        slug: record.slug,
        title: chapterTitle(record.entry, record.slug),
        dirPath: path,
        draft: record.entry.data.draft,
        href: withBase(`/notes/${path}/${record.slug}/`),
        readingMinutes: readingTime(record.entry.body ?? ''),
      });
    }
  }

  const top: NoteDir[] = [];

  for (const dir of dirs.values()) {
    const parentPath = dir.path.split('/').slice(0, -1).join('/');
    if (!parentPath) {
      top.push(dir);
      continue;
    }
    const parent = dirs.get(parentPath);
    if (!parent) {
      throw new Error(
        `[notes] 目录「${dir.path}」的父目录「${parentPath}」缺少 index.md`,
      );
    }
    parent.dirs.push(dir);
  }

  const sortFiles = (a: ChapterInfo, b: ChapterInfo) => {
    const orderA = orderFromName(a.slug);
    const orderB = orderFromName(b.slug);
    if (orderA !== orderB) return orderA - orderB;
    return collator.compare(a.title, b.title);
  };

  const sortDirs = (a: NoteDir, b: NoteDir) => {
    const orderA = orderFromName(a.name);
    const orderB = orderFromName(b.name);
    if (orderA !== orderB) return orderA - orderB;
    return collator.compare(a.title, b.title);
  };

  const computeTotals = (dir: NoteDir) => {
    let words = countWords(dir.index?.body ?? '');
    let minutes = readingTime(dir.index?.body ?? '');
    let fileCount = dir.files.length;
    let pageCount = dir.files.length;

    dir.files.sort(sortFiles);
    dir.dirs.sort(sortDirs);

    for (const child of dir.dirs) {
      computeTotals(child);
      words += child.wordCount;
      minutes += child.readingMinutes;
      fileCount += child.fileCount;
      pageCount += 1 + child.pageCount;
    }

    dir.wordCount = words;
    dir.readingMinutes = Math.max(1, Math.round(minutes));
    dir.fileCount = fileCount;
    dir.pageCount = pageCount;
  };

  for (const dir of top) computeTotals(dir);

  return { top, dirs };
}

/** 笔记列表只显示顶层笔记；每一层目录都通过 getNotePages 生成自己的入口页。 */
export async function getBooks(
  includeDrafts = includeDraftsByDefault,
): Promise<BookInfo[]> {
  const { top, dirs } = await loadNoteTree(includeDrafts);
  return top
    .map((dir) => makeBook(dir, dirs))
    .sort((a, b) => collator.compare(a.title, b.title));
}

export async function getBook(
  path: string,
  includeDrafts = includeDraftsByDefault,
): Promise<BookInfo | undefined> {
  const books = await getBooks(includeDrafts);
  return books.find((book) => book.slug === path);
}

export interface NotePage {
  path: string;
  book: BookInfo;
  chapter?: ChapterInfo;
  isIndex: boolean;
}

/**
 * 所有可访问的笔记页面：
 * - 每个带 index.md 的目录有一个入口页；
 * - 每个目录下的非 index 文件有一个章节页。
 */
export async function getNotePages(
  includeDrafts = includeDraftsByDefault,
): Promise<NotePage[]> {
  const { top, dirs } = await loadNoteTree(includeDrafts);
  const pages: NotePage[] = [];

  const walk = (dir: NoteDir, inheritedBook?: BookInfo) => {
    const book = dir.index ? makeBook(dir, dirs) : inheritedBook;

    if (dir.index && book) {
      pages.push({ path: dir.path, book, isIndex: true });
    }

    if (book) {
      for (const file of dir.files) {
        pages.push({
          path: `${dir.path}/${file.slug}`,
          book,
          chapter: file,
          isIndex: false,
        });
      }
    }

    for (const child of dir.dirs) walk(child, book);
  };

  for (const dir of top) walk(dir);
  return pages;
}

/** 章节在书中的上一篇 / 下一篇。 */
export function getChapterNeighbors(
  book: BookInfo,
  chapter?: ChapterInfo,
): { prev?: ChapterInfo; next?: ChapterInfo } {
  if (!chapter) {
    return { next: book.chapters[0] };
  }
  const index = book.chapters.findIndex((item) => item.id === chapter.id);
  if (index === -1) return {};
  return {
    prev: index > 0 ? book.chapters[index - 1] : undefined,
    next: index < book.chapters.length - 1 ? book.chapters[index + 1] : undefined,
  };
}
