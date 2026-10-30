/** App-local paths include Astro's deployment base; external and relative URLs stay at their call sites. */
export function sitePath(path = ''): string {
  const base = import.meta.env.BASE_URL.replace(/\/$/, '');
  return `${base}/${path.replace(/^\/+/, '')}`;
}
