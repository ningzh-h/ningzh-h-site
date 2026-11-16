import rss from '@astrojs/rss';
import type { APIRoute } from 'astro';
import { getPosts, postHref } from '../lib/content';
import { siteConfig } from '../site.config';

export const prerender = true;

export const GET: APIRoute = async (context) => {
  const posts = await getPosts();

  return rss({
    title: siteConfig.title,
    description: siteConfig.description,
    site: context.site ?? 'https://example.com',
    items: posts.map((post) => ({
      title: post.data.title,
      pubDate: post.data.date,
      description: post.data.description,
      link: postHref(post.id),
      categories: post.data.tags,
    })),
    customData: '<language>zh-CN</language>',
  });
};
