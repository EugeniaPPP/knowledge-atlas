import { getUI, format } from '../i18n/ui';
import { getStore } from '../lib/learning/store';
import { exportState, parseImport } from '../lib/learning/state';
import { modeSchema, type LearningConfig } from '../lib/content/schema';

const reader = document.querySelector<HTMLElement>('[data-reader]');
if (reader) {
  const config = JSON.parse(reader.querySelector('[data-learning-config]')!.textContent!) as LearningConfig;
  const store = getStore(config);
  const t = getUI(config.locale);
  const mode = modeSchema.parse(reader.dataset.mode);
  const base = reader.dataset.base!;
  const steps = [...reader.querySelectorAll<HTMLElement>('[data-core-step]')];
  const reduced = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function render() {
    const { state, message } = store.getSnapshot();
    const count = state.completedStepIds.length;
    const progressLabel = format(t.progress, { count, total: config.stepIds.length });
    document.querySelectorAll('[data-progress-label]').forEach((el) => { if (el.textContent !== progressLabel) el.textContent = progressLabel; });
    document.querySelector('[data-progress-count]')?.replaceChildren(String(count));
    document.querySelector('[data-core-progress]')?.setAttribute('title', progressLabel);
    const progress = document.querySelector('[data-progress]');
    progress?.setAttribute('aria-valuenow', String(count));
    progress?.setAttribute('aria-valuetext', progressLabel);
    document.querySelectorAll<HTMLElement>('[data-progress-step]').forEach((el) => { el.dataset.done = String(state.completedStepIds.includes(el.dataset.progressStep!)); });
    steps.forEach((step) => {
      step.hidden = !(state.reading.revealAll || state.unlockedStepIds.includes(step.dataset.coreStep!));
      step.dataset.completed = String(state.completedStepIds.includes(step.dataset.coreStep!));
    });
    document.querySelectorAll<HTMLButtonElement>('[data-complete-step]').forEach((button) => {
      button.hidden = state.completedStepIds.includes(button.dataset.completeStep!);
    });
    const toggle = document.querySelector<HTMLButtonElement>('[data-toggle-all]');
    if (toggle) { toggle.textContent = state.reading.revealAll ? t.sequential : t.revealAll; toggle.setAttribute('aria-pressed', String(state.reading.revealAll)); }
    document.querySelectorAll<HTMLAnchorElement>('[data-step-link]').forEach((link) => {
      const id = link.dataset.stepLink!, available = state.reading.revealAll || state.unlockedStepIds.includes(id);
      link.dataset.done = String(state.completedStepIds.includes(id));
      link.setAttribute('aria-disabled', String(!available));
      link.setAttribute('aria-label', `${link.dataset.stepTitle}${!available ? ` — ${t.lockedStep}` : state.completedStepIds.includes(id) ? ` — ${t.completedStep}` : ''}`);
      if (state.reading.lastStepId === id && mode === 'core') link.setAttribute('aria-current', 'location'); else link.removeAttribute('aria-current');
    });
    document.querySelectorAll('[data-storage-message]').forEach((el) => { el.textContent = message; });
    const complete = reader!.querySelector<HTMLElement>('[data-core-complete]');
    if (complete) complete.hidden = count !== config.stepIds.length;
    reader!.dataset.ready = 'true';
  }
  store.subscribe(render);
  store.load();
  store.update((s) => ({ ...s, reading: { ...s.reading, mode } }));
  render();
  document.querySelector('[data-toggle-all]')?.addEventListener('click', () => store.update((s) => ({ ...s, reading: { ...s.reading, revealAll: !s.reading.revealAll } })));
  document.querySelector('[data-reveal-from-toc]')?.addEventListener('click', () => {
    store.update((s) => ({ ...s, reading: { ...s.reading, revealAll: true } }));
    if (mode !== 'core') window.location.assign(`${base}/core/`); else (document.getElementById('course-dialog') as HTMLDialogElement).close();
  });
  document.querySelectorAll<HTMLAnchorElement>('[data-step-link]').forEach((link) => link.addEventListener('click', (event) => {
    if (link.getAttribute('aria-disabled') === 'true') { event.preventDefault(); return; }
    if (mode === 'core' && !event.metaKey && !event.ctrlKey && !event.shiftKey && !event.altKey) {
      event.preventDefault();
      const dialog = document.getElementById('course-dialog') as HTMLDialogElement;
      dialog.dataset.skipReturnFocus = 'true'; dialog.close();
      const target = document.getElementById(link.dataset.stepLink!);
      store.update((s) => ({ ...s, reading: { ...s.reading, lastStepId: link.dataset.stepLink! } }));
      target?.scrollIntoView({ block: 'start', behavior: reduced() ? 'instant' : 'smooth' });
      const heading = target?.querySelector('h2');
      if (heading) { heading.tabIndex = -1; heading.focus({ preventScroll: true }); }
      history.pushState(null, '', link.href);
    }
  }));
  document.querySelectorAll<HTMLButtonElement>('[data-complete-step]').forEach((button) => button.addEventListener('click', () => {
    const id = button.dataset.completeStep!; store.complete(id);
    const next = config.stepIds[config.stepIds.indexOf(id) + 1];
    if (!next) { window.location.assign(`${base}/mastery/`); return; }
    const target = document.getElementById(next);
    store.update((s) => ({ ...s, reading: { ...s.reading, lastStepId: next } }));
    target?.scrollIntoView({ block: 'start', behavior: reduced() ? 'instant' : 'smooth' });
    const heading = target?.querySelector('h2');
    if (heading) { heading.tabIndex = -1; heading.focus({ preventScroll: true }); }
    history.replaceState(null, '', `#${next}`);
  }));
  if (mode === 'core') {
    let observer: IntersectionObserver;
    function watchReadingPosition() {
      observer?.disconnect();
      // Observe a reading line below the sticky toolbar, rather than overlapping tall sections.
      const line = Math.min(innerHeight - 1, parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--reader-offset')) + 48);
      observer = new IntersectionObserver((entries) => {
        if (document.querySelector('dialog[open]')) return;
        const visible = entries.find((entry) => entry.isIntersecting);
        if (!visible) return;
        const id = (visible.target as HTMLElement).dataset.coreStep!;
        if (store.getSnapshot().state.reading.lastStepId !== id) store.update((s) => ({ ...s, reading: { ...s.reading, lastStepId: id } }));
      }, { rootMargin: `-${line}px 0px -${innerHeight - line - 1}px 0px`, threshold: 0 });
      steps.forEach((step) => observer.observe(step));
    }
    watchReadingPosition();
    window.addEventListener('resize', watchReadingPosition, { passive: true });
    const hash = decodeURIComponent(window.location.hash.slice(1));
    if (config.stepIds.includes(hash)) {
      if (!store.getSnapshot().state.unlockedStepIds.includes(hash)) store.update((s) => ({ ...s, reading: { ...s.reading, revealAll: true } }));
      store.update((s) => ({ ...s, reading: { ...s.reading, lastStepId: hash } }));
      requestAnimationFrame(() => document.getElementById(hash)?.scrollIntoView({ behavior: 'instant' }));
    }
  }
  document.querySelector('[data-export]')?.addEventListener('click', () => {
    const blob = new Blob([exportState(store.getSnapshot().state)], { type: 'application/json' });
    const url = URL.createObjectURL(blob), a = document.createElement('a');
    a.href = url; a.download = 'knowledge-atlas-progress.json'; a.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
  });
  document.querySelector('[data-reset]')?.addEventListener('click', () => {
    if (window.confirm(t.resetConfirm)) { store.reset(); window.location.assign(`${base}/core/`); }
  });
  const input = document.querySelector<HTMLInputElement>('#import-progress');
  input?.addEventListener('change', async () => {
    const status = document.querySelector('#import-status')!, file = input.files?.[0];
    if (!file) return;
    try {
      if (file.size > 2_000_000) throw new Error(t.tooLarge);
      const state = parseImport(await file.text(), config);
      const summary = format(t.importSummary, { steps: state.completedStepIds.length, answers: Object.keys(state.answers).length, characters: state.notes.reflection.length + state.notes.essay.length });
      if (!window.confirm(format(t.importConfirm, { summary }))) { status.textContent = t.importCancelled; return; }
      store.replace(state); status.textContent = t.importComplete;
    } catch (error) { status.textContent = error instanceof SyntaxError ? t.invalidJson : error instanceof Error && !('issues' in error) ? error.message : t.invalidImport; }
    finally { input.value = ''; }
  });
}
