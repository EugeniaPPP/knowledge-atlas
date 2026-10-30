import { z } from 'zod';

export const identifier = z.string().regex(/^[a-z0-9]+(?:[-/][a-z0-9]+)*$/);
export const modeSchema = z.enum(['quick', 'core', 'mastery']);
export const stepSchema = z.object({
  id: identifier,
  title: z.string().min(1),
  sourceStart: z.number().int().nonnegative(),
  sourceEnd: z.number().int().positive(),
  conceptIds: z.array(identifier),
}).refine((s) => s.sourceEnd > s.sourceStart, 'Source range must be increasing');

export const chapterSchema = z.object({
  schemaVersion: z.literal(1),
  id: identifier,
  courseId: identifier,
  slug: identifier,
  number: z.number().int().positive(),
  sourceUrl: z.url(),
  videoUrl: z.url().optional(),
  sourceLinks: z.array(z.object({ title: z.string(), url: z.url() })),
  title: z.string().min(1),
  titleLead: z.string(),
  titleMuted: z.string(),
  description: z.string(),
  contentVersion: z.string(),
  status: z.enum(['preview', 'published']),
  sourceHeader: z.string(),
  sourceSha256: z.string().regex(/^[a-f0-9]{64}$/),
  durations: z.object({ quick: z.string(), core: z.string(), mastery: z.string() }),
  steps: z.array(stepSchema).min(1),
  conceptIds: z.array(identifier),
  sourceIds: z.array(identifier).min(1),
}).superRefine((c, ctx) => {
  if (new Set(c.steps.map((s) => s.id)).size !== c.steps.length)
    ctx.addIssue({ code: 'custom', message: 'Step IDs must be unique' });
});

const pair = z.tuple([z.number(), z.number()]);
const outcome = z.tuple([z.string(), z.string()]);
export const modelSchema = z.object({
  id: identifier,
  caption: z.string(),
  rows: z.array(z.string()).min(1),
  columns: z.array(z.string()).min(1),
  payoffs: z.array(z.array(pair)),
  outcomes: z.array(z.array(outcome)).optional(),
}).superRefine((m, ctx) => {
  for (const matrix of [m.payoffs, m.outcomes].filter(Boolean)) {
    if (matrix!.length !== m.rows.length || matrix!.some((r) => r.length !== m.columns.length))
      ctx.addIssue({ code: 'custom', message: 'Matrix dimensions must match its labels' });
  }
});
export const modelsSchema = z.record(z.string(), modelSchema);

export const exerciseSchema = z.object({
  id: identifier,
  title: z.string(),
  prompt: z.string(),
  context: z.string().min(1).optional(),
  objectiveIds: z.array(identifier).min(1),
  modelId: identifier.optional(),
  strategySequence: z.object({
    partnerPrompt: z.string().min(1),
    responsePrompt: z.string().min(1),
    instruction: z.string().min(1),
    pendingInstruction: z.string().min(1),
    pairs: z.array(z.object({ optionId: identifier, row: z.number().int().nonnegative(), column: z.number().int().nonnegative() })).min(1),
  }).optional(),
  options: z.array(z.object({ id: identifier, text: z.string() })).min(2),
  correct: identifier,
  explanation: z.string().min(1),
}).superRefine((e, ctx) => {
  if (!e.options.some((o) => o.id === e.correct) || new Set(e.options.map((o) => o.id)).size !== e.options.length)
    ctx.addIssue({ code: 'custom', message: 'Options must be unique and include the answer' });
  if (e.strategySequence) {
    const pairs = e.strategySequence.pairs;
    if (!e.modelId || pairs.length !== e.options.length || new Set(pairs.map((p) => p.optionId)).size !== pairs.length ||
      new Set(pairs.map((p) => `${p.row}:${p.column}`)).size !== pairs.length || pairs.some((p) => !e.options.some((o) => o.id === p.optionId)))
      ctx.addIssue({ code: 'custom', message: 'A strategy sequence needs a model and a unique pair for every option' });
  }
});
export const exercisesSchema = z.array(exerciseSchema);
export const activityCopySchema = z.object({ title: z.string().min(1), label: z.string().min(1), lead: z.string().optional(), text: z.record(z.string(), z.string()) });
export const writtenExerciseSchema = z.object({ id: identifier, title: z.string(), prompt: z.string(), context: z.string().optional(), modelId: identifier.optional(), rubric: z.string() });
export const interactionContentSchema = z.object({ activities: z.record(z.string(), activityCopySchema), written: writtenExerciseSchema, quickAnswer: z.object({ lead: z.string(), body: z.string() }) });
export type ActivityCopy = z.infer<typeof activityCopySchema>;
export type WrittenExercise = z.infer<typeof writtenExerciseSchema>;
export type Chapter = z.infer<typeof chapterSchema>;
export type Model = z.infer<typeof modelSchema>;
export type Exercise = z.infer<typeof exerciseSchema>;
export type Mode = z.infer<typeof modeSchema>;
export type LearningConfig = { chapterId: string; contentVersion: string; stepIds: string[] };
export const courseSchema = z.object({
  id: identifier, title: z.string(), author: z.string(), sourceUrl: z.url(),
  lectures: z.array(z.object({ number: z.number().int().positive(), title: z.string(), slug: identifier, status: z.enum(['preview', 'planned', 'published']) })),
});
