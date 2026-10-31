import { getCollection } from 'astro:content';
import type { Locale } from './schema';
import { translateChapter } from './translations';

export async function localizedChapters(locale: Locale) {
  const chapters = (await getCollection('chapters')).filter(({ data }) => data.availableLocales.includes(locale));
  if (locale === 'ru') return chapters.map(({ data }) => data);
  const translations = await getCollection('translations');
  return chapters.map(({ data }) => {
    const copy = translations.find((t) => t.data.chapterId === data.id && t.data.locale === locale)?.data;
    if (!copy) throw new Error(`Missing ${locale} chapter: ${data.id}`);
    return translateChapter(data, copy);
  });
}
export async function lessonPaths(locale: Locale) {
  const chapters = await localizedChapters(locale), lessons = await getCollection('lessons');
  return chapters.flatMap((chapter) => {
    const entries = lessons.filter((entry) => entry.data.chapterId === chapter.id && entry.data.locale === locale);
    if (entries.length !== 3 || new Set(entries.map((entry) => entry.data.mode)).size !== 3) throw new Error(`Three modes required: ${chapter.id}/${locale}`);
    return entries.map((entry) => ({ params: { course: chapter.courseId, chapter: chapter.slug, mode: entry.data.mode }, props: { chapter, mode: entry.data.mode, locale, entry } }));
  });
}
export async function coursePaths(locale: Locale) { return (await getCollection('courses')).map(({ data: course }) => ({ params: { course: course.id }, props: { course, locale } })); }
export async function conceptPaths(locale: Locale) { return (await getCollection('concepts')).filter(({ data }) => data.locale === locale).map((entry) => ({ params: { concept: entry.data.id }, props: { entry, locale } })); }

export async function availableLanguagesForPath(path: string): Promise<Locale[]> {
  const lesson = path.match(/\/courses\/([^/]+)\/([^/]+)\/(?:quick|core|mastery)\//);
  if (lesson) return (await getCollection('chapters')).find(({ data }) => data.courseId === lesson[1] && data.slug === lesson[2])?.data.availableLocales || [];
  const concept = path.match(/\/concepts\/([^/]+)\//);
  if (concept) return (await getCollection('concepts')).filter(({ data }) => data.id === concept[1]).map(({ data }) => data.locale);
  return ['ru', 'en'];
}
