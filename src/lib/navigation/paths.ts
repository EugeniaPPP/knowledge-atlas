/** App-local paths include Astro's deployment base; external and relative URLs stay at their call sites. */
import type { Locale } from '../content/schema';
export function sitePath(path = '', locale: Locale = 'ru'): string {
  const base = import.meta.env.BASE_URL.replace(/\/$/, '');
  return `${base}/${locale === 'en' ? 'en/' : ''}${path.replace(/^\/+/, '')}`;
}

export function languagePath(pathname: string, locale: Locale): string {
  const base = import.meta.env.BASE_URL.replace(/\/$/, '');
  const path = pathname.slice(base.length).replace(/^\/en(?=\/|$)/, '');
  return sitePath(path, locale);
}
