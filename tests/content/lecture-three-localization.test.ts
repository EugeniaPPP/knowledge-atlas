import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import * as ru from '../../src/content/chapters/yale-econ-159/lecture-03/data';
import * as en from '../../src/content/chapters/yale-econ-159/lecture-03/en/data';
import { translateAssessmentTasks, spatialAssessmentTranslationSchema, translateChapter } from '../../src/lib/content/translations';
import { validateElectionCopy } from '../../src/lib/content/election';
import { completeStep, exportState, initialState, parseImport } from '../../src/lib/learning/state';
import { changePart, taskCorrect } from '../../src/lib/learning/assessment';
const path='src/content/chapters/yale-econ-159/lecture-03/';
const read=(file:string)=>readFileSync(file,'utf8');

test('Lecture 3 English inherits every numerical model, answer key and source locator',()=>{
  assert.equal(en.chapter.locale,'en');assert.equal(en.chapter.reviewOnly,false);
  assert.deepEqual(en.chapter.steps.map(({title,...s})=>s),ru.chapter.steps.map(({title,...s})=>s));
  assert.deepEqual(en.chapter.sourceLinks.map(s=>s.url),ru.chapter.sourceLinks.map(s=>s.url));
  assert.deepEqual(en.chapter.conceptIds,ru.chapter.conceptIds);
  assert.equal(en.config.chapterId,ru.config.chapterId);assert.equal(en.config.contentVersion,ru.config.contentVersion);
  assert.equal(en.election.positions,ru.election.positions);assert.equal(en.election.examples,ru.election.examples);
  assert.deepEqual({...en.election,content:undefined},{...ru.election,content:undefined});
  for(const [id,model] of Object.entries(ru.models))assert.deepEqual({...en.models[id],caption:undefined,locale:undefined,players:undefined},{...model,caption:undefined,locale:undefined,players:undefined});
  const contract=(tasks:typeof ru.tasks)=>tasks.map(t=>({...t,parts:t.parts.map(p=>({...p,label:undefined,...(p.kind==='choice'?{options:p.options.map(o=>({id:o.id}))}:{})}))}));
  assert.deepEqual(contract(en.tasks),contract(ru.tasks));
  assert.doesNotMatch(JSON.stringify(en.translation),/[А-Яа-яЁё]/u);
});

test('English copy is complete; missing parts, options and changed placeholders fail',()=>{
  const missingTask=structuredClone(en.translation.exerciseCopy);delete missingTask.m01;
  assert.throws(()=>translateAssessmentTasks(ru.tasks,missingTask),/Incomplete/);
  const missingOption=structuredClone(en.translation.exerciseCopy);delete missingOption.m01.parts['m01-proof'].options!.b;
  assert.throws(()=>translateAssessmentTasks(ru.tasks,missingOption),/Incomplete/);
  const missingLabel=structuredClone(en.translation) as unknown as {interactions:{election:Record<string,string>}};delete missingLabel.interactions.election.region;
  assert.equal(spatialAssessmentTranslationSchema.safeParse(missingLabel).success,false);
  assert.throws(()=>validateElectionCopy(ru.election.content,{...en.election.content,example:'Missing {second}'}),/placeholders/);
  assert.throws(()=>translateChapter(ru.chapter,{...en.translation,basedOnContentVersion:'stale'}),/Stale/);
});

test('all three English modes preserve step IDs, exercise parts, numerical tables and optional depth',()=>{
  for(const mode of ['core','quick','mastery']){
    const a=read(path+mode+'.mdx'),b=read(path+'en/'+mode+'.mdx');
    assert.match(b,/locale: en/);assert.doesNotMatch(b,/[А-Яа-яЁё]/u);
    for(const pattern of [/<CoreStep id="([^"]+)"/g,/partId="([^"]+)"/g,/<section[^>]* id="([^"]+)"/g])assert.deepEqual([...b.matchAll(pattern)].map(m=>m[1]),[...a.matchAll(pattern)].map(m=>m[1]));
    assert.equal((b.match(/<details\b/g)||[]).length,(a.match(/<details\b/g)||[]).length);
    const tables=(text:string)=>text.split('\n').filter(s=>s.startsWith('|')).map(s=>s.replace(/(\d),(?=\d)/g,'$1.').match(/\d+(?:\.\d+)?|[≤<>]|&lt;/g)||[]);
    assert.deepEqual(tables(b),tables(a),`${mode}: table values and boundaries`);
  }
  const core=read(path+'en/core.mdx');assert.deepEqual([...core.matchAll(/^## \d+\. (.+)$/gm)].map(m=>m[1]),en.chapter.steps.map(s=>s.title));
  assert.match(core,/probability that the opponent chooses R/);assert.match(core,/neither player/i);assert.match(core,/not a boundary between best-response regions/);
  assert.doesNotMatch(read(path+'en/source-notes.mdx'),/[А-Яа-яЁё]/u);
});

test('switching language neither resets nor translates synthetic learner state',()=>{
  let state=completeStep({...initialState(ru.config),notes:{reflection:'Моя заметка / my note',essay:'Два кандидата ≠ три.'}},ru.config.stepIds[0],ru.config);
  for(const [index,answer] of ['15','20','b'].entries())state=changePart(state,ru.tasks[0],ru.tasks[0].parts[index].id,answer);
  for(const p of ru.tasks[0].parts)state.answers[p.id].checked=true;
  assert.deepEqual(parseImport(exportState(state),en.config),state);
  assert.equal(taskCorrect(en.tasks[0],state),true);
});
