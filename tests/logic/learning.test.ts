import test from 'node:test';
import assert from 'node:assert/strict';
import { completeStep, initialState, parseImport, exportState, normalizeState } from '../../src/lib/learning/state';
import { createStore, storageKey } from '../../src/lib/learning/store';
import { dominatedRows, twoThirdsAverage } from '../../src/lib/games/payoffs';
import { config, models } from '../../src/content/chapters/yale-econ-159/lecture-01/data';

test('unlocked reading, completion and reveal-all are independent', () => {
  const start = initialState(config);
  assert.deepEqual(start.unlockedStepIds, [config.stepIds[0]]);
  assert.equal(completeStep(start, config.stepIds[2], config), start);
  const next = completeStep(start, config.stepIds[0], config);
  assert.deepEqual(next.completedStepIds, [config.stepIds[0]]);
  assert.ok(next.unlockedStepIds.includes(config.stepIds[1]));
  const all = { ...next, reading: { ...next.reading, revealAll: true } };
  assert.equal(all.completedStepIds.length, 1);
  const last = completeStep(all, config.stepIds.at(-1)!, config);
  assert.equal(last.completedStepIds.length, 2);
  assert.equal(completeStep(last, config.stepIds[0], config).completedStepIds.length, 2);
});
test('exports round-trip Unicode notes and answers; incompatible imports are rejected', () => {
  const state = initialState(config);
  state.notes = { reflection: 'Выбрал β. Учитываю справедливость.', essay: '<script>только текст</script>' };
  state.answers.m1 = { selected: 'a', checked: true };
  state.responses['mastery-m5-partner'] = '0';
  state.answers.m5 = { selected: 'aa', checked: true };
  assert.deepEqual(parseImport(exportState(state), config), state);
  assert.throws(() => parseImport('{', config));
  assert.throws(() => parseImport(exportState(state).replace('"schemaVersion": 1', '"schemaVersion": 99'), config));
  assert.throws(() => normalizeState({ ...state, chapterId: 'other' }, config));
  assert.throws(() => parseImport('x'.repeat(2_000_001), config));
});
test('known prototype export migrates positional progress and all personal responses', () => {
  const state = parseImport(JSON.stringify({ app: 'Knowledge Atlas 1', progress: { mode: 'mastery', done: [true, false, false, false, false, false, false, false], unlocked: 1, allOpen: true, mastery: { m1: { selected: 'a', checked: true } }, essay: 'Объяснение' }, notes: { first: 'β', number: '42', reflection: 'Заметка' } }), config);
  assert.deepEqual(state.completedStepIds, [config.stepIds[0]]);
  assert.equal(state.responses.first, 'β'); assert.equal(state.responses.number, '42');
  assert.equal(state.notes.essay, 'Объяснение'); assert.equal(state.notes.reflection, 'Заметка');
  assert.equal(state.reading.mode, 'mastery'); assert.equal(state.reading.revealAll, true);
});
test('metadata changes keep known progress and preserve notes', () => {
  const state = completeStep(initialState(config), config.stepIds[0], config);
  state.notes.reflection = 'Keep';
  const changed = normalizeState(state, { ...config, stepIds: [config.stepIds[0], 'new-step'] });
  assert.deepEqual(changed.completedStepIds, [config.stepIds[0]]);
  assert.ok(changed.unlockedStepIds.includes('new-step'));
  assert.equal(changed.notes.reflection, 'Keep');
});
test('dominance and number-game examples match the educational models', () => {
  assert.deepEqual(dominatedRows(models['grade-game']), [1]);
  assert.deepEqual(dominatedRows(models.fairness), []);
  assert.deepEqual(dominatedRows(models['mastery-one']), [1]);
  assert.deepEqual(dominatedRows(models['mastery-two']), [0]);
  assert.equal(twoThirdsAverage([25, 5, 60]), 20);
  assert.throws(() => twoThirdsAverage([])); assert.throws(() => twoThirdsAverage([0]));
});
test('storage failures remain visible and never falsely promise persistence', () => {
  const values = new Map<string, string>();
  const storage = { getItem: (k: string) => values.get(k) || null,
    setItem: () => { throw new Error('quota'); }, removeItem: (k: string) => { values.delete(k); } };
  Object.defineProperty(globalThis, 'window', { value: { localStorage: storage }, configurable: true });
  try {
    const store = createStore(config); store.load();
    store.update((s) => ({ ...s, notes: { ...s.notes, essay: 'Retained in memory' } }));
    assert.equal(store.getSnapshot().persistence, 'memory');
    assert.equal(store.getSnapshot().state.notes.essay, 'Retained in memory');
    assert.ok(store.getSnapshot().message);
    assert.equal(values.get(storageKey(config.chapterId)), undefined);
  } finally { Reflect.deleteProperty(globalThis, 'window'); }
});
