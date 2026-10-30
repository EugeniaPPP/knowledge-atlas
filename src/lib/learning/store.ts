import { getUI } from '../../i18n/ui';
import { completeStep, initialState, normalizeState, type ChapterState } from './state';
import type { LearningConfig } from '../content/schema';

export type Snapshot = { state: ChapterState; persistence: 'pending' | 'local' | 'memory'; message: string };
export const storageKey = (id: string) => `knowledge-atlas:chapter:${id}`;

export function createStore(config: LearningConfig) {
  const t = getUI(config.locale);
  const baseline: Snapshot = { state: initialState(config), persistence: 'pending', message: '' };
  let snapshot = baseline, loaded = false;
  const listeners = new Set<() => void>();
  const notify = () => listeners.forEach((fn) => fn());
  return {
    config,
    getSnapshot: () => snapshot,
    getServerSnapshot: () => baseline,
    subscribe(fn: () => void) { listeners.add(fn); return () => { listeners.delete(fn); }; },
    load() {
      if (loaded || typeof window === 'undefined') return;
      loaded = true;
      try {
        const raw = window.localStorage.getItem(storageKey(config.chapterId));
        let state = baseline.state;
        if (raw) {
          try { state = normalizeState(JSON.parse(raw), config); }
          catch { snapshot = { state, persistence: 'memory', message: t.corruptStorage }; notify(); return; }
        }
        snapshot = { state, persistence: 'local', message: '' };
      } catch { snapshot = { ...baseline, persistence: 'memory', message: t.unavailableStorage }; }
      notify();
    },
    update(change: (state: ChapterState) => ChapterState) {
      this.load();
      const next = normalizeState(change(snapshot.state), config);
      let persistence = snapshot.persistence, message = snapshot.message;
      if (persistence === 'local') {
        try { window.localStorage.setItem(storageKey(config.chapterId), JSON.stringify(next)); }
        catch { persistence = 'memory'; message = t.failedStorage; }
      }
      snapshot = { state: next, persistence, message }; notify();
    },
    complete(id: string) { this.update((state) => completeStep(state, id, config)); },
    reset() {
      // Only this chapter is affected. Never clear unrelated browser storage.
      try {
        window.localStorage.removeItem(storageKey(config.chapterId));
        snapshot = { state: initialState(config), persistence: 'local', message: '' };
      } catch { snapshot = { state: initialState(config), persistence: 'memory', message: t.resetMemory }; }
      notify();
    },
    replace(state: ChapterState) {
      const next = normalizeState(state, config);
      try {
        window.localStorage.setItem(storageKey(config.chapterId), JSON.stringify(next));
        snapshot = { state: next, persistence: 'local', message: '' };
      } catch { snapshot = { state: next, persistence: 'memory', message: t.importMemory }; }
      notify();
    },
  };
}

const stores = new Map<string, ReturnType<typeof createStore>>();
export function getStore(config: LearningConfig) {
  if (!stores.has(config.chapterId)) stores.set(config.chapterId, createStore(config));
  return stores.get(config.chapterId)!;
}
