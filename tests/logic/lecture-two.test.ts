import test from 'node:test';
import assert from 'node:assert/strict';
import cases from '../fixtures/lecture-02-approved/payoff-matrices.json';
import { modelSchema } from '../../src/lib/content/schema';
import { analyzePayoffs, compareStrategies } from '../../src/lib/games/dominance';
import { initialState, exportState, parseImport } from '../../src/lib/learning/state';
import { taskChecked, taskCorrect, changePart, validPart } from '../../src/lib/learning/assessment';
import { savePrediction, snapshotPrediction, savedNumber, predictionKeys as k } from '../../src/lib/learning/predictions';
import { config, tasks } from '../../src/content/chapters/yale-econ-159/lecture-02/data';

for (const fixture of cases) for (const player of ['row', 'column'] as const) test(`pure-strategy fixture: ${fixture.id}, ${player}`, () => {
  const model = modelSchema.parse({ id: 'fixture', caption: 'Fixture', rows: fixture.rowStrategies, columns: fixture.columnStrategies, payoffs: fixture.payoffs });
  const result = analyzePayoffs(model, player), expected = fixture.expected[player];
  assert.deepEqual(result.bestRepliesByOpponent.map((group) => group.map((s) => result.names[s])), expected.bestRepliesByOpponent);
  for (const relation of ['strict', 'weak'] as const) {
    assert.deepEqual(result.names.filter((_, s) => result.dominant[s] === relation), expected[`${relation}Dominant`]);
    assert.deepEqual(result.names.filter((_, s) => result.dominated[s]?.kind === relation), expected[`${relation}Dominated`]);
  }
});
test('dominance distinguishes exact ties, strict priority and malformed models', () => {
  assert.equal(compareStrategies([0, -1], [0, -1]), null);
  assert.equal(compareStrategies([0, -1], [-1, -2]), 'strict');
  assert.equal(compareStrategies([0, -1], [0, -2]), 'weak');
  for (const [a, b] of [[[], []], [[1], [1, 2]], [[Infinity], [0]]]) assert.throws(() => compareStrategies(a, b));
  for (const payoffs of [[], [[[1, 2]]], [[[NaN, 0], [0, 0]], [[0, 0], [0, 0]]]]) assert.equal(modelSchema.safeParse({ id: 'bad', caption: '', rows: ['A', 'B'], columns: ['X', 'Y'], payoffs }).success, false);
  const single = modelSchema.parse({ id: 'single', caption: '', rows: ['A'], columns: ['X'], payoffs: [[[0, 0]]] });
  assert.deepEqual(analyzePayoffs(single, 'row').dominant, [null]);
});
test('multipart checking is atomic and scores seven tasks, not nine answer parts', () => {
  let state = initialState(config); const task = tasks[2];
  for (const part of task.parts) state = changePart(state, task, part.id, 'b');
  assert.equal(taskChecked(task, state), false);
  for (const part of task.parts) state.answers[part.id].checked = true;
  assert.equal(taskCorrect(task, state), true);
  state = changePart(state, task, task.parts[0].id, 'a');
  assert.equal(taskChecked(task, state), false);
  assert.ok(task.parts.every((part) => !state.answers[part.id].checked));
  assert.equal(tasks.length, 7); assert.equal(tasks.flatMap((t) => t.parts).length, 9);
});
test('half-average exercise accepts 45 then 22, rejects 23 and invalid numbers', () => {
  const task = tasks[4]; let state = initialState(config);
  for (const [i, part] of task.parts.entries()) state.answers[part.id] = { selected: i === 0 ? '45' : '23', checked: true };
  assert.equal(taskCorrect(task, state), false);
  state.answers[task.parts[1].id].selected = '22'; assert.equal(taskCorrect(task, state), true);
  for (const value of ['', '2.2', 'Infinity', '0', '91', ' 22', '2e1']) assert.equal(validPart(task.parts[1], value), false, value);
  state.answers[task.parts[1].id].selected = ''; assert.equal(taskChecked(task, state), false);
});
test('original prediction survives revisions, source changes, chapter export/import and reset', () => {
  let state = initialState(config);
  assert.equal(savedNumber(undefined), undefined); assert.equal(savedNumber('33.3'), undefined);
  state = snapshotPrediction(state, '42', 'yale-econ-159/lecture-01');
  state = savePrediction(state, 'current', '18'); state = savePrediction(state, 'revised', '9');
  state = snapshotPrediction(state, '77', 'yale-econ-159/lecture-01');
  assert.deepEqual([state.responses[k.original], state.responses[k.current], state.responses[k.revised]], ['42', '18', '9']);
  assert.deepEqual(parseImport(exportState(state), config), state);
  assert.equal(initialState(config).responses[k.original], undefined);
  const direct = savePrediction(initialState(config), 'current', '27');
  assert.equal(direct.responses[k.original], '27');
  assert.throws(() => savePrediction(state, 'current', '101'));
  assert.throws(() => parseImport(JSON.stringify({ app: 'Knowledge Atlas 1', progress: [] }), config));
});
