import { allChapters } from '../../content/chapter-fixtures';

/** Expected catalog coverage comes from editorial metadata, rather than a fixed lesson count. */
export function catalogCounts(locale: 'ru' | 'en') {
  const chapters = allChapters.filter((chapter) => chapter.courseId === 'yale-econ-159' && chapter.availableLocales.includes(locale) && (!chapter.reviewOnly || process.env.ATLAS_REVIEW === '1'));
  return { available: chapters.length, concepts: new Set(chapters.flatMap((chapter) => chapter.conceptIds)).size };
}
