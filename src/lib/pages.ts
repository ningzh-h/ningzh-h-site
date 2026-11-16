import { getEntry, type CollectionEntry } from 'astro:content';

export type PageEntry = CollectionEntry<'pages'>;

/** 读取 content/pages 下的静态页面，例如 home、about。 */
export async function getPage(id: string): Promise<PageEntry> {
  const page = await getEntry('pages', id);
  if (!page) {
    throw new Error(`[pages] 找不到页面：src/content/pages/${id}.md`);
  }
  return page;
}
