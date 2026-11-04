import test from 'node:test';
import assert from 'node:assert/strict';
import { allocateVoters } from '../../src/lib/games/spatial-voting';
import { analyzePayoffs } from '../../src/lib/games/dominance';
import { modelSchema } from '../../src/lib/content/schema';
import { tasks,models,config } from '../../src/content/chapters/yale-econ-159/lecture-03/data';
import own from '../../src/content/chapters/yale-econ-159/lecture-03/own-payoffs.json';
import { initialState } from '../../src/lib/learning/state';
import { changePart,taskChecked,taskCorrect } from '../../src/lib/learning/assessment';
const positions = Array.from({length:10},(_,i) => i+1),weights = positions.map(() => 10);
test('all 100 election allocations match an independent midpoint vote count', () => {
  for (const first of positions) for (const second of positions) {
    const result = allocateVoters(positions,weights,[first,second]);
    const middle = (first+second)/2;
    const left = positions.reduce((n,p) => n+(p<middle?10:p===middle?5:0),0);
    const expected = first===second?50:first<second?left:100-left;
    assert.deepEqual(result.totals,[expected,100-expected]);
    assert.ok(result.groups.every((g) => g.shares[0]+g.shares[1]===10));
  }
  assert.deepEqual(allocateVoters(positions,weights,[1,3]).groups[1].shares,[5,5]);
  assert.throws(() => allocateVoters(positions,weights,[0,3]),RangeError);
  assert.throws(() => allocateVoters(positions,[10],[1,3]),RangeError);
});
test('the six-position exercise keeps all 60 voters through two strict rounds', () => {
  const voters = [1,2,3,4,5,6],mass = voters.map(() => 10);
  assert.deepEqual(allocateVoters(voters,mass,[1,3]).totals,[15,45]);
  assert.deepEqual(allocateVoters(voters,mass,[2,3]).totals,[20,40]);
  for (const [choices,removed] of [[[1,2,3,4,5,6],[1,6]],[[2,3,4,5],[2,5]],[[3,4],[]]]) {
    const model = modelSchema.parse({id:'six',caption:'',rows:choices.map(String),columns:choices.map(String),payoffs:choices.map((a) => choices.map((b) => allocateVoters(voters,mass,[a,b]).totals))});
    const analysis = analyzePayoffs(model,'row');
    assert.deepEqual(analysis.dominated.flatMap((d,i) => d?[choices[i]]:[]),removed);
    assert.ok(analysis.dominated.filter(Boolean).every((d) => d!.kind==='strict'));
  }
});
test('three candidates split the middle group in thirds, not halves', () => {
  const same = allocateVoters(positions,weights,[2,2,4]),moved = allocateVoters(positions,weights,[3,2,4]);
  assert.deepEqual(same.groups[2].shares,[10/3,10/3,10/3]);
  assert.ok(Math.abs(same.totals[0]-40/3)<1e-12);assert.equal(moved.totals[0],10);
  assert.ok(same.totals[0]>moved.totals[0]);
});
test('all expected-payoff keys retain exact maximizers, including boundary ties', () => {
  const model = models['l03-belief-game'];
  const best = (n:number,q:number) => {
    const values = model.payoffs.map((r) => r[0][0]*(q-n)+r[1][0]*n);
    return values.flatMap((v,i) => v===Math.max(...values)?[model.rows[i]]:[]).sort();
  };
  assert.deepEqual(best(1,4),['U']);assert.deepEqual(best(3,4),['M']);
  assert.deepEqual(best(1,3),['D','U']);assert.deepEqual(best(3,5),['D','M']);assert.deepEqual(best(1,2),['D']);
  assert.deepEqual(own.values.map((r) => (r[0]+r[1])/2),[3,3.5,4]);
  assert.ok(own.values[2][0]<own.values[0][0]&&own.values[2][1]<own.values[1][1]);
});
test('numeric and conceptual parts are checked together and edits invalidate the whole task', () => {
  const task = tasks[0];let state = initialState(config);
  for (const [i,answer] of ['15','20','b'].entries()) state = changePart(state,task,task.parts[i].id,answer);
  assert.equal(taskChecked(task,state),false);
  for (const part of task.parts) state.answers[part.id].checked=true;
  assert.equal(taskCorrect(task,state),true);
  state = changePart(state,task,task.parts[0].id,'16');
  assert.equal(taskChecked(task,state),false);
  assert.ok(task.parts.every((part) => !state.answers[part.id].checked));
});
