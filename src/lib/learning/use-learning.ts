import { useEffect, useSyncExternalStore } from 'react';
import { getStore } from './store';
import type { LearningConfig } from '../content/schema';

export function useLearning(config: LearningConfig) {
  const store = getStore(config);
  const snapshot = useSyncExternalStore(store.subscribe, store.getSnapshot, store.getServerSnapshot);
  useEffect(() => { store.load(); }, [store]);
  return { ...snapshot, store };
}
