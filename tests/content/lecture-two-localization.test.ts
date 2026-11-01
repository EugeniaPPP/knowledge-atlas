import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import * as ru from '../../src/content/chapters/yale-econ-159/lecture-02/data';
import * as en from '../../src/content/chapters/yale-econ-159/lecture-02/en/data';
import { validateAssessmentTranslation, translateModels, translateChapter } from '../../src/lib/content/translations';
import { analyzePayoffs } from '../../src/lib/games/dominance';
import { completeStep, initialState, exportState, parseImport } from '../../src/lib/learning/state';
import { savePrediction, snapshotPrediction } from '../../src/lib/learning/predictions';
const source = (mode: string, locale: 'ru' | 'en') => readFileSync(`src/content/chapters/yale-econ-159/lecture-02/${locale === 'en' ? 'en/' : ''}${mode}.mdx`, 'utf8');
test('Lecture 2 editions share all numerical models, roles, steps, sources and assessment keys', () => {
  assert.equal(en.chapter.locale, 'en');
  assert.deepEqual(en.chapter.steps.map(({ title, ...s }) => s), ru.chapter.steps.map(({ title, ...s }) => s));
  assert.deepEqual(en.chapter.sourceLinks.map((s) => s.url), ru.chapter.sourceLinks.map((s) => s.url));
  validateAssessmentTranslation(ru.tasks, ru.interactions, en.translation);
  for (const [id, model] of Object.entries(ru.models)) {
    const translated = en.models[id]; assert.equal(translated.locale, 'en');
    assert.deepEqual(translated.payoffs, model.payoffs); assert.deepEqual(translated.rows, model.rows); assert.deepEqual(translated.columns, model.columns);
    assert.ok(translated.players); assert.doesNotMatch(JSON.stringify(translated.players), /[А-Яа-яЁё]/u);
    for (const player of ['row', 'column'] as const) assert.deepEqual(analyzePayoffs(translated, player), analyzePayoffs(model, player));
  }
  assert.deepEqual(en.tasks[4].parts.map((p) => p.correct), [45, 22]);
  assert.doesNotMatch(JSON.stringify(en.translation), /[А-Яа-яЁё]/u);
});
test('Lecture 2 translation rejects changed answers, perspective visibility, procedures and missing role copy', () => {
  const answer = structuredClone(en.translation); answer.exercises[4].parts[1].correct = 23;
  assert.throws(() => validateAssessmentTranslation(ru.tasks, ru.interactions, answer), /assessment contracts/);
  const view = structuredClone(en.translation); view.interactions.hats.views[1].unknownPerson = 1;
  assert.throws(() => validateAssessmentTranslation(ru.tasks, ru.interactions, view), /interaction contracts/);
  const bound = structuredClone(en.translation); bound.interactions.elimination.levels[1].max = 68;
  assert.throws(() => validateAssessmentTranslation(ru.tasks, ru.interactions, bound), /interaction contracts/);
  assert.throws(() => translateModels(ru.models, { ...en.translation, modelPlayers: {} }), /player labels/);
  assert.throws(() => translateChapter(ru.chapter, { ...en.translation, basedOnContentVersion: 'old' }), /Stale/);
});
test('Lecture 2 MDX keeps parallel steps, interactions, optional depth and full exercise explanations', () => {
  for (const mode of ['quick', 'core', 'mastery', 'source-notes']) {
    const a = source(mode, 'ru'), b = source(mode, 'en'); assert.doesNotMatch(b, /[А-Яа-яЁё]/u);
    assert.equal((b.match(/<details(?: |>|\n)/g) || []).length, (a.match(/<details(?: |>|\n)/g) || []).length, mode);
    for (const pattern of [/<CoreStep id="([^"]+)"/g, /<Exercise task=\{taskById\["([^"]+)"\]/g, /partId="([^"]+)"/g]) assert.deepEqual([...b.matchAll(pattern)].map((m) => m[1]), [...a.matchAll(pattern)].map((m) => m[1]), mode);
    for (const component of ['NumberGuess', 'PayoffMatrix', 'CommonKnowledgeHats', 'StrategyElimination', 'ConceptChain', 'SelfExplanation', 'CheckTask', 'MasteryScore']) assert.equal((b.match(new RegExp(`<${component}[ >]`, 'g')) || []).length, (a.match(new RegExp(`<${component}[ >]`, 'g')) || []).length, `${mode}/${component}`);
  }
  const core = source('core', 'en');
  assert.deepEqual([...core.matchAll(/^## \d+\. (.+)$/gm)].map((m) => m[1]), en.chapter.steps.map((s) => s.title));
  for (const phrase of ['R is strictly dominated', 'does not beat L', 'Rationality alone does not guarantee', 'not an exact best-response', 'conditional theoretical conclusion', 'median choice was 9', 'about 3–4', 'guess based on raised hands', 'neither knows that the other knows']) assert.ok(core.includes(phrase), phrase);
  assert.equal((source('mastery', 'en').match(/<details data-task-solution hidden>/g) || []).length, 7);
  assert.match(source('mastery', 'en'), /\*\*100 players\*\*/); assert.match(source('mastery', 'en'), /22\.5/);
});
test('language switches preserve the exact Lecture 2 document, including snapshots, answers and verbatim writing', () => {
  let state = completeStep(initialState(ru.config), ru.config.stepIds[0], ru.config);
  state = savePrediction(snapshotPrediction(state, '42', 'yale-econ-159/lecture-01'), 'revised', '9');
  state.answers['m05-first'] = { selected: '45', checked: true }; state.notes.essay = 'Моя заметка / my own explanation';
  assert.deepEqual(parseImport(exportState(state), en.config), state);
  assert.equal(en.config.chapterId, ru.config.chapterId); assert.equal(en.config.contentVersion, ru.config.contentVersion);
});
