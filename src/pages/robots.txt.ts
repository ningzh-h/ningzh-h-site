import type { APIRoute } from 'astro';
import { withBase } from '../lib/url';

export const prerender = true;

export const GET: APIRoute = ({ site }) => {
  const origin = site ?? new URL('https://example.com');
  const sitemap = new URL(withBase('/sitemap-index.xml'), origin).toString();
  const body = ['User-agent: *', 'Allow: /', '', `Sitemap: ${sitemap}`, ''].join('\n');

  return new Response(body, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
};
