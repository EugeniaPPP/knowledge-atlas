import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { createHash } from 'node:crypto';
import migration from '../fixtures/lecture-02-approved/migration.json';
import { chapter, models, tasks } from '../../src/content/chapters/yale-econ-159/lecture-02/data';
import fixtures from '../fixtures/lecture-02-approved/payoff-matrices.json';
const read = (path: string) => readFileSync(new URL(`../../${path}`, import.meta.url), 'utf8');
const base = 'src/content/chapters/yale-econ-159/lecture-02/';
const normalize = (text: string) => text.replace(/>\s+</g, '><').replace(/\s+/g, ' ').trim();

test('all three Lecture 2 editions preserve the approved source through reversible technical migration', () => {
  for (const mode of ['core', 'quick', 'mastery'] as const) {
    const approved = read(`tests/fixtures/lecture-02-approved/${mode}.md`);
    assert.equal(createHash('sha256').update(approved).digest('hex'), migration.sourceSha256[mode]);
    const localHandoff = new URL(`../../references/handoff-lecture-02/content/lecture-02/${mode[0].toUpperCase() + mode.slice(1)}_Lecture_02_REVIEW.md`, import.meta.url);
    if (existsSync(localHandoff)) assert.equal(approved, readFileSync(localHandoff, 'utf8'));
    let restored = read(base + mode + '.mdx').replace(/^---\n[\s\S]*?\n---\n\n/, '').replace(/^import .*;\n/gm, '')
      .replace(/<\/?CoreStep(?: [^>]*)?>/g, '').replace(/<\/?Exercise(?: [^>]*)?>/g, '')
      .replace(/<MasteryScore [^>]*\/>/g, '');
    for (const pair of [...migration.replacements[mode]].reverse()) {
      if ('all' in pair && pair.all) restored = restored.split(pair.mdx).join(pair.source);
      else { assert.ok(restored.includes(pair.mdx), `${mode}: ${pair.mdx}`); restored = restored.replace(pair.mdx, pair.source); }
    }
    restored = migration.sourceHeaders[mode] + restored + (mode === 'core' ? migration.coreSourceNotes : '');
    assert.equal(normalize(restored), normalize(approved), mode);
  }
  const sourceNotes = read(base + 'source-notes.mdx').replace(/className=/g, 'class=');
  assert.ok(normalize(sourceNotes).includes(normalize(migration.coreSourceNotes)));
  for (const note of migration.editorialNotes) assert.ok(normalize(sourceNotes).includes(normalize(note.text)), note.task);
});
test('Lecture 2 metadata and structured assessments match reviewed blocks and answer lists', () => {
  assert.deepEqual(chapter.availableLocales, ['ru']); assert.equal(chapter.steps.length, 8);
  assert.equal(tasks.length, 7); assert.equal(new Set(tasks.flatMap((t) => t.parts.map((p) => p.id))).size, 9);
  const source = read('tests/fixtures/lecture-02-approved/mastery.md');
  const groups = [...source.matchAll(/(?:^- [A-D]\. .*(?:\n|$))+/gm)].map((m) => [...m[0].matchAll(/^- ([A-D])\. (.*)$/gm)].map((o) => ({ id: o[1].toLowerCase(), text: o[2] })));
  assert.deepEqual(tasks.flatMap((t) => t.parts).filter((p) => p.kind === 'choice').map((p) => p.options), groups);
  for (const task of tasks) if (task.modelId) assert.ok(models[task.modelId]);
  for (const [id, fixture] of [['abstract', 0], ['hannibal', 1], ['mastery-two', 3], ['mastery-three', 4], ['mastery-four', 5]] as const) {
    assert.deepEqual(models[id].payoffs, fixtures[fixture].payoffs);
    assert.deepEqual(models[id].rows, fixtures[fixture].rowStrategies);
    assert.deepEqual(models[id].columns, fixtures[fixture].columnStrategies);
  }
  for (const part of tasks.flatMap((t) => t.parts).filter((p) => p.kind === 'choice')) assert.equal(part.correct, 'b');
  assert.deepEqual(tasks[4].parts.map((p) => p.correct), [45, 22]);
  for (const concept of chapter.conceptIds) assert.ok(existsSync(new URL(`../../src/content/concepts/${concept}.json`, import.meta.url)));
});
