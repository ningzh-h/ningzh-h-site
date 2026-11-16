/**
 * 统一处理站内链接的 base 前缀。
 * GitHub Pages 项目站点部署在 /<repo>/ 下时，所有站内链接都必须带前缀。
 */

/** 给站内路径加上 base，外部链接原样返回。 */
export function withBase(path = '/'): string {
  if (/^[a-z][a-z0-9+.-]*:/i.test(path) || path.startsWith('//')) return path;
  const base = import.meta.env.BASE_URL || '/';
  const prefix = base.endsWith('/') ? base.slice(0, -1) : base;
  const suffix = path.startsWith('/') ? path : `/${path}`;
  const result = `${prefix}${suffix}`;
  return result || '/';
}

/** 当前路径去掉 base 后的部分，用于导航高亮。 */
export function pathWithoutBase(pathname: string): string {
  const base = import.meta.env.BASE_URL || '/';
  const prefix = base.endsWith('/') ? base.slice(0, -1) : base;
  if (prefix && pathname.startsWith(prefix)) {
    const rest = pathname.slice(prefix.length);
    return rest.startsWith('/') ? rest : `/${rest}`;
  }
  return pathname;
}

/** 导航项是否处于激活状态。 */
export function isActivePath(pathname: string, match: string): boolean {
  const current = pathWithoutBase(pathname);
  if (match === '/') return current === '/';
  return current === match || current.startsWith(`${match}/`);
}

/** 把站内路径变成绝对 URL（用于 RSS / sitemap / canonical）。 */
export function absoluteUrl(path: string, site: URL | undefined): string {
  const target = withBase(path);
  return new URL(target, site ?? new URL('https://example.com')).toString();
}
