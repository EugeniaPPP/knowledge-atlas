import { test, expect, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { mkdirSync, readFileSync } from 'node:fs';
import type { Chapter, AssessmentTask } from '../../src/lib/content/schema';
import { getUI, format } from '../../src/i18n/ui';
import { openContents, openSources } from './helpers/navigation';

const root='/knowledge-atlas',ru=`${root}/courses/yale-econ-159/lecture-03`,en=`${root}/en/courses/yale-econ-159/lecture-03`,t=getUI('en');
const chapter=JSON.parse(readFileSync('src/content/chapters/yale-econ-159/lecture-03/chapter.json','utf8')) as Chapter;
const copy=JSON.parse(readFileSync('src/content/chapters/yale-econ-159/lecture-03/en/content.json','utf8'));
const tasks=JSON.parse(readFileSync('src/content/chapters/yale-econ-159/lecture-03/exercises.json','utf8')) as AssessmentTask[];
const key=`knowledge-atlas:chapter:${chapter.id}`,artifacts='test-results/lecture-three-en';
test.skip(chapter.reviewOnly && process.env.ATLAS_REVIEW!=='1','Requires a local bilingual review build.');
async function ready(page:Page,mode='core',hash=''){
  await page.goto(`${en}/${mode}/${hash}`);await expect(page.locator('[data-reader]')).toHaveAttribute('data-ready','true');
}
async function reveal(page:Page){
  const button=page.locator('[data-toggle-all]');if(await button.getAttribute('aria-pressed')!=='true')await button.click();
  await expect(page.locator('[data-core-step]:visible')).toHaveCount(7);
}
async function switchLanguage(page:Page,locale:'ru'|'en'){
  const link=page.locator(`.language-switcher a[lang=${locale}]`);await link.focus();await link.press('Enter');
}

test('English Lecture 3 has complete modes, English sources, concepts and equivalent language links',async({page})=>{
  const errors:string[]=[];page.on('pageerror',error=>errors.push(error.message));
  for(const mode of ['quick','core','mastery']){
    await ready(page,mode);await expect(page.locator('html')).toHaveAttribute('lang','en');
    await expect(page.locator('h1')).toHaveText(copy.chapter.title);await expect(page.locator('.mode-nav a')).toHaveText(['Quick','Core','Mastery']);
    await expect(page.locator('.language-switcher a[lang=ru]')).toHaveAttribute('href',`${ru}/${mode}/`);
    await expect(page.locator('[data-progress]')).toHaveCount(mode==='core'?1:0);
    if(mode==='core')await reveal(page);
    expect(await page.locator('.narrative').textContent()).not.toMatch(/[А-Яа-яЁё]/u);
    await openContents(page);await expect(page.locator('[data-course-chapter=lecture-03]')).toHaveAttribute('open','');
    await expect(page.locator('[data-course-chapter=lecture-03] .toc a')).toHaveCount(7);await page.keyboard.press('Escape');
    await openSources(page);const sources=page.locator('[data-course-view=sources]');
    await expect(sources).toBeVisible();await expect(sources).toContainText('Editorial adaptations and clarifications');expect(await sources.textContent()).not.toMatch(/[А-Яа-яЁё]/u);
    await page.keyboard.press('Escape');
  }
  for(const [concept,step] of [['expected-payoff','beliefs-and-expectation'],['strategic-belief','beliefs-and-expectation'],['median-voter-theorem','median-and-assumptions']]){
    await page.goto(`${root}/en/concepts/${concept}/`);await page.getByRole('link',{name:t.contextLink}).click();await expect(page).toHaveURL(`${en}/core/#${step}`);await expect(page.locator('#'+step)).toBeVisible();
  }
  await ready(page,'quick');await page.locator('#quick-best-responses').evaluate(el=>el.scrollIntoView({block:'start',behavior:'instant'}));
  await switchLanguage(page,'ru');await expect(page).toHaveURL(`${ru}/quick/#quick-best-responses`);
  await switchLanguage(page,'en');await expect(page).toHaveURL(`${en}/quick/#quick-best-responses`);
  expect(errors).toEqual([]);
});

test('English election controls work by keyboard; all seven steps complete without grading',async({page})=>{
  await ready(page);await expect(page.locator('[data-core-step]:visible')).toHaveCount(1);
  const model=page.locator('.election');await model.getByRole('button',{name:'1 against 2',exact:true}).click();
  await expect(model.locator('[data-vote-total="0"]')).toHaveText('10%');await expect(model.locator('[data-vote-total="1"]')).toHaveText('90%');
  await model.getByRole('button',{name:'1 against 3',exact:true}).click();await expect(model.locator('[data-voter="2"]')).toContainText('C1 5%');
  await model.getByRole('group',{name:'Candidate 1',exact:true}).getByRole('radio',{name:'Position 1',exact:true}).focus();await page.keyboard.press('ArrowRight');
  await expect(model.locator('[data-vote-total="0"]')).toHaveText('20%');await expect(page.locator('[data-progress]')).toHaveAttribute('aria-valuenow','0');
  await model.getByText('Calculation for these positions',{exact:true}).click();await expect(model.getByRole('region',{name:'Calculation for the ten voter groups'})).toBeVisible();
  for(const step of chapter.steps){await page.locator(`[data-complete-step="${step.id}"]`).click();if(step.id!==chapter.steps.at(-1)!.id)await expect(page.locator(`[data-complete-step="${step.id}"]`)).toBeHidden();}
  await expect(page).toHaveURL(`${en}/mastery/`);await expect(page.locator('[data-reader]')).toHaveAttribute('data-ready','true');
  const state=await page.evaluate(k=>JSON.parse(localStorage.getItem(k)!),key);expect(state.completedStepIds).toHaveLength(7);expect(state.answers).toEqual({});
});

test('English grading and RU/EN switching preserve answers, verbatim notes, anchor, progress and appearance',async({page})=>{
  await ready(page);await page.locator('[data-complete-step=election-rules]').click();await reveal(page);
  await ready(page,'core','#best-response-map');await page.locator('#best-response-map').evaluate(el=>el.scrollIntoView({block:'start',behavior:'instant'}));
  await switchLanguage(page,'ru');await expect(page).toHaveURL(`${ru}/core/#best-response-map`);
  await expect(page.locator('[data-progress]')).toHaveAttribute('aria-valuenow','1');await switchLanguage(page,'en');
  await expect(page).toHaveURL(`${en}/core/#best-response-map`);await expect(page.locator('[data-progress]')).toHaveAttribute('aria-valuenow','1');
  await ready(page,'mastery');const first=page.locator('#m01');await expect(first.locator('[data-task-solution]')).toBeHidden();
  for(const task of tasks){const section=page.locator('#'+task.id);for(const part of task.parts){if(part.kind==='integer')await page.locator('#'+part.id).fill(String(part.correct));else await section.locator(`input[name="${part.id}"][value="${part.correct}"]`).check();}await section.getByRole('button',{name:task.parts.length>1?t.checkTask:t.checkAnswer,exact:true}).click();await expect(section.locator('.task-verdict')).toHaveText(t.correct);await expect(section.locator('[data-task-solution]')).toBeVisible();}
  await expect(page.locator('.mastery-score strong')).toHaveText(format(t.correctTasks,{count:6,total:6}));
  const note='Моя заметка / my explanation: two candidates ≠ three.';await page.getByLabel('Your explanation',{exact:true}).fill(note);
  await page.locator('button.theme-switcher').click();await expect(page.locator('html')).toHaveAttribute('data-theme','dark');
  await page.locator('#self-explanation').evaluate(el=>el.scrollIntoView({block:'start',behavior:'instant'}));
  await switchLanguage(page,'ru');await expect(page).toHaveURL(`${ru}/mastery/#self-explanation`);await expect(page.locator('[data-reader]')).toHaveAttribute('data-ready','true');
  await expect(page.getByLabel('Твоё объяснение',{exact:true})).toHaveValue(note);await expect(first.locator('.task-verdict')).toHaveText(getUI('ru').correct);
  await expect(page.locator('html')).toHaveAttribute('data-theme','dark');await page.reload();await expect(page.getByLabel('Твоё объяснение',{exact:true})).toHaveValue(note);
  await switchLanguage(page,'en');await expect(page.getByLabel('Your explanation',{exact:true})).toHaveValue(note);
  await page.locator('#m01-at-one').fill('16');await expect(first.locator('.task-verdict')).toBeEmpty();await expect(first.locator('[data-task-solution]')).toBeHidden();
  expect(await page.evaluate(()=>Object.keys(localStorage).filter(k=>k.includes('lecture-03')))).toEqual([key]);
});

for(const width of [320,390,768,1440])for(const theme of ['light','dark'] as const)test(`English chapter responsive, ${width}px ${theme}`,async({page,browserName})=>{
  await page.setViewportSize({width,height:1000});await page.emulateMedia({colorScheme:theme});
  for(const mode of ['mastery','core','quick']){
    await ready(page,mode);if(mode==='core')await reveal(page);await page.evaluate(()=>document.fonts.ready);
    expect(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),`${mode} horizontal overflow`).toBe(false);
    if(mode==='mastery'){
      const a=await page.locator('#m01-at-one').boundingBox(),b=await page.locator('#m01-at-two').boundingBox();expect(a!.height).toBeGreaterThanOrEqual(52);expect(b!.x).toBeGreaterThan(a!.x);expect(Math.abs(a!.y-b!.y)).toBeLessThan(2);
      await expect(page.locator('#m01 .numeric-answer-unit')).toHaveText(['Votes out of 60','Votes out of 60']);
    }else{
      await page.locator('.payoff-plot').scrollIntoViewIfNeeded();const active=page.locator(`.plot-${theme} img`);await expect(active).toBeVisible();await expect(active).toHaveJSProperty('complete',true);
      expect(await active.evaluate((n:HTMLImageElement)=>n.currentSrc)).toContain(`best-response-${theme}${width<=550?'-mobile':''}`);
      expect(await active.evaluate((n:HTMLImageElement)=>n.naturalWidth)).toBeGreaterThan(0);
      await expect(active).toHaveAttribute('alt',/expected.payoff/);
    }
    if(browserName==='chromium'&&[390,1440].includes(width)){
      mkdirSync(artifacts,{recursive:true});const target=mode==='mastery'?page.locator('#m01'):mode==='core'?page.locator('.election'):page.locator('.payoff-plot');await target.screenshot({path:`${artifacts}/${mode}-${width}-${theme}.png`});
      const result=await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21aa','wcag22aa']).analyze();expect(result.violations).toEqual([]);
    }
  }
});

test('manual appearance selection changes the English plot independently of the system',async({page})=>{
  await page.emulateMedia({colorScheme:'light'});await ready(page);await reveal(page);await page.locator('button.theme-switcher').focus();await page.keyboard.press('Enter');
  await expect(page.locator('html')).toHaveAttribute('data-theme','dark');await expect(page.locator('.plot-dark')).toBeVisible();await expect(page.locator('.plot-light')).toBeHidden();
});

test('English no-JS reading includes all steps, the model, graph and complete solutions',async({browser})=>{
  const context=await browser.newContext({javaScriptEnabled:false,viewport:{width:390,height:1000},colorScheme:'dark'}),page=await context.newPage();
  const origin=`http://127.0.0.1:${process.env.PLAYWRIGHT_PORT||4321}`;
  await page.goto(`${origin}${en}/core/`);await expect(page.locator('[data-core-step]:visible')).toHaveCount(7);await expect(page.locator('.election [data-vote-total="0"]')).toHaveText('15%');
  await expect(page.locator('.election input[type=radio]:visible')).toHaveCount(0);await expect(page.locator('.plot-dark')).toBeVisible();
  await expect(page.locator('.language-switcher a[lang=ru]')).toHaveAttribute('href',`${ru}/core/`);
  await page.goto(`${origin}${en}/mastery/`);await expect(page.locator('article.question')).toHaveCount(6);await page.locator('#m01 [data-task-solution] summary').click();await expect(page.locator('#m01 [data-task-solution]')).toContainText('15 votes');await context.close();
});
