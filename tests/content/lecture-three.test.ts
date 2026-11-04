import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import migration from '../fixtures/lecture-03-approved/migration.json';
import approvedTasks from '../fixtures/lecture-03-approved/assessments.json';
import { chapter, tasks } from '../../src/content/chapters/yale-econ-159/lecture-03/data';
import { chapterSchema } from '../../src/lib/content/schema';
import { chapterVisible } from '../../src/lib/content/visibility';
const read = (path: string) => readFileSync(path, 'utf8');
const normalize = (text: string) => text.replace(/\s+/g, ' ').trim();
test('Lecture 3 RU prose restores exactly through the recorded technical migration', () => {
  for (const mode of ['core','quick','mastery'] as const) {
    const baseline = read(`tests/fixtures/lecture-03-approved/${mode}.mdx`);
    assert.equal(createHash('sha256').update(baseline).digest('hex'), migration.sourceSha256[mode]);
    let restored = read(`src/content/chapters/yale-econ-159/lecture-03/${mode}.mdx`).replace(/^---\n[\s\S]*?\n---\n/, '').replace(/^import .*;\n/gm, '').trimStart();
    for (const pair of [...migration.replacements[mode]].reverse()) {
      assert.ok(restored.includes(pair.mdx), `${mode}: missing ${pair.mdx.slice(0,80)}`);
      restored = pair.all ? restored.split(pair.mdx).join(pair.source) : restored.replace(pair.mdx,pair.source);
    }
    restored = migration.sourceFrontmatter[mode] + migration.removedHeaders[mode] + restored;
    assert.equal(normalize(restored),normalize(baseline),mode);
  }
});
test('only the two requested numeric labels change; 6 task keys and 13 part IDs stay approved', () => {
  const actual = structuredClone(tasks);
  assert.deepEqual(actual[0].parts.slice(0,2).map((p) => p.label), ['Твоя позиция: 1','Твоя позиция: 2']);
  actual[0].parts[0].label = approvedTasks[0].parts[0].label; actual[0].parts[1].label = approvedTasks[0].parts[1].label;
  assert.deepEqual(actual,approvedTasks);
  assert.equal(tasks.length,6); assert.equal(tasks.flatMap((t) => t.parts).length,13);
  assert.equal(chapter.steps.length,7);
  const mdx = read('src/content/chapters/yale-econ-159/lecture-03/core.mdx');
  assert.deepEqual([...mdx.matchAll(/<CoreStep id="([^"]+)"/g)].map((m) => m[1]), chapter.steps.map((s) => s.id));
});
test('approved Lecture 3 is public in both locales; incomplete public editions and private drafts stay gated', () => {
  assert.equal(chapter.reviewOnly,false);assert.equal(chapter.status,'published');assert.deepEqual(chapter.availableLocales,['ru','en']);
  assert.equal(chapterVisible(chapter,false),true);assert.equal(chapterVisible(chapter,true),true);
  assert.equal(chapterVisible({reviewOnly:true},false),false);assert.equal(chapterVisible({reviewOnly:true},true),true);
  assert.equal(chapterSchema.safeParse({...chapter,reviewOnly:false,availableLocales:['ru']}).success,false);
});
