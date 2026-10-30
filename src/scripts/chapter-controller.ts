import { getStore } from '../lib/learning/store';
import { exportState, parseImport } from '../lib/learning/state';
import { modeSchema, type LearningConfig } from '../lib/content/schema';

const reader = document.querySelector<HTMLElement>('[data-reader]');
if (reader) {
  const config = JSON.parse(reader.querySelector('[data-learning-config]')!.textContent!) as LearningConfig;
  const store = getStore(config);
  const mode = modeSchema.parse(reader.dataset.mode);
  const base = reader.dataset.base!;
  const steps = [...reader.querySelectorAll<HTMLElement>('[data-core-step]')];
  const reduced = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function render() {
    const { state, message } = store.getSnapshot();
    const count = state.completedStepIds.length;
    document.querySelectorAll('[data-progress-label]').forEach((el) => { el.textContent = `${count} из ${config.stepIds.length} шагов завершено`; });
    const progress = document.querySelector('[data-progress]');
    progress?.setAttribute('aria-valuenow', String(count));
    document.querySelectorAll<HTMLElement>('[data-progress-step]').forEach((el) => { el.dataset.done = String(state.completedStepIds.includes(el.dataset.progressStep!)); });
    steps.forEach((step) => { step.hidden = !(state.reading.revealAll || state.unlockedStepIds.includes(step.dataset.coreStep!)); });
    document.querySelectorAll<HTMLButtonElement>('[data-complete-step]').forEach((button) => {
      const id = button.dataset.completeStep!, isLast = id === config.stepIds.at(-1), done = state.completedStepIds.includes(id);
      button.textContent = isLast ? done ? 'Перейти к Mastery →' : 'Завершить Core и перейти к Mastery →' : done ? 'Шаг завершён · перейти дальше →' : 'Продолжить →';
    });
    const toggle = document.querySelector<HTMLButtonElement>('[data-toggle-all]');
    if (toggle) { toggle.textContent = state.reading.revealAll ? 'Вернуть пошаговый режим' : 'Показать всю главу'; toggle.setAttribute('aria-pressed', String(state.reading.revealAll)); }
    document.querySelectorAll<HTMLAnchorElement>('[data-step-link]').forEach((link) => {
      const id = link.dataset.stepLink!, available = state.reading.revealAll || state.unlockedStepIds.includes(id);
      link.dataset.done = String(state.completedStepIds.includes(id));
      link.setAttribute('aria-disabled', String(!available));
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
    if (mode !== 'core') window.location.assign(`${base}/core/`); else (document.getElementById('contents-dialog') as HTMLDialogElement).close();
  });
  document.querySelectorAll<HTMLAnchorElement>('[data-step-link]').forEach((link) => link.addEventListener('click', (event) => {
    if (link.getAttribute('aria-disabled') === 'true') { event.preventDefault(); return; }
    if (mode === 'core') (document.getElementById('contents-dialog') as HTMLDialogElement).close();
  }));
  document.querySelectorAll<HTMLButtonElement>('[data-complete-step]').forEach((button) => button.addEventListener('click', () => {
    const id = button.dataset.completeStep!; store.complete(id);
    const next = config.stepIds[config.stepIds.indexOf(id) + 1];
    if (!next) { window.location.assign(`${base}/mastery/`); return; }
    const target = document.getElementById(next);
    target?.scrollIntoView({ block: 'start', behavior: reduced() ? 'instant' : 'smooth' });
    const heading = target?.querySelector('h2');
    if (heading) { heading.tabIndex = -1; heading.focus({ preventScroll: true }); }
    history.replaceState(null, '', `#${next}`);
  }));
  if (mode === 'core') {
    const observer = new IntersectionObserver((entries) => {
      const visible = entries.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];
      if (!visible) return;
      const id = (visible.target as HTMLElement).dataset.coreStep!;
      if (store.getSnapshot().state.reading.lastStepId !== id) store.update((s) => ({ ...s, reading: { ...s.reading, lastStepId: id } }));
      const label = reader!.querySelector('[data-current-label]');
      if (label) label.textContent = `Сейчас · ${String(config.stepIds.indexOf(id) + 1).padStart(2, '0')} / ${String(config.stepIds.length).padStart(2, '0')}`;
    }, { rootMargin: '-5% 0px -70% 0px', threshold: 0 });
    steps.forEach((step) => observer.observe(step));
    const hash = decodeURIComponent(window.location.hash.slice(1));
    if (config.stepIds.includes(hash)) {
      if (!store.getSnapshot().state.unlockedStepIds.includes(hash)) store.update((s) => ({ ...s, reading: { ...s.reading, revealAll: true } }));
      requestAnimationFrame(() => document.getElementById(hash)?.scrollIntoView({ behavior: 'instant' }));
    }
  }
  document.querySelector('[data-export]')?.addEventListener('click', () => {
    const blob = new Blob([exportState(store.getSnapshot().state)], { type: 'application/json' });
    const url = URL.createObjectURL(blob), a = document.createElement('a');
    a.href = url; a.download = 'knowledge-atlas-progress.json'; a.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
  });
  document.querySelector('[data-reset]')?.addEventListener('click', () => {
    if (window.confirm('Сбросить прогресс, ответы и заметки этой главы?')) { store.reset(); window.location.assign(`${base}/core/`); }
  });
  const input = document.querySelector<HTMLInputElement>('#import-progress');
  input?.addEventListener('change', async () => {
    const status = document.querySelector('#import-status')!, file = input.files?.[0];
    if (!file) return;
    try {
      if (file.size > 2_000_000) throw new Error('Файл слишком большой. Максимум — 2 МБ.');
      const state = parseImport(await file.text(), config);
      const summary = `${state.completedStepIds.length} завершённых шагов, ${Object.keys(state.answers).length} ответов и ${state.notes.reflection.length + state.notes.essay.length} символов заметок.`;
      if (!window.confirm(`Импортировать: ${summary} Текущие данные этой главы будут заменены.`)) { status.textContent = 'Импорт отменён. Данные не изменены.'; return; }
      store.replace(state); status.textContent = 'Импорт завершён. Данные этой главы восстановлены.';
    } catch (error) { status.textContent = error instanceof SyntaxError ? 'Не удалось прочитать JSON. Выбери файл экспорта Knowledge Atlas.' : error instanceof Error && !('issues' in error) ? error.message : 'Формат или версия файла не поддерживается. Текущие данные сохранены.'; }
    finally { input.value = ''; }
  });
}
