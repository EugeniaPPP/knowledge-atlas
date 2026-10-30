import { z } from 'zod';
import { identifier, exercisesSchema, interactionContentSchema, chapterSchema, modelsSchema, type Chapter, type Model, type Exercise } from './schema';

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

export function translateChapter(chapter: Chapter, copy: LessonTranslation): Chapter {
  if (copy.chapterId !== chapter.id || copy.basedOnContentVersion !== chapter.contentVersion) throw new Error(`Stale translation: ${chapter.id}`);
  if (chapter.steps.some((s) => !copy.chapter.steps[s.id]) || Object.keys(copy.chapter.steps).length !== chapter.steps.length || copy.chapter.sourceLinkTitles.length !== chapter.sourceLinks.length) throw new Error(`Incomplete chapter translation: ${chapter.id}`);
  return chapterSchema.parse({ ...chapter, ...copy.chapter, locale: 'en', steps: chapter.steps.map((s) => ({ ...s, title: copy.chapter.steps[s.id] })),
    sourceLinks: chapter.sourceLinks.map((s, i) => ({ ...s, title: copy.chapter.sourceLinkTitles[i] })) });
}
export function translateModels(models: Record<string, Model>, copy: LessonTranslation): Record<string, Model> {
  if (Object.keys(models).some((id) => !copy.modelCaptions[id]) || Object.keys(copy.modelCaptions).length !== Object.keys(models).length) throw new Error('Incomplete model captions');
  return modelsSchema.parse(Object.fromEntries(Object.entries(models).map(([id, model]) => [id, { ...model, locale: 'en', caption: copy.modelCaptions[id] }])));
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
