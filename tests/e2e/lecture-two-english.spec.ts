import { openSources } from './helpers/navigation';
import { test, expect, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
const root = '/knowledge-atlas', en = `${root}/en/courses/yale-econ-159/lecture-02`, ru = `${root}/courses/yale-econ-159/lecture-02`;
const key = 'knowledge-atlas:chapter:yale-econ-159/lecture-02';
async function ready(page: Page, mode = 'core', hash = '') {
  await page.goto(`${en}/${mode}/${hash}`); await expect(page.locator('[data-reader]')).toHaveAttribute('data-ready', 'true');
}
async function expand(page: Page) { if (await page.locator('[data-toggle-all]').getAttribute('aria-pressed') !== 'true') await page.locator('[data-toggle-all]').click(); }
async function switchTo(page: Page, name: 'English' | 'Русский') { const link = page.getByRole('link', { name, exact: true }); await link.focus(); await link.press('Enter'); }

test('English Lecture 2 provides complete modes, concepts, sources and native language links', async ({ page }) => {
  const failures: string[] = []; page.on('pageerror', (e) => failures.push(e.message));
  for (const mode of ['quick', 'core', 'mastery']) {
    await ready(page, mode); await expect(page.locator('html')).toHaveAttribute('lang', 'en');
    await expect(page.locator('h1')).toHaveText('I know that you know…');
    expect(await page.locator('main').innerText()).not.toMatch(/[А-Яа-яЁё]/u);
    await expect(page.locator('.language-switcher a[lang=ru]')).toHaveAttribute('href', `${ru}/${mode}/`);
    await expect(page.locator('[data-progress]')).toHaveCount(mode === 'core' ? 1 : 0);
    await openSources(page);
    const dialog = page.getByRole('dialog', { name: 'Sources and notes' });
    await dialog.getByText('Editorial notes and timestamps', { exact: true }).click();
    expect(await dialog.innerText()).not.toMatch(/[А-Яа-яЁё]/u); await expect(dialog).toContainText('September 10, 2007');
    await page.keyboard.press('Escape');
  }
  await page.goto(`${root}/en/courses/yale-econ-159/`); await page.getByRole('link', { name: 'I know that you know…', exact: true }).click();
  await expect(page).toHaveURL(`${en}/core/`);
  await page.goto(`${root}/en/concepts/common-knowledge/`); await page.getByRole('link', { name: 'Understand in context →' }).click();
  await expect(page).toHaveURL(`${en}/core/#common-knowledge`); await expect(page.locator('#common-knowledge')).toBeVisible();
  expect(failures).toEqual([]);
});
test('switching Lecture 2 languages preserves step, progress, predictions, answers, writing and appearance', async ({ page }) => {
  await page.goto(`${ru}/core/`); const first = page.locator('.prediction').first();
  await first.getByRole('slider').fill('42'); await first.getByRole('button', { name: 'Сохранить прогноз' }).click();
  await page.locator('[data-complete-step=number-prediction]').click();
  await page.locator('[data-toggle-all]').click();
  await page.goto(`${ru}/core/#weak-dominance`); await expect(page.locator('[data-reader]')).toHaveAttribute('data-ready', 'true');
  await expect(page.locator('#weak-dominance')).toBeVisible();
  await page.locator('#weak-dominance').evaluate((el) => el.scrollIntoView({ block: 'start', behavior: 'instant' }));
  await switchTo(page, 'English');
  await expect(page).toHaveURL(`${en}/core/#weak-dominance`); await expect(page.locator('[data-progress-label]')).toHaveText('1 of 8 steps completed');
  await expect(page.locator('.prediction-original strong').first()).toHaveText('42');
  const last = page.locator('.prediction').nth(1); await last.getByRole('slider').fill('9'); await last.getByRole('button', { name: 'Save prediction' }).click();
  await ready(page, 'mastery', '#m03'); const task = page.locator('#m03');
  for (const group of await task.locator('fieldset').all()) await group.getByRole('radio').nth(1).check();
  await task.getByRole('button', { name: 'Check answers', exact: true }).click();
  await page.getByRole('textbox', { name: 'Your explanation—1–2 sentences' }).fill('Моя заметка / my explanation');
  await page.evaluate(() => localStorage.setItem('knowledge-atlas:theme', 'dark')); await page.reload();
  await expect(page.locator('[data-reader]')).toHaveAttribute('data-ready', 'true');
  await expect(task.locator('.task-verdict')).toHaveText('Correct.');
  await expect(page.getByRole('textbox')).toHaveValue('Моя заметка / my explanation');
  await page.locator('#self-explanation').evaluate((el) => el.scrollIntoView({ block: 'start', behavior: 'instant' }));
  await switchTo(page, 'Русский');
  await expect(page).toHaveURL(`${ru}/mastery/#self-explanation`); await expect(task.locator('.task-verdict')).toHaveText('Верно.');
  await expect(page.getByRole('textbox')).toHaveValue('Моя заметка / my explanation');
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  const state = await page.evaluate((key) => JSON.parse(localStorage.getItem(key)!), key);
  expect([state.responses['number-original'], state.responses['number-revised']]).toEqual(['42', '9']);
  expect(await page.evaluate(() => Object.keys(localStorage).filter((k) => k.includes('lecture-02')))).toEqual([key]);
});
test('English matrices and all eight reading steps work without mandatory grading', async ({ page }) => {
  await ready(page); await expect(page.locator('[data-core-step]:visible')).toHaveCount(1); await expand(page);
  const m = page.locator('[data-matrix-id=abstract]'); await m.getByRole('button', { name: 'Player II', exact: true }).click();
  await expect(m.locator('th[data-strategy-status=strict-dominated]')).toHaveText('R');
  await expect(m.locator('[data-strategy-status$="-dominant"]')).toHaveCount(0);
  await expect(m.locator('.matrix-analysis-note')).toContainText('R is strictly dominated by C');
  const h = page.locator('[data-matrix-id=hannibal]'); await h.getByRole('button', { name: 'Attacker', exact: true }).focus(); await page.keyboard.press('Space');
  await expect(h.locator('th[data-strategy-status=weak-dominant]')).toHaveText('e');
  await expect(h.locator('[data-best-response=true]')).toHaveCount(3);
  await expect(page.locator('.elimination')).toContainText('Rationality alone does not guarantee');
  await page.locator('.elimination').getByRole('button', { name: 'Next →' }).click(); await expect(page.locator('.elimination-range')).toHaveText('1–67');
  await page.locator('.hats').getByRole('button', { name: 'Through Anya’s eyes' }).click();
  await expect(page.locator('.hat-person').first()).toContainText('Own color unknown');
  const ids = await page.locator('[data-complete-step]').evaluateAll((buttons) => buttons.map((b) => b.getAttribute('data-complete-step')));
  for (const id of ids) await page.locator(`[data-complete-step=${id}]`).click();
  await expect(page).toHaveURL(`${en}/mastery/`);
});
test('English Mastery checks seven tasks, keeps feedback conditional and accepts 45 then 22', async ({ page }) => {
  await ready(page, 'mastery'); const task = page.locator('#m02');
  await task.getByRole('button', { name: 'Player I', exact: true }).click();
  await expect(task.locator('[data-strategy-status$="-dominated"]')).toHaveCount(0); await expect(task.locator('[data-task-solution]')).toBeHidden();
  for (const card of await page.locator('[data-assessment-task]').all()) {
    for (const group of await card.locator('fieldset').all()) await group.getByRole('radio').nth(1).check();
    if (await card.getByRole('spinbutton').count()) {
      await card.getByRole('spinbutton').nth(0).fill('45'); await card.getByRole('spinbutton').nth(1).fill('23');
      await card.getByRole('button', { name: 'Check answers', exact: true }).click(); await expect(card.locator('.task-verdict')).toHaveText('Not quite.');
      await card.getByRole('spinbutton').nth(1).fill('22'); await expect(card.locator('[data-task-solution]')).toBeHidden();
    }
    await card.getByRole('button', { name: /Check answer/ }).click(); await expect(card.locator('.task-verdict')).toHaveText('Correct.');
    await expect(card.locator('[data-task-solution]')).toBeVisible();
  }
  await expect(page.locator('.mastery-score')).toContainText('7 / 7 correct');
  await page.getByRole('textbox').fill('A prediction of actual choices can differ from a conditional limit.'); await page.reload();
  await expect(page.locator('.mastery-score')).toContainText('7 / 7 correct'); await expect(page.getByRole('textbox')).toHaveValue('A prediction of actual choices can differ from a conditional limit.');
});
test('English Lecture 2 is responsive and accessible in Light and Graphite, including dialogs', async ({ page }) => {
  test.setTimeout(60000);
  for (const width of [320, 390, 768, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    for (const mode of ['quick', 'core', 'mastery']) {
      await ready(page, mode); if (mode === 'core') await expand(page);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    }
  }
  for (const theme of ['light', 'dark']) {
    await page.evaluate((theme) => localStorage.setItem('knowledge-atlas:theme', theme), theme);
    for (const mode of ['quick', 'core', 'mastery']) {
      await ready(page, mode); if (mode === 'core') await page.locator('[data-matrix-id=hannibal] [data-analysis-player=column]').click();
      if (mode === 'mastery') { const card = page.locator('#m03'); for (const group of await card.locator('fieldset').all()) await group.getByRole('radio').nth(1).check(); await card.getByRole('button', { name: 'Check answers' }).click(); await card.locator('[data-analysis-player=row]').click(); }
      expect((await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze()).violations).toEqual([]);
    }
    for (const name of ['Sources', 'Course contents', 'Course concepts']) {
      if (name === 'Sources') await openSources(page); else await page.getByRole('button', { name, exact: true }).click();
      expect((await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze()).violations).toEqual([]);
      await page.keyboard.press('Escape');
    }
  }
});
test('English Lecture 2 stays readable without JavaScript and provides an equivalent Russian link', async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false }), page = await context.newPage();
  await page.goto(`${en}/core/`); await expect(page.locator('[data-core-step]:visible')).toHaveCount(8);
  await page.goto(`${en}/mastery/`); await page.locator('#m05 [data-task-solution] summary').click();
  await expect(page.locator('#m05 [data-task-solution]')).toContainText('1: 45; 2: 22');
  await page.getByRole('link', { name: 'Русский', exact: true }).click(); await expect(page).toHaveURL(`${ru}/mastery/`); await context.close();
});
for (const theme of ['light', 'dark']) for (const [name, width] of [['desktop', 1440], ['mobile', 390]] as const) {
  test(`English Lecture 2 visual reference — ${theme} ${name}`, async ({ page }) => {
    await page.setViewportSize({ width, height: 1000 }); await ready(page);
    await page.evaluate((theme) => localStorage.setItem('knowledge-atlas:theme', theme), theme); await ready(page); await page.evaluate(() => document.fonts.ready);
    await expect(page).toHaveScreenshot(`lecture-two-english-chapter-${theme}-${name}.png`); await expand(page);
    const capture = async (selector: string, file: string) => {
      const element = page.locator(selector), height = Math.ceil(await element.evaluate((el) => el.getBoundingClientRect().height));
      await page.setViewportSize({ width, height: Math.max(1000, height + 300) }); await element.evaluate((el) => el.scrollIntoView({ block: 'start', behavior: 'instant' })); await page.mouse.move(0, 0);
      await expect(element).toHaveScreenshot(`lecture-two-english-${file}-${theme}-${name}.png`);
    };
    await page.locator('[data-matrix-id=hannibal] [data-analysis-player=column]').click(); await capture('[data-matrix-id=hannibal]', 'weak');
    await ready(page, 'mastery'); const card = page.locator('#m03'); for (const group of await card.locator('fieldset').all()) await group.getByRole('radio').nth(1).check();
    await card.getByRole('button', { name: 'Check answers' }).click(); await card.locator('[data-analysis-player=row]').click(); await capture('#m03', 'mastery');
  });
}
