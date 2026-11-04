import { z } from 'zod';
import { identifier, exercisesSchema, interactionContentSchema, chapterSchema, modelsSchema, assessmentTaskSchema, lessonInteractionsSchema, type Chapter, type Model, type Exercise, type AssessmentTask, type LessonInteractions } from './schema';
import { electionCopySchema } from './election';

export const translationSchema = z.object({
  chapterId: identifier,
  locale: z.literal('en'),
  basedOnContentVersion: z.string(),
  terminologyVersion: z.literal(1),
  chapter: z.object({ title: z.string(), titleLead: z.string(), titleMuted: z.string(), description: z.string(), durations: z.object({ quick: z.string(), core: z.string(), mastery: z.string() }),
    steps: z.record(identifier, z.string()), sourceLinkTitles: z.array(z.string()) }),
  modelCaptions: z.record(identifier, z.string()),
  exercises: exercisesSchema,
  interactions: interactionContentSchema,
});
export type LessonTranslation = z.infer<typeof translationSchema>;
const metadataShape = translationSchema.pick({ chapterId: true, locale: true, basedOnContentVersion: true, terminologyVersion: true, chapter: true, modelCaptions: true });
type TranslationMetadata = z.infer<typeof metadataShape>;
export const assessmentTranslationSchema = metadataShape.extend({
  format: z.literal('assessment'),
  modelPlayers: z.record(identifier, z.object({ row: z.string().min(1), column: z.string().min(1), meaning: z.string().min(1) })),
  exercises: z.array(assessmentTaskSchema),
  interactions: lessonInteractionsSchema,
});
// Copy-only translations inherit keys, ranges, kinds and model IDs from the shared tasks.
export const assessmentCopySchema = z.record(identifier, z.object({
  parts: z.record(identifier, z.object({ label: z.string().min(1), options: z.record(identifier, z.string().min(1)).optional() }).strict()),
}).strict());
export const spatialAssessmentTranslationSchema = metadataShape.extend({
  format: z.literal('spatial-assessment'),
  modelPlayers: assessmentTranslationSchema.shape.modelPlayers,
  exerciseCopy: assessmentCopySchema,
  interactions: z.object({ election: electionCopySchema }).strict(),
});
export const allTranslationsSchema = z.union([translationSchema, assessmentTranslationSchema, spatialAssessmentTranslationSchema]);
export type AssessmentTranslation = z.infer<typeof assessmentTranslationSchema>;

export function translateAssessmentTasks(tasks: AssessmentTask[], copy: z.infer<typeof assessmentCopySchema>): AssessmentTask[] {
  const sameKeys = (actual: string[], expected: string[]) => JSON.stringify([...actual].sort()) === JSON.stringify([...expected].sort());
  if (!sameKeys(Object.keys(copy), tasks.map((t) => t.id))) throw new Error('Incomplete assessment task translation');
  return tasks.map((task) => {
    const parts = copy[task.id].parts;
    if (!sameKeys(Object.keys(parts), task.parts.map((p) => p.id))) throw new Error(`Incomplete assessment parts: ${task.id}`);
    return assessmentTaskSchema.parse({ ...task, parts: task.parts.map((part) => {
      const translated = parts[part.id];
      if (part.kind === 'integer') {
        if (translated.options) throw new Error(`Unexpected translated options: ${part.id}`);
        return { ...part, label: translated.label };
      }
      if (!translated.options || !sameKeys(Object.keys(translated.options), part.options.map((o) => o.id))) throw new Error(`Incomplete assessment options: ${part.id}`);
      return { ...part, label: translated.label, options: part.options.map((option) => ({ ...option, text: translated.options![option.id] })) };
    }) });
  });
}

export function translateChapter(chapter: Chapter, copy: TranslationMetadata): Chapter {
  if (copy.chapterId !== chapter.id || copy.basedOnContentVersion !== chapter.contentVersion) throw new Error(`Stale translation: ${chapter.id}`);
  if (chapter.steps.some((s) => !copy.chapter.steps[s.id]) || Object.keys(copy.chapter.steps).length !== chapter.steps.length || copy.chapter.sourceLinkTitles.length !== chapter.sourceLinks.length) throw new Error(`Incomplete chapter translation: ${chapter.id}`);
  return chapterSchema.parse({ ...chapter, ...copy.chapter, locale: 'en', steps: chapter.steps.map((s) => ({ ...s, title: copy.chapter.steps[s.id] })),
    sourceLinks: chapter.sourceLinks.map((s, i) => ({ ...s, title: copy.chapter.sourceLinkTitles[i] })) });
}
export function translateModels(models: Record<string, Model>, copy: TranslationMetadata & { modelPlayers?: AssessmentTranslation['modelPlayers'] }): Record<string, Model> {
  if (Object.keys(models).some((id) => !copy.modelCaptions[id]) || Object.keys(copy.modelCaptions).length !== Object.keys(models).length) throw new Error('Incomplete model captions');
  const roleIds = Object.keys(models).filter((id) => models[id].players);
  if (roleIds.some((id) => !copy.modelPlayers?.[id]) || Object.keys(copy.modelPlayers || {}).some((id) => !roleIds.includes(id))) throw new Error('Incomplete model player labels');
  return modelsSchema.parse(Object.fromEntries(Object.entries(models).map(([id, model]) => [id, { ...model, locale: 'en', caption: copy.modelCaptions[id], ...(model.players ? { players: copy.modelPlayers![id] } : {}) }])));
}

/** Words may vary; answer keys, numerical procedures and perspective visibility may not. */
export function validateAssessmentTranslation(tasks: AssessmentTask[], interactions: LessonInteractions, copy: AssessmentTranslation): void {
  const contract = (items: AssessmentTask[]) => items.map((t) => ({ id: t.id, origin: t.origin, modelId: t.modelId, parts: t.parts.map((p) => p.kind === 'choice' ? { id: p.id, kind: p.kind, options: p.options.map((o) => o.id), correct: p.correct } : { id: p.id, kind: p.kind, min: p.min, max: p.max, correct: p.correct }) }));
  if (JSON.stringify(contract(tasks)) !== JSON.stringify(contract(copy.exercises))) throw new Error('Translated assessment contracts differ');
  const numerical = (data: LessonInteractions) => ({ levels: data.elimination.levels.map(({ max, target }) => ({ max, target })), chain: data.chain.items.map(({ value }) => value), views: data.hats.views.map(({ id, unknownPerson }) => ({ id, unknownPerson })) });
  if (JSON.stringify(numerical(interactions)) !== JSON.stringify(numerical(copy.interactions))) throw new Error('Translated interaction contracts differ');
}

/** Translated copy must preserve every language-independent exercise contract. */
export function validateTranslation(exercises: Exercise[], interactions: import('zod').infer<typeof interactionContentSchema>, copy: LessonTranslation): void {
  const contract = (items: Exercise[]) => items.map((e) => ({ id: e.id, objectiveIds: e.objectiveIds, modelId: e.modelId, options: e.options.map((o) => o.id), correct: e.correct, pairs: e.strategySequence?.pairs }));
  if (JSON.stringify(contract(exercises)) !== JSON.stringify(contract(copy.exercises))) throw new Error('Translated exercise contracts differ');
  const source = interactions.activities, target = copy.interactions.activities;
  if (JSON.stringify(Object.keys(source).sort()) !== JSON.stringify(Object.keys(target).sort())) throw new Error('Translated activities differ');
  const placeholders = (value: string) => [...value.matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort().join(',');
  for (const id of Object.keys(source)) {
    if (JSON.stringify(Object.keys(source[id].text).sort()) !== JSON.stringify(Object.keys(target[id].text).sort())) throw new Error(`Incomplete activity translation: ${id}`);
    for (const key of Object.keys(source[id].text)) if (placeholders(source[id].text[key]) !== placeholders(target[id].text[key])) throw new Error(`Changed placeholders: ${id}/${key}`);
  }
  if (interactions.written.id !== copy.interactions.written.id || interactions.written.modelId !== copy.interactions.written.modelId) throw new Error('Translated written response contract differs');
}
