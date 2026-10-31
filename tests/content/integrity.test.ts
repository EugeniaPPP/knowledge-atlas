import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { createHash } from 'node:crypto';
import hashes from './reference-hashes.json';
import { chapter, models, exercises, writtenExercise } from '../../src/content/chapters/yale-econ-159/lecture-01/data';
import { activityKinds } from '../../src/lib/content/component-catalog';
import { chapter as chapterTwo } from '../../src/content/chapters/yale-econ-159/lecture-02/data';

const read = (path: string) => readFileSync(new URL(`../../${path}`, import.meta.url), 'utf8');
test('all approved reference files retain their original bytes', () => {
  for (const [path, expected] of Object.entries(hashes)) {
    const actual = createHash('sha256').update(readFileSync(new URL(`../../${path}`, import.meta.url))).digest('hex');
    assert.equal(actual, expected, path);
  }
});
test('Core migration preserves the complete approved source, excluding technical wrapping whitespace', () => {
  const mdx = read('src/content/chapters/yale-econ-159/lecture-01/core.mdx');
  const notes = read('src/content/chapters/yale-econ-159/lecture-01/source-notes.mdx').replace(/^---\n[\s\S]*?\n---\n\n/, '');
  const restored = chapter.sourceHeader + mdx
    .replace(/^---\n[\s\S]*?\n---\n\n/, '')
    .replace(/^import .*;\n/gm, '')
    .replace(/<\/?CoreStep(?: [^>]*)?>/g, '')
    .replace(/<Activity kind="([a-z-]+)" [^>]*\/>/g, '<!-- interactive:$1 -->')
    .replace(/<details className="extra">/g, '<details class="extra">') + '\n' + notes;
  const normalize = (text: string) => text.replace(/>\s+</g, '><').replace(/\s+/g, ' ').trim();
  assert.equal(normalize(restored), normalize(read('references/content/Core_Lecture_01_v3.md')));
  assert.equal([...mdx.matchAll(/<CoreStep /g)].length, chapter.steps.length);
  assert.deepEqual([...mdx.matchAll(/<Activity kind="([a-z-]+)"/g)].map((m) => m[1]), [...activityKinds]);
});
test('models and exercises have valid references and all concept links resolve', () => {
  const names = readdirSync(new URL('../../src/content/concepts/', import.meta.url)).filter((f) => f.endsWith('.json')).map((f) => f.replace(/\.json$/, ''));
  for (const id of chapter.conceptIds) assert.ok(names.includes(id), id);
  for (const exercise of exercises) if (exercise.modelId) assert.ok(models[exercise.modelId]);
  assert.equal(new Set(exercises.map((e) => e.id)).size, exercises.length);
  for (const name of names) {
    const concept = JSON.parse(read(`src/content/concepts/${name}.json`));
    assert.ok([chapter, chapterTwo].some((c) => c.steps.some((step) => step.id === concept.stepId)), name);
    assert.ok([chapter, chapterTwo].some((c) => c.steps.some((step) => step.conceptIds.includes(concept.id))), name);
    for (const link of [...concept.related, ...concept.prerequisites]) assert.ok(names.includes(link));
  }
});

test('chapter one Mastery includes each required matrix and complete strategy-pair choices', () => {
  // Every current question refers to a game or its numerical outcomes, including the essay.
  for (const exercise of [...exercises, writtenExercise]) {
    assert.ok(exercise.modelId && models[exercise.modelId], `Missing local matrix: ${exercise.id}`);
  }
  for (const exercise of exercises.filter((e) => e.strategySequence)) {
    const model = models[exercise.modelId!], pairs = exercise.strategySequence!.pairs;
    assert.equal(pairs.length, model.rows.length * model.columns.length);
    assert.ok(pairs.every((p) => p.row < model.rows.length && p.column < model.columns.length));
  }
  const mixed = models['fair-selfish'];
  assert.deepEqual(mixed.payoffs, [[[0, 0], [-1, -1]], [[-3, 3], [1, 1]]]);
  for (const row of mixed.payoffs) assert.ok(row[0][1] > row[1][1], 'Partner α must strictly dominate β');
  assert.ok(mixed.payoffs[0][0][0] > mixed.payoffs[1][0][0], 'Own α is the best reply to partner α');
  assert.ok(mixed.payoffs[1][1][0] > mixed.payoffs[0][1][0], 'Own α must not be mistaken for a dominant strategy');
});
