import { z } from 'zod';

/** Complete localized copy; numerical election data is shared by both editions. */
export const electionCopySchema = z.object({
  title: z.string().min(1), instruction: z.string().min(1), candidate1: z.string().min(1), candidate2: z.string().min(1),
  short1: z.string().min(1), short2: z.string().min(1), position: z.string().min(1), voters: z.string().min(1),
  left: z.string().min(1), right: z.string().min(1), scrollHint: z.string().min(1), region: z.string().min(1),
  exampleLabel: z.string().min(1), example: z.string().min(1), details: z.string().min(1), tableRegion: z.string().min(1),
  group: z.string().min(1), distance1: z.string().min(1), distance2: z.string().min(1), share1: z.string().min(1),
  share2: z.string().min(1), total: z.string().min(1), percent: z.string().min(1), allocation: z.string().min(1),
  groupLabel: z.string().min(1), none: z.string().min(1), fallback: z.string().min(1), sum: z.string().min(1),
}).strict();
export type ElectionCopy = z.infer<typeof electionCopySchema>;

export const electionSchema = z.object({
  positions: z.array(z.number()).min(2), groupPercent: z.number().positive(),
  initialPositions: z.tuple([z.number(), z.number()]), examples: z.array(z.tuple([z.number(), z.number()])),
  content: electionCopySchema,
}).refine((m) => [...m.initialPositions, ...m.examples.flat()].every((p) => m.positions.includes(p)), 'Election choices must exist');

export function validateElectionCopy(source: ElectionCopy, target: ElectionCopy): void {
  const slots = (value: string) => [...value.matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort().join(',');
  for (const key of Object.keys(source) as (keyof ElectionCopy)[]) {
    if (slots(source[key]) !== slots(target[key])) throw new Error(`Changed election placeholders: ${key}`);
  }
}
