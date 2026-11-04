import { test, expect, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { mkdirSync,readFileSync } from 'node:fs';
import type { Chapter,AssessmentTask } from '../../src/lib/content/schema';
import { getUI,format } from '../../src/i18n/ui';
import { openContents,openSources } from './helpers/navigation';
const root='/knowledge-atlas',base=`${root}/courses/yale-econ-159/lecture-03`,t=getUI('ru');
const chapter=JSON.parse(readFileSync('src/content/chapters/yale-econ-159/lecture-03/chapter.json','utf8')) as Chapter;
const tasks=JSON.parse(readFileSync('src/content/chapters/yale-econ-159/lecture-03/exercises.json','utf8')) as AssessmentTask[];
const key=`knowledge-atlas:chapter:${chapter.id}`;
const artifacts='test-results/lecture-three-ru';
test.skip(chapter.reviewOnly && process.env.ATLAS_REVIEW!=='1','Build with build:review and run with ATLAS_REVIEW=1 for the local RU edition.');
async function ready(page:Page,mode='core'){
  await page.goto(`${base}/${mode}/`);await expect(page.locator('[data-reader]')).toHaveAttribute('data-ready','true');
}
async function reveal(page:Page){const button=page.locator('[data-toggle-all]');if(await button.getAttribute('aria-pressed')!=='true')await button.click();await expect(page.locator('[data-core-step]:visible')).toHaveCount(7);}
test('all RU modes use the real course drawer, sources and concept routes',async({page})=>{
  const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
  for(const mode of ['quick','core','mastery']){
    await ready(page,mode);await expect(page.locator('h1')).toHaveText(chapter.title);
    await expect(page.locator('.mode-nav a')).toHaveText(['Quick','Core','Mastery']);
    await expect(page.locator('[data-progress]')).toHaveCount(mode==='core'?1:0);
    if(!chapter.availableLocales.includes('en'))await expect(page.locator('.language-switcher a[lang=en]')).toHaveCount(0);
    await openContents(page);await expect(page.locator('[data-course-chapter=lecture-03]')).toHaveAttribute('open','');
    await expect(page.locator('[data-course-chapter=lecture-03] .toc a')).toHaveCount(7);await page.keyboard.press('Escape');
    await openSources(page);await expect(page.locator('[data-course-view=sources]')).toBeVisible();await expect(page.locator('[data-course-view=sources]')).toContainText('Problem Set 1');await page.keyboard.press('Escape');
  }
  await page.goto(`${root}/concepts/expected-payoff/`);await page.getByRole('link',{name:t.contextLink}).click();await expect(page).toHaveURL(`${base}/core/#beliefs-and-expectation`);await expect(page.locator('#beliefs-and-expectation')).toBeVisible();
  expect(errors).toEqual([]);
});
test('election exploration is transient and Core has seven meaningful completion steps',async({page})=>{
  await ready(page);await expect(page.locator('[data-core-step]:visible')).toHaveCount(1);
  const model=page.locator('.election');await model.getByRole('button',{name:'1 против 2',exact:true}).click();await expect(model.locator('[data-vote-total="0"]')).toHaveText('10%');
  await model.getByRole('button',{name:'1 против 3',exact:true}).click();await expect(model.locator('[data-vote-total="0"]')).toHaveText('15%');await expect(model.locator('[data-voter="2"]')).toContainText('К1 5%');
  const group=model.getByRole('group',{name:'Кандидат 1',exact:true});await group.getByRole('radio',{name:'Позиция 1',exact:true}).focus();await page.keyboard.press('ArrowRight');await expect(model.locator('[data-vote-total="0"]')).toHaveText('20%');
  await expect(page.locator('[data-progress]')).toHaveAttribute('aria-valuenow','0');
  await page.locator('[data-complete-step=election-rules]').click();await expect(page.locator('[data-complete-step=election-rules]')).toBeHidden();await expect(page.locator('[data-core-step]:visible')).toHaveCount(2);
  await reveal(page);await expect(page.locator('[data-progress]')).toHaveAttribute('aria-valuenow','1');await page.reload();await expect(page.locator('[data-reader]')).toHaveAttribute('data-ready','true');await expect(page.locator('[data-progress]')).toHaveAttribute('aria-valuenow','1');
  const stored=await page.evaluate(k=>JSON.parse(localStorage.getItem(k)!),key);expect(stored.completedStepIds).toEqual(['election-rules']);
  for(const step of chapter.steps.slice(1))await page.locator(`[data-complete-step="${step.id}"]`).click();
  await expect(page).toHaveURL(`${base}/mastery/`);await expect(page.locator('[data-reader]')).toHaveAttribute('data-ready','true');await expect(page.locator('[data-progress]')).toHaveCount(0);
  expect(await page.evaluate(k=>JSON.parse(localStorage.getItem(k)!).completedStepIds.length,key)).toBe(7);
});
test('paired numeric answers check atomically, persist, and keep other chapters intact',async({page})=>{
  await page.addInitScript(()=>{const key='knowledge-atlas:chapter:unrelated-synthetic';if(!localStorage.getItem(key))localStorage.setItem(key,'Контрольная заметка другой главы');});
  await ready(page,'mastery');const first=page.locator('#m01');await expect(first.locator('.numeric-answer-pair input[type=number]')).toHaveCount(2);
  await expect(first.locator('[data-task-solution]')).toBeHidden();await expect(first.getByRole('button',{name:/Проверить/})).toBeDisabled();
  await page.locator('#m01-at-one').fill('15');await page.locator('#m01-at-two').fill('20');await first.locator('input[type=radio][value=b]').check();await first.getByRole('button',{name:/Проверить/}).click();
  await expect(first.locator('.task-verdict')).toHaveText(t.correct);await expect(first.locator('[data-task-solution]')).toBeVisible();
  await page.reload();await expect(page.locator('[data-reader]')).toHaveAttribute('data-ready','true');await expect(page.locator('#m01-at-one')).toHaveValue('15');await expect(first.locator('.task-verdict')).toHaveText(t.correct);
  await page.locator('#m01-at-one').fill('16');await expect(first.locator('[data-task-solution]')).toBeHidden();await expect(first.locator('.task-verdict')).toBeEmpty();
  for(const task of tasks){const section=page.locator('#'+task.id);for(const part of task.parts){if(part.kind==='integer')await page.locator('#'+part.id).fill(String(part.correct));else await section.locator(`input[name="${part.id}"][value="${part.correct}"]`).check();}await section.getByRole('button',{name:/Проверить/}).click();await expect(section.locator('.task-verdict')).toHaveText(t.correct);}
  await expect(page.locator('.mastery-score strong')).toHaveText(format(t.correctTasks,{count:6,total:6}));
  await page.getByLabel('Твоё объяснение',{exact:true}).fill('Условие: два кандидата. Третий меняет делёж групп.');await page.reload();await expect(page.getByLabel('Твоё объяснение',{exact:true})).toHaveValue('Условие: два кандидата. Третий меняет делёж групп.');
  expect(await page.evaluate(()=>localStorage.getItem('knowledge-atlas:chapter:unrelated-synthetic'))).toBe('Контрольная заметка другой главы');
});
for(const width of [320,390,768,1440])for(const theme of ['light','dark'] as const)test(`RU chapter responsive, ${width}px ${theme}`,async({page,browserName})=>{
  await page.setViewportSize({width,height:1000});await page.emulateMedia({colorScheme:theme});
  for(const mode of ['mastery','core','quick']){
    await ready(page,mode);if(mode==='core')await reveal(page);await page.evaluate(()=>document.fonts.ready);
    expect(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),`${mode} horizontal overflow`).toBe(false);
    if(mode==='mastery'){
      const a=await page.locator('#m01-at-one').boundingBox(),b=await page.locator('#m01-at-two').boundingBox();expect(a!.height).toBeGreaterThanOrEqual(52);expect(b!.x).toBeGreaterThan(a!.x);expect(Math.abs(a!.y-b!.y)).toBeLessThan(2);
      await expect(page.locator('#m01 .numeric-answer-unit')).toHaveText(['Голоса из 60','Голоса из 60']);
    }else{
      await page.locator('.payoff-plot').scrollIntoViewIfNeeded();const active=page.locator(`.plot-${theme} img`);await expect(active).toBeVisible();await expect(active).toHaveJSProperty('complete',true);expect(await active.evaluate((n:HTMLImageElement)=>n.naturalWidth)).toBeGreaterThan(0);
      expect(await active.evaluate((n:HTMLImageElement)=>n.currentSrc)).toContain(`best-response-${theme}${width<=550?'-mobile':''}`);
    }
    if(browserName==='chromium'&&[390,1440].includes(width)){
      mkdirSync(artifacts,{recursive:true});const target=mode==='mastery'?page.locator('#m01'):mode==='core'?page.locator('.election'):page.locator('.payoff-plot');await target.screenshot({path:`${artifacts}/${mode}-${width}-${theme}.png`});
      const result=await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21aa','wcag22aa']).analyze();expect(result.violations).toEqual([]);
    }
  }
});
test('manual theme selection changes the approved plot, regardless of system theme',async({page})=>{
  await page.emulateMedia({colorScheme:'light'});await ready(page);await reveal(page);await page.locator('button.theme-switcher').focus();await page.keyboard.press('Enter');await expect(page.locator('html')).toHaveAttribute('data-theme','dark');await expect(page.locator('.plot-dark')).toBeVisible();await expect(page.locator('.plot-light')).toBeHidden();
});
test('without JavaScript all seven sections, the original allocation and solutions remain readable',async({browser})=>{
  const context=await browser.newContext({javaScriptEnabled:false,viewport:{width:390,height:1000},colorScheme:'dark'}),page=await context.newPage();
  await page.goto(`http://127.0.0.1:${process.env.PLAYWRIGHT_PORT||4321}${base}/core/`);await expect(page.locator('[data-core-step]:visible')).toHaveCount(7);await expect(page.locator('.election [data-vote-total="0"]')).toHaveText('15%');await expect(page.locator('.election input[type=radio]:visible')).toHaveCount(0);await expect(page.locator('.plot-dark')).toBeVisible();
  await page.goto(`http://127.0.0.1:${process.env.PLAYWRIGHT_PORT||4321}${base}/mastery/`);await expect(page.locator('article.question')).toHaveCount(6);await expect(page.locator('#m01 [data-task-solution] summary')).toBeVisible();await page.locator('#m01 [data-task-solution] summary').click();await expect(page.locator('#m01 [data-task-solution]')).toContainText('15 голосов');await context.close();
});
