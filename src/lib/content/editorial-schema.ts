/** Data contracts for future authoring. No generation, approval or publication actions. */
import { z } from 'zod';
import { identifier, modeSchema } from './schema';
import { componentCatalog } from './component-catalog';

export const sha256 = z.string().regex(/^[a-f0-9]{64}$/);
export const sourceSchema = z.object({
  schemaVersion: z.literal(1), sourceId: identifier,
  kind: z.enum(['transcript', 'summary', 'blackboard', 'research']),
  title: z.string().min(1), author: z.string().min(1),
  originalUrl: z.url().optional(), localPath: z.string().optional(),
  retrievedAt: z.iso.date(), sha256,
  pageCount: z.number().int().positive().optional(),
  attribution: z.string(), publicationPolicy: z.enum(['link-only', 'approved-excerpt', 'unknown']),
}).refine((s) => !!(s.originalUrl || s.localPath), 'Source requires an original URL or path');

const timeLocator = z.object({ kind: z.literal('transcript'), segmentId: identifier,
  startSeconds: z.number().int().nonnegative(), endSeconds: z.number().int().positive() })
  .refine((s) => s.endSeconds > s.startSeconds, 'Timestamp range must increase');
const pdfLocator = z.object({ kind: z.literal('pdf'), page: z.number().int().positive(),
  region: z.tuple([z.number().min(0).max(1), z.number().min(0).max(1), z.number().min(0).max(1), z.number().min(0).max(1)]).optional() })
  .refine((s) => !s.region || (s.region[2] > s.region[0] && s.region[3] > s.region[1]), 'Region uses ordered normalized bounds');
export const sourceSpanSchema = z.object({
  spanId: identifier, sourceId: identifier, sourceSha256: sha256, extractionVersion: z.string().min(1),
  locator: z.union([timeLocator, pdfLocator, z.object({ kind: z.literal('web'), url: z.url(), section: z.string().min(1) })]),
  excerpt: z.string().max(4000), excerptSha256: sha256,
  verification: z.object({ status: z.enum(['unverified', 'verified']), method: z.enum(['text-match', 'visual-review']).optional(), note: z.string().optional() }),
});
export const claimSchema = z.object({
  claimId: identifier, statement: z.string().min(1), kind: z.enum(['fact', 'definition', 'derivation', 'example', 'editorial']),
  status: z.enum(['unverified', 'verified', 'disputed']),
  target: z.object({ mode: modeSchema, blockId: identifier, blockSha256: sha256 }),
  evidence: z.array(z.object({ spanId: identifier, relation: z.enum(['supports', 'contradicts', 'context']) })),
  premiseClaimIds: z.array(identifier).default([]), reasoning: z.string().optional(), assumptions: z.array(z.string()).default([]),
}).superRefine((c, ctx) => {
  if (c.status !== 'verified') return;
  if (['fact', 'definition'].includes(c.kind) && !c.evidence.some((e) => e.relation === 'supports'))
    ctx.addIssue({ code: 'custom', message: 'Verified factual claims require supporting evidence' });
  if (c.kind === 'derivation' && (!c.premiseClaimIds.length || !c.reasoning))
    ctx.addIssue({ code: 'custom', message: 'Derivations require premises and reasoning' });
  if (c.kind === 'example' && !c.assumptions.length)
    ctx.addIssue({ code: 'custom', message: 'Authored examples require explicit assumptions' });
});
export const interactionSpecSchema = z.object({
  interactionId: identifier, objectiveIds: z.array(identifier).min(1), blockId: identifier,
  component: z.string().min(1), componentVersion: z.number().int().positive(),
  implementation: z.enum(['existing', 'needs_implementation']), modelIds: z.array(identifier),
  states: z.array(z.string()).min(1), actions: z.array(z.string()).min(1), expectedResults: z.array(z.string()).min(1),
  accessibility: z.array(z.string()).min(1), persistence: z.enum(['transient', 'response', 'note']),
  gatesReading: z.literal(false),
}).refine((s) => s.implementation === 'needs_implementation' || Object.hasOwn(componentCatalog, s.component), 'Existing component must be registered');
export const authoringRunSchema = z.object({
  schemaVersion: z.literal(1), runId: identifier, lessonId: identifier,
  status: z.enum(['draft', 'ready_for_review']), parentRevision: z.string().nullable(),
  inputHashes: z.record(z.string(), sha256), guidelinesVersion: z.string(), skillVersion: z.string(), model: z.string(),
  outputFiles: z.array(z.string()), unresolvedQuestions: z.array(z.string()),
  validation: z.object({ passed: z.boolean(), blockers: z.array(z.string()), warnings: z.array(z.string()) }),
}).refine((r) => r.status === 'draft' || (r.validation.passed && !r.validation.blockers.length && !r.unresolvedQuestions.length), 'Readiness requires resolved blockers and questions');
export const editorialDecisionSchema = z.object({
  schemaVersion: z.literal(1), actor: z.literal('human'), decision: z.enum(['approved', 'changes_requested']),
  lessonId: identifier, revision: z.string(), packageSha256: sha256, reviewedInputSha256: sha256,
  reviewer: z.string().min(1), decidedAt: z.iso.datetime(), decisionRef: z.string().min(1), notes: z.string(),
});
