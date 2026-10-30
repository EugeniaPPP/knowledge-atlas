import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { createHash } from 'node:crypto';
import * as ru from '../../src/content/chapters/yale-econ-159/lecture-01/data';
import * as en from '../../src/content/chapters/yale-econ-159/lecture-01/en/data';
import { translateChapter, validateTranslation } from '../../src/lib/content/translations';
import { getUI } from '../../src/i18n/ui';
import terminology from '../../src/content/terminology/game-theory.json';
import { completeStep, initialState, exportState, parseImport } from '../../src/lib/learning/state';
import { storageKey } from '../../src/lib/learning/store';

const path = 'src/content/chapters/yale-econ-159/lecture-01/';
const read = (name: string) => readFileSync(new URL(`../../${name}`, import.meta.url), 'utf8');
const source = (name: string, locale = 'ru') => read(path + (locale === 'en' ? 'en/' : '') + name);
test('both complete editions share step IDs, source locators, models and assessment contracts', () => {
  assert.equal(en.chapter.locale, 'en');
  assert.deepEqual(en.chapter.steps.map(({ title, ...s }) => s), ru.chapter.steps.map(({ title, ...s }) => s));
  assert.deepEqual(en.chapter.sourceLinks.map((s) => s.url), ru.chapter.sourceLinks.map((s) => s.url));
  assert.deepEqual(en.chapter.conceptIds, ru.chapter.conceptIds);
  for (const [id, model] of Object.entries(ru.models)) {
    const { caption, locale, ...data } = model;
    const { caption: enCaption, locale: enLocale, ...enData } = en.models[id];
    assert.deepEqual(enData, data); assert.equal(enLocale, 'en'); assert.notEqual(enCaption, caption);
  }
  validateTranslation(ru.exercises, { activities: ru.activityContent, written: ru.writtenExercise, quickAnswer: ru.quickAnswer }, en.translation);
  assert.equal(en.exercises.length + 1, 7);
  for (const e of [...en.exercises, en.writtenExercise]) assert.ok(e.modelId && en.models[e.modelId]);
  for (const name of ['quick.mdx', 'core.mdx', 'mastery.mdx', 'source-notes.mdx']) {
    assert.ok(source(name, 'en').includes('locale: en'));
    assert.doesNotMatch(source(name, 'en'), /[А-Яа-яЁё]/u);
  }
  assert.doesNotMatch(JSON.stringify(en.translation), /[А-Яа-яЁё]/u);
  const coreRu = source('core.mdx'), coreEn = source('core.mdx', 'en');
  for (const pattern of [/<CoreStep id="([^"]+)"/g, /<Activity kind="([^"]+)"/g]) {
    assert.deepEqual([...coreEn.matchAll(pattern)].map((m) => m[1]), [...coreRu.matchAll(pattern)].map((m) => m[1]));
  }
  assert.equal((coreEn.match(/<details /g) || []).length, (coreRu.match(/<details /g) || []).length);
  const headings = [...coreEn.matchAll(/^## \d+\. (.+)$/gm)].map((m) => m[1]);
  assert.deepEqual(headings, en.chapter.steps.map((s) => s.title));
  const tables = (text: string) => text.split('\n').filter((line) => line.startsWith('|')).map((line) => line.match(/\d+|[αβ]|B[+−]|\b[AC]\b/g) || []);
  assert.deepEqual(tables(coreEn), tables(coreRu));
  assert.match(coreEn, /238 people/); assert.match(coreEn, /\*\*36\*\*/);
});

test('stale translations and changed answer keys are rejected before publication', () => {
  assert.throws(() => translateChapter(ru.chapter, { ...en.translation, basedOnContentVersion: 'old' }), /Stale/);
  assert.throws(() => translateChapter(ru.chapter, { ...en.translation, chapter: { ...en.translation.chapter, steps: {} } }), /Incomplete/);
  const changed = structuredClone(en.translation); changed.exercises[0].correct = 'b';
  assert.throws(() => validateTranslation(ru.exercises, { activities: ru.activityContent, written: ru.writtenExercise, quickAnswer: ru.quickAnswer }, changed), /contracts differ/);
});

test('concept graph and UI placeholders remain equivalent across languages', () => {
  const names = readdirSync(new URL('../../src/content/concepts/', import.meta.url)).filter((f) => f.endsWith('.json'));
  assert.deepEqual(readdirSync(new URL('../../src/content/concepts/en/', import.meta.url)).sort(), names.sort());
  for (const file of names) {
    const { title, definition, ...a } = JSON.parse(read(`src/content/concepts/${file}`));
    const { title: translated, definition: translatedDefinition, locale, ...b } = JSON.parse(read(`src/content/concepts/en/${file}`));
    assert.deepEqual(b, a); assert.equal(locale, 'en');
    assert.ok(translated && translatedDefinition); assert.doesNotMatch(translated + translatedDefinition, /[А-Яа-яЁё]/u);
  }
  const ruUI = getUI('ru'), enUI = getUI('en');
  for (const key of Object.keys(ruUI) as (keyof typeof ruUI)[]) {
    assert.ok(enUI[key]); assert.doesNotMatch(enUI[key], /[А-Яа-яЁё]/u);
    const slots = (text: string) => [...text.matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort();
    assert.deepEqual(slots(enUI[key]), slots(ruUI[key]), key);
  }
});

test('language-independent progress and notes remain compatible with existing exports', () => {
  const state = completeStep({ ...initialState(ru.config), notes: { reflection: 'Моя заметка / my note', essay: 'α > β' }, answers: { m1: { selected: 'a', checked: true } } }, ru.config.stepIds[0], ru.config);
  assert.deepEqual(parseImport(exportState(state), en.config), state);
  assert.equal(storageKey(ru.config.chapterId), storageKey(en.config.chapterId));
});

test('English terminology retains source fingerprints and distinct dominance meanings', () => {
  assert.equal(terminology.version, en.translation.terminologyVersion);
  for (const item of Object.values(terminology.sources)) assert.equal(createHash('sha256').update(readFileSync(new URL(`../../${item.path}`, import.meta.url))).digest('hex'), item.sha256);
  for (const term of terminology.terms) {
    assert.ok(term.ru && term.en && term.evidence.length);
    for (const evidence of term.evidence) assert.ok(evidence.sourceId in terminology.sources);
  }
  assert.equal(terminology.terms.find((t) => t.id === 'strictly-dominant-strategy')?.en, 'strictly dominant strategy');
  assert.equal(terminology.terms.find((t) => t.id === 'strictly-dominated-strategy')?.en, 'strictly dominated strategy');
  assert.match(en.exercises.find((e) => e.id === 'm5')!.explanation, /does not strictly dominate/);
});
