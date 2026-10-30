import { getUI } from '../../i18n/ui';
import { z } from 'zod';
import { modeSchema, type LearningConfig } from '../content/schema';

export const stateSchema = z.object({
  schemaVersion: z.literal(1),
  chapterId: z.string().max(160),
  contentVersion: z.string().max(80),
  unlockedStepIds: z.array(z.string()).max(200),
  completedStepIds: z.array(z.string()).max(200),
  responses: z.record(z.string().max(80), z.string().max(20000)),
  answers: z.record(z.string().max(80), z.object({ selected: z.string().max(80), checked: z.boolean() })),
  notes: z.object({ reflection: z.string().max(20000), essay: z.string().max(20000) }),
  reading: z.object({ mode: modeSchema, lastStepId: z.string().nullable(), revealAll: z.boolean() }),
  quickReveal: z.boolean(),
  rubric: z.boolean(),
}).strict();
export type ChapterState = z.infer<typeof stateSchema>;

export function initialState(config: LearningConfig): ChapterState {
  return {
    schemaVersion: 1, chapterId: config.chapterId, contentVersion: config.contentVersion,
    unlockedStepIds: config.stepIds.slice(0, 1), completedStepIds: [], responses: {}, answers: {},
    notes: { reflection: '', essay: '' }, reading: { mode: 'core', lastStepId: null, revealAll: false },
    quickReveal: false, rubric: false,
  };
}

export function normalizeState(value: unknown, config: LearningConfig): ChapterState {
  const state = stateSchema.parse(value);
  if (state.chapterId !== config.chapterId) throw new Error(getUI(config.locale).wrongChapter);
  const valid = (id: string) => config.stepIds.includes(id);
  const completedStepIds = [...new Set(state.completedStepIds.filter(valid))];
  const unlockedStepIds = [...new Set([
    ...config.stepIds.slice(0, 1), ...state.unlockedStepIds.filter(valid), ...completedStepIds,
    ...completedStepIds.flatMap((id) => config.stepIds.slice(config.stepIds.indexOf(id) + 1, config.stepIds.indexOf(id) + 2)),
  ])];
  return { ...state, unlockedStepIds, completedStepIds,
    reading: { ...state.reading, lastStepId: state.reading.lastStepId && valid(state.reading.lastStepId) ? state.reading.lastStepId : null } };
}

export function completeStep(state: ChapterState, id: string, config: LearningConfig): ChapterState {
  if (!config.stepIds.includes(id) || (!state.reading.revealAll && !state.unlockedStepIds.includes(id))) return state;
  return normalizeState({ ...state, completedStepIds: [...state.completedStepIds, id] }, config);
}

export function migrateLegacy(value: unknown, config: LearningConfig): ChapterState {
  const legacy = z.object({
    app: z.literal('Knowledge Atlas 1'),
    progress: z.object({
      mode: modeSchema.optional(), done: z.array(z.boolean()).length(config.stepIds.length),
      unlocked: z.number().int().min(0).max(config.stepIds.length - 1),
      allOpen: z.boolean().optional(), mastery: z.record(z.string(), z.object({ selected: z.string(), checked: z.boolean() })).optional(),
      essay: z.string().max(20000).optional(), rubric: z.boolean().optional(), quickReveal: z.boolean().optional(),
    }),
    notes: z.object({ first: z.string().nullable().optional(), number: z.string().nullable().optional(), reflection: z.string().max(20000).nullable().optional() }).optional(),
  }).parse(value);
  const base = initialState(config), p = legacy.progress;
  return normalizeState({ ...base,
    unlockedStepIds: config.stepIds.slice(0, p.unlocked + 1), completedStepIds: config.stepIds.filter((_, i) => p.done[i]),
    responses: { ...(legacy.notes?.first ? { first: legacy.notes.first } : {}), ...(legacy.notes?.number ? { number: legacy.notes.number } : {}) },
    answers: p.mastery || {}, notes: { reflection: legacy.notes?.reflection || '', essay: p.essay || '' },
    reading: { ...base.reading, mode: p.mode || 'core', revealAll: !!p.allOpen },
    quickReveal: !!p.quickReveal, rubric: !!p.rubric,
  }, config);
}

export function parseImport(text: string, config: LearningConfig): ChapterState {
  if (text.length > 2_000_000) throw new Error(getUI(config.locale).tooLarge);
  const data: unknown = JSON.parse(text);
  if (data && typeof data === 'object' && 'app' in data && data.app === 'Knowledge Atlas 1') return migrateLegacy(data, config);
  const envelope = z.object({ app: z.literal('knowledge-atlas'), schemaVersion: z.literal(1),
    exportedAt: z.string(), chapters: z.array(stateSchema).min(1).max(100) }).parse(data);
  const chapter = envelope.chapters.find((s) => s.chapterId === config.chapterId);
  if (!chapter) throw new Error(getUI(config.locale).missingChapter);
  return normalizeState(chapter, config);
}

export function exportState(state: ChapterState): string {
  return JSON.stringify({ app: 'knowledge-atlas', schemaVersion: 1, exportedAt: new Date().toISOString(), chapters: [state] }, null, 2);
}
