import type { ChapterState } from './state';
import type { LearningConfig } from '../content/schema';
import { getStore } from './store';

export const predictionKeys = { original: 'number-original', current: 'number-current', revised: 'number-revised', origin: 'number-origin' } as const;
export function savedNumber(value?: string): string | undefined {
  return value && /^\d+$/.test(value) && Number.isInteger(Number(value)) && Number(value) >= 1 && Number(value) <= 100 ? String(Number(value)) : undefined;
}
export function snapshotPrediction(state: ChapterState, number?: string, source?: string): ChapterState {
  const valid = savedNumber(number);
  if (savedNumber(state.responses[predictionKeys.original]) || !valid) return state;
  return { ...state, responses: { ...state.responses, [predictionKeys.original]: valid, [predictionKeys.current]: valid, [predictionKeys.origin]: source || state.chapterId } };
}
export function savePrediction(state: ChapterState, stage: 'current' | 'revised', number: string): ChapterState {
  const valid = savedNumber(number);
  if (!valid) throw new Error('Expected an integer between 1 and 100');
  const withOriginal = snapshotPrediction(state, valid);
  return { ...withOriginal, responses: { ...withOriginal.responses, [predictionKeys[stage]]: valid } };
}
/** Read through the existing store; never write to the source chapter. */
export function readPreviousPrediction(config: LearningConfig): string | undefined {
  const source = getStore(config); source.load();
  return savedNumber(source.getSnapshot().state.responses.number);
}
