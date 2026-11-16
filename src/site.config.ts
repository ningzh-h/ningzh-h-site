/**
 * 站点信息集中配置。
 * 昵称、头像、导航、社交链接这类“身份信息”放这里；
 * 首页正文、关于页、照片都放在 src/content/pages/ 下。
 */
export interface SocialLink {
  label: string;
  href: string;
  icon: 'github' | 'mail' | 'rss' | 'bilibili' | 'douban' | 'link';
}

export interface NavItem {
  label: string;
  href: string;
  match: string;
}

export const siteConfig = {
  /** 站点短名，用于页脚、首页称呼、RSS；建议用网名 */
  name: '种下大雪',
  /** 浏览器标题 */
  title: '种下大雪',
  /** 默认 description（留空也可以，各页面会覆盖） */
  description: '',
  /** 头像：可以是 /avatar.svg，也可以是 /images/home/xxx.jpg */
  avatar: '/avatar.svg',
  /** 页脚与关于页的社交链接 */
  socials: [
    { label: 'GitHub', href: 'https://github.com/ningzh-h', icon: 'github' },
    { label: 'RSS', href: '/rss.xml', icon: 'rss' },
  ] as SocialLink[],
  /** 顶栏导航 */
  nav: [
    { label: '首页', href: '/', match: '/' },
    { label: '博客', href: '/blog/', match: '/blog' },
    { label: '笔记', href: '/notes/', match: '/notes' },
    { label: '书影音', href: '/shelf/', match: '/shelf' },
    { label: '卡片', href: '/cards/', match: '/cards' },
    { label: '关于', href: '/about/', match: '/about' },
  ] as NavItem[],
  /** 各列表页的标题和说明；{count} 等占位符会在页面里替换 */
  copy: {
    blog: {
      eyebrow: 'Writing',
      title: '博客',
      lede: '共 {count} 篇。',
    },
    notes: {
      eyebrow: 'Notes',
      title: '笔记',
      lede: '共 {count} 本，{reading} 本在读。',
    },
    shelf: {
      eyebrow: 'Shelf',
      title: '书影音',
      lede: '每个分类里按首字母排序。目前共 {count} 条。',
    },
    cards: {
      eyebrow: 'Cards',
      title: '卡片',
      lede: '目前共 {count} 张。',
    },
    stats: {
      posts: '篇文章',
      notes: '篇笔记',
      recreation: '条书影音',
      cards: '张卡片',
      words: '字',
    },
  },
  /** 首页置顶笔记（对应 src/content/notes 下的目录名） */
  pinnedBooks: ['dart-notes', 'vim-notes'],
  /** 页脚版权起始年份 */
  since: 2026,
} as const;

export type SiteConfig = typeof siteConfig;
