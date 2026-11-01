// One native drawer has two views; switching to sources never opens a second modal.
export function setupCourseDrawer(dialog: HTMLDialogElement) {
  const contents = dialog.querySelector<HTMLElement>('[data-course-view="contents"]')!;
  const sources = dialog.querySelector<HTMLElement>('[data-course-view="sources"]');
  const sourceButton = dialog.querySelector<HTMLButtonElement>('[data-show-sources]');
  let contentsScrollTop = 0;

  function show(view: 'contents' | 'sources') {
    const showSources = view === 'sources' && !!sources;
    if (showSources && !contents.hidden) contentsScrollTop = dialog.scrollTop;
    contents.hidden = showSources;
    if (sources) sources.hidden = !showSources;
    dialog.setAttribute('aria-labelledby', showSources ? 'sources-heading' : 'course-drawer-heading');
    dialog.scrollTop = showSources ? 0 : contentsScrollTop;
  }
  sourceButton?.addEventListener('click', () => {
    show('sources'); sources?.querySelector<HTMLButtonElement>('.dialog-close')?.focus({ preventScroll: true });
  });
  dialog.querySelector('[data-course-back]')?.addEventListener('click', () => {
    show('contents'); sourceButton?.focus({ preventScroll: true });
  });

  return (view: 'contents' | 'sources') => {
    show(view);
    const visibleView = contents.hidden ? sources! : contents;
    visibleView.querySelector<HTMLButtonElement>('.dialog-close')?.focus({ preventScroll: true });
    if (!contents.hidden) {
      const chapter = contents.querySelector<HTMLDetailsElement>('[data-current-chapter]');
      if (chapter) chapter.open = true;
      requestAnimationFrame(() => {
        const current = chapter?.querySelector('[data-step-link][aria-current]') || chapter?.querySelector('summary');
        current?.scrollIntoView({ block: 'nearest', behavior: 'instant' });
      });
    }
  };
}
