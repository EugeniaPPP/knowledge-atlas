import test from 'node:test';
import assert from 'node:assert/strict';
import { claimSchema, sourceSpanSchema, authoringRunSchema, interactionSpecSchema } from '../../src/lib/content/editorial-schema';
import { activityKinds } from '../../src/lib/content/component-catalog';
import { activityContent, writtenExercise } from '../../src/content/chapters/yale-econ-159/lecture-01/data';

const hash = 'a'.repeat(64);
test('source anchors reject invalid timestamps and unnumbered PDF pages', () => {
  const span = { spanId: 'definition', sourceId: 'yale-transcript', sourceSha256: hash, extractionVersion: '1', excerpt: 'test', excerptSha256: hash, verification: { status: 'unverified' } };
  assert.throws(() => sourceSpanSchema.parse({ ...span, locator: { kind: 'pdf', page: 0 } }));
  assert.throws(() => sourceSpanSchema.parse({ ...span, locator: { kind: 'transcript', segmentId: 'segment-1', startSeconds: 10, endSeconds: 5 } }));
  assert.equal(sourceSpanSchema.parse({ ...span, locator: { kind: 'pdf', page: 2 } }).verification.status, 'unverified');
});
test('unsupported facts may remain draft questions but cannot become verified evidence', () => {
  const claim = { claimId: 'dominance', statement: 'A dominates B', kind: 'fact', status: 'unverified', target: { mode: 'core', blockId: 'definition', blockSha256: hash }, evidence: [] };
  assert.ok(claimSchema.safeParse(claim).success);
  assert.equal(claimSchema.safeParse({ ...claim, status: 'verified' }).success, false);
  assert.ok(claimSchema.safeParse({ ...claim, status: 'verified', evidence: [{ spanId: 'source-1', relation: 'supports' }] }).success);
});
test('a generation run cannot self-approve or claim readiness with unresolved questions', () => {
  const run = { schemaVersion: 1, runId: 'run-1', lessonId: 'lesson-2', status: 'draft', parentRevision: null, inputHashes: {}, guidelinesVersion: '1', skillVersion: '1', model: 'test', outputFiles: [], unresolvedQuestions: ['Missing blackboard'], validation: { passed: true, blockers: [], warnings: [] } };
  assert.ok(authoringRunSchema.safeParse(run).success);
  assert.equal(authoringRunSchema.safeParse({ ...run, status: 'ready_for_review' }).success, false);
  assert.equal(authoringRunSchema.safeParse({ ...run, status: 'approved' }).success, false);
});
test('unknown interactive components require implementation and cannot gate reading', () => {
  const spec = { interactionId: 'test-model', objectiveIds: ['test-objective'], blockId: 'test-block', component: 'Unknown', componentVersion: 1, implementation: 'existing', modelIds: [], states: ['initial'], actions: ['select'], expectedResults: ['compare'], accessibility: ['keyboard'], persistence: 'transient', gatesReading: false };
  assert.equal(interactionSpecSchema.safeParse(spec).success, false);
  assert.ok(interactionSpecSchema.safeParse({ ...spec, implementation: 'needs_implementation' }).success);
  assert.equal(interactionSpecSchema.safeParse({ ...spec, implementation: 'needs_implementation', gatesReading: true }).success, false);
});
test('all chapter demonstrations have editable educational copy outside React', () => {
  assert.deepEqual(Object.keys(activityContent), [...activityKinds]);
  assert.ok(writtenExercise.prompt && writtenExercise.rubric);
});
