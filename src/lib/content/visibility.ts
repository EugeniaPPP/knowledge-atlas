/** Local editorial editions stay outside the ordinary release build. */
export function chapterVisible(chapter: { reviewOnly?: boolean }, reviewEnabled: boolean): boolean {
  return !chapter.reviewOnly || reviewEnabled;
}
