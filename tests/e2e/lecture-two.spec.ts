import { test, expect, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { readFileSync } from 'node:fs';
import type { Chapter, LearningConfig } from '../../src/lib/content/schema';
import { initialState } from '../../src/lib/learning/state';
const chapter = JSON.parse(readFileSync('src/content/chapters/yale-econ-159/lecture-02/chapter.json', 'utf8')) as Chapter;
const previousChapter = JSON.parse(readFileSync('src/content/chapters/yale-econ-159/lecture-01/chapter.json', 'utf8')) as Chapter;
const configure = (c: Chapter): LearningConfig => ({ chapterId: c.id, contentVersion: c.contentVersion, stepIds: c.steps.map((s) => s.id) });
const config = configure(chapter), previousConfig = configure(previousChapter);
const root = '/knowledge-atlas', base = `${root}/courses/yale-econ-159/lecture-02`;
const key = `knowledge-atlas:chapter:${config.chapterId}`, previousKey = `knowledge-atlas:chapter:${previousConfig.chapterId}`;
async function ready(page: Page, mode = 'core') {
  await page.goto(`${base}/${mode}/`); await expect(page.locator('[data-reader]')).toHaveAttribute('data-ready', 'true');
}
async function reveal(page: Page) { const button = page.locator('[data-toggle-all]'); if (await button.getAttribute('aria-pressed') !== 'true') await button.click(); await expect(page.locator('[data-core-step]:visible')).toHaveCount(8); }

test('Lecture 2 has three RU modes, real catalog/concept links and no invented English route', async ({ page }) => {
  const errors: string[] = []; page.on('pageerror', (e) => errors.push(e.message));
  for (const mode of ['quick', 'core', 'mastery']) {
    await ready(page, mode);
    await expect(page.locator('h1')).toHaveText('Я знаю, что ты знаешь…');
    await expect(page.locator('.language-switcher a[lang=en]')).toHaveCount(0);
    await expect(page.locator('.language-unavailable')).toHaveAttribute('aria-disabled', 'true');
    await expect(page.locator('link[hreflang=en]')).toHaveCount(0);
    await expect(page.locator('[data-progress]')).toHaveCount(mode === 'core' ? 1 : 0);
    await page.getByRole('button', { name: 'Источники', exact: true }).click();
    const notes = page.getByRole('dialog', { name: 'Источники и примечания' });
    await notes.getByText('Редакционные примечания и таймкоды', { exact: true }).click(); await expect(notes).toContainText('10 сентября 2007'); await page.keyboard.press('Escape');
  }
  await page.goto(`${root}/courses/yale-econ-159/`); await page.getByRole('link', { name: 'Я знаю, что ты знаешь…', exact: true }).click();
  await expect(page).toHaveURL(`${base}/core/`);
  await page.goto(`${root}/concepts/common-knowledge/`); await page.getByRole('link', { name: 'Разобраться в контексте →' }).click();
  await expect(page).toHaveURL(`${base}/core/#common-knowledge`);
  await expect(page.locator('#common-knowledge')).toBeVisible();
  expect(errors).toEqual([]);
});
test('Core opens sequentially and completes without answering questions; reveal-all is separate', async ({ page }) => {
  await ready(page); await expect(page.locator('[data-core-step]:visible')).toHaveCount(1);
  await reveal(page); await expect(page.locator('[data-progress]')).toHaveAttribute('aria-valuenow', '0');
  await page.locator('[data-toggle-all]').click(); await expect(page.locator('[data-core-step]:visible')).toHaveCount(1);
  for (const step of chapter.steps) await page.locator(`[data-complete-step=${step.id}]`).click();
  await expect(page).toHaveURL(`${base}/mastery/`); await ready(page);
  await expect(page.locator('[data-progress]')).toHaveAttribute('aria-valuenow', '8');
});
test('matrix player focus groups comparisons correctly, with strict domination distinct from dominance', async ({ page }) => {
  await ready(page); await reveal(page);
  const m = page.locator('[data-matrix-id=abstract]'), table = m.locator('table');
  const before = await table.boundingBox();
  const row = m.getByRole('button', { name: 'Игрок I', exact: true }), column = m.getByRole('button', { name: 'Игрок II', exact: true });
  await row.focus(); await page.keyboard.press('Enter'); await expect(row).toHaveAttribute('aria-pressed', 'true');
  await expect(m.locator('[data-comparison-group=column]')).toHaveCount(3);
  await expect(m.locator('[data-best-response=true]')).toHaveCount(3);
  await expect(m.locator('[data-strategy-status$="-dominant"], [data-strategy-status$="-dominated"]')).toHaveCount(0);
  await row.click(); await expect(m.locator('[data-comparison-group]')).toHaveCount(0);
  await column.click(); await expect(m.locator('[data-comparison-group=row]')).toHaveCount(2);
  await expect(m.locator('th[data-strategy-status=strict-dominated]')).toHaveText('R');
  await expect(m.locator('[data-strategy-status$="-dominant"]')).toHaveCount(0);
  await expect(m.locator('.matrix-analysis-note')).toContainText('3 > 0; 2 > 0');
  const after = await table.boundingBox(); expect(after!.width).toBeCloseTo(before!.width, 3); expect(after!.height).toBeCloseTo(before!.height, 3);
  const h = page.locator('[data-matrix-id=hannibal]'); await h.getByRole('button', { name: 'Атакующий' }).click();
  await expect(h.locator('th[data-strategy-status=weak-dominant]')).toHaveText('e');
  await expect(h.locator('th[data-strategy-status=weak-dominated]')).toHaveText('h');
  await expect(h.locator('[data-best-response=true]')).toHaveCount(3);
  expect(await h.locator('.matrix-value[data-strategy-status=weak-dominant]').first().evaluate((el) => getComputedStyle(el).borderStyle)).toBe('dashed');
});
test('Mastery is self-contained; analysis follows explicit checking and hides on edits', async ({ page }) => {
  await ready(page, 'mastery'); await expect(page.locator('[data-assessment-task]')).toHaveCount(7);
  for (const id of ['m02', 'm03', 'm04']) await expect(page.locator(`#${id} table`)).toHaveCount(1);
  const card = page.locator('#m02'); await card.getByRole('button', { name: 'Игрок I', exact: true }).click();
  await expect(card.locator('[data-strategy-status$="-dominated"]')).toHaveCount(0);
  await expect(card.locator('[data-task-solution]')).toBeHidden();
  await card.getByRole('radio').first().check(); await card.getByRole('button', { name: 'Проверить ответ', exact: true }).click();
  await expect(card.locator('[data-task-solution]')).toBeVisible();
  await expect(card.locator('th[data-strategy-status=strict-dominated]')).toHaveText('C');
  await expect(card.locator('[data-strategy-status$="-dominant"]')).toHaveCount(0);
  await card.getByRole('radio').nth(1).check(); await expect(card.locator('[data-task-solution]')).toBeHidden();
  await expect(card.locator('[data-strategy-status$="-dominated"]')).toHaveCount(0);
  await card.getByRole('button', { name: 'Проверить ответ', exact: true }).click();
  await page.reload(); await expect(card.locator('[data-task-solution]')).toBeVisible();
  const multipart = page.locator('#m03'); await multipart.locator('fieldset').nth(0).getByRole('radio').nth(1).check();
  await expect(multipart.getByRole('button', { name: 'Проверить ответы' })).toBeDisabled();
  await multipart.locator('fieldset').nth(1).getByRole('radio').nth(1).check(); await multipart.getByRole('button', { name: 'Проверить ответы' }).click();
  await expect(multipart.locator('[data-task-solution]')).toBeVisible();
  await multipart.locator('fieldset').nth(0).getByRole('radio').nth(0).check(); await expect(multipart.locator('[data-task-solution]')).toBeHidden();
});
test('half-average answers are 45 and 22, and optional explanation never changes the seven-task score', async ({ page }) => {
  await ready(page, 'mastery'); const card = page.locator('#m05'); const inputs = card.getByRole('spinbutton');
  await inputs.nth(0).fill('45'); await expect(card.getByRole('button', { name: 'Проверить ответы' })).toBeDisabled();
  await inputs.nth(1).fill('23'); await card.getByRole('button', { name: 'Проверить ответы' }).click();
  await expect(card.locator('.task-verdict')).toContainText('Не совсем');
  await expect(page.locator('.mastery-score')).toContainText('0 / 7');
  await inputs.nth(1).fill('22'); await expect(card.locator('[data-task-solution]')).toBeHidden();
  await card.getByRole('button', { name: 'Проверить ответы' }).click(); await expect(page.locator('.mastery-score')).toContainText('1 / 7');
  await page.getByRole('textbox', { name: 'Твоё объяснение — 1–2 предложения' }).fill('9 отражает фактические ожидания, а 1 — условный предел.');
  await page.reload(); await expect(page.getByRole('textbox')).toHaveValue('9 отражает фактические ожидания, а 1 — условный предел.');
  await expect(page.locator('.mastery-score')).toContainText('1 / 7');
});
test('saved Lecture 1 number is snapshotted once, and original/current/revised numbers remain separate', async ({ page }) => {
  await page.goto(`${root}/`);
  const source = { ...initialState(previousConfig), responses: { number: '42' } };
  await page.evaluate(({ previousKey, source }) => localStorage.setItem(previousKey, JSON.stringify(source)), { previousKey, source });
  await ready(page); const first = page.locator('.prediction').first();
  await expect(first.locator('.prediction-original strong')).toHaveText('42'); await expect(first.getByRole('slider')).toHaveValue('42');
  await first.getByRole('slider').fill('18'); await first.getByRole('button', { name: 'Сохранить прогноз' }).click();
  expect(JSON.parse((await page.evaluate((k) => localStorage.getItem(k), previousKey))!).responses.number).toBe('42');
  await reveal(page); const later = page.locator('.prediction').nth(1); await later.getByRole('slider').fill('9'); await later.getByRole('button', { name: 'Сохранить прогноз' }).click();
  await page.evaluate((k) => { const s = JSON.parse(localStorage.getItem(k)!); s.responses.number = '77'; localStorage.setItem(k, JSON.stringify(s)); }, previousKey);
  await page.reload(); await expect(first.locator('.prediction-original strong')).toHaveText('42');
  const responses = await page.evaluate((k) => JSON.parse(localStorage.getItem(k)!).responses, key);
  expect([responses['number-original'], responses['number-current'], responses['number-revised']]).toEqual(['42', '18', '9']);
});
test('direct entry never saves slider default; chapter export/import/reset does not alter Lecture 1 or appearance', async ({ page }) => {
  await ready(page); const first = page.locator('.prediction').first();
  await expect(first.getByRole('slider')).toBeEnabled(); await expect(first.locator('.prediction-original strong')).toHaveText('—');
  expect(await page.evaluate((k) => JSON.parse(localStorage.getItem(k)!).responses['number-original'], key)).toBeUndefined();
  await first.getByRole('slider').fill('27'); await first.getByRole('button', { name: 'Сохранить прогноз' }).click();
  await page.getByRole('button', { name: 'Источники', exact: true }).click();
  await page.getByText('Сохранение и перенос прогресса', { exact: true }).click();
  const downloaded = page.waitForEvent('download'); await page.locator('[data-export]').click(); const download = await downloaded;
  const stream = await download.createReadStream(); const chunks: Buffer[] = []; for await (const chunk of stream!) chunks.push(chunk); const exported = Buffer.concat(chunks);
  await page.evaluate(({ previousKey }) => { localStorage.setItem('knowledge-atlas:theme', 'dark'); localStorage.setItem(previousKey, 'keep-previous'); }, { previousKey });
  page.on('dialog', (d) => d.accept()); await page.locator('[data-reset]').click(); await expect(page).toHaveURL(`${base}/core/`);
  await expect(page.locator('.prediction-original strong').first()).toHaveText('—');
  await page.getByRole('button', { name: 'Источники', exact: true }).click(); await page.getByText('Сохранение и перенос прогресса', { exact: true }).click(); await page.locator('#import-progress').setInputFiles({ name: 'progress.json', mimeType: 'application/json', buffer: exported });
  await expect(page.locator('#import-status')).toContainText('Импорт завершён'); await page.keyboard.press('Escape');
  await expect(page.locator('.prediction-original strong').first()).toHaveText('27');
  expect(await page.evaluate((k) => localStorage.getItem(k), previousKey)).toBe('keep-previous');
  expect(await page.evaluate(() => localStorage.getItem('knowledge-atlas:theme'))).toBe('dark');
});
test('elimination and hats preserve assumptions and support keyboard operation', async ({ page }) => {
  await ready(page); await reveal(page); const ladder = page.locator('.elimination');
  await expect(ladder).toContainText('1–100'); await ladder.getByRole('button', { name: 'Дальше →' }).focus(); await page.keyboard.press('Space');
  await expect(ladder.locator('.elimination-range')).toHaveText('1–67');
  for (let i = 1; i < 11; i++) await ladder.getByRole('button', { name: 'Дальше →' }).click();
  await expect(ladder.locator('.elimination-range')).toHaveText('1'); await expect(ladder).toContainText('Одна лишь рациональность');
  await ladder.getByRole('button', { name: 'Сначала ↺' }).click(); await expect(ladder.locator('.elimination-range')).toHaveText('1–100');
  const hats = page.locator('.hats'); await hats.getByRole('button', { name: 'Глазами Ани' }).click();
  await expect(hats.locator('.hat-person').nth(0)).toContainText('Свой цвет неизвестен'); await expect(hats.locator('.hat-person').nth(1)).toContainText('Розовая');
  await hats.getByRole('button', { name: 'Глазами Бориса' }).click(); await expect(hats.locator('.hat-person').nth(1)).toContainText('Свой цвет неизвестен');
});
test('Lecture 2 fits 320/390/768/1440 and passes accessibility checks in Light and Graphite', async ({ page }) => {
  test.setTimeout(60000);
  for (const width of [320, 390, 768, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    for (const mode of ['quick', 'core', 'mastery']) {
      await ready(page, mode); if (mode === 'core') { await reveal(page); await page.locator('[data-matrix-id=abstract] [data-analysis-player=column]').click(); }
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    }
  }
  for (const theme of ['light', 'dark']) {
    await page.evaluate((theme) => localStorage.setItem('knowledge-atlas:theme', theme), theme);
    for (const mode of ['quick', 'core', 'mastery']) {
      await ready(page, mode); if (mode === 'core') { await page.locator('[data-matrix-id=hannibal] [data-analysis-player=column]').click(); }
      if (mode === 'mastery') { const card = page.locator('#m02'); await card.getByRole('radio').nth(1).check(); await card.getByRole('button', { name: 'Проверить ответ', exact: true }).click(); await card.locator('[data-analysis-player=row]').click(); }
      expect((await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze()).violations).toEqual([]);
    }
    await page.getByRole('button', { name: 'Источники', exact: true }).click();
    expect((await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze()).violations).toEqual([]);
  }
});

test('Lecture 2 reading and analysis survive blocked storage without claiming a persistent save', async ({ page }) => {
  await page.addInitScript(() => { Object.defineProperty(window, 'localStorage', { get() { throw new Error('blocked'); } }); });
  await ready(page); const first = page.locator('.prediction').first();
  await first.getByRole('slider').fill('29'); await first.getByRole('button', { name: 'Сохранить прогноз' }).click();
  await expect(first.locator('.prediction-original strong')).toHaveText('29');
  await expect(first.locator('[role=status]')).toContainText('памяти страницы');
  await expect(page.locator('[data-storage-message]').first()).toContainText('недоступно');
  await reveal(page); await page.locator('[data-matrix-id=abstract] [data-analysis-player=column]').click();
  await expect(page.locator('[data-matrix-id=abstract] .matrix-analysis-note')).toContainText('R строго доминируема');
});

test('Lecture 2 narrative and manual answer disclosures remain readable without JavaScript', async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false, colorScheme: 'dark' }), page = await context.newPage();
  await page.goto(`${base}/core/`); await expect(page.locator('[data-core-step]:visible')).toHaveCount(8);
  await page.goto(`${base}/mastery/`); const solution = page.locator('#m05 [data-task-solution]');
  await expect(solution).toBeVisible(); await solution.locator('summary').click(); await expect(solution).toContainText('1: 45; 2: 22');
  await context.close();
});

for (const theme of ['light', 'dark']) for (const [name, width] of [['desktop', 1440], ['mobile', 390]] as const) {
  test(`Lecture 2 visual reference — ${theme} ${name}`, async ({ page }) => {
    await page.setViewportSize({ width, height: 1000 }); await page.goto(`${root}/`);
    await page.evaluate((theme) => localStorage.setItem('knowledge-atlas:theme', theme), theme);
    await ready(page); await reveal(page); await page.evaluate(() => document.fonts.ready);
    const capture = async (selector: string, file: string) => {
      const element = page.locator(selector), height = Math.ceil(await element.evaluate((el) => el.getBoundingClientRect().height));
      await page.setViewportSize({ width, height: Math.max(1000, height + 300) });
      await element.evaluate((el) => el.scrollIntoView({ block: 'start', behavior: 'instant' })); await page.mouse.move(0, 0);
      await expect(element).toHaveScreenshot(`lecture-two-${file}-${theme}-${name}.png`);
    };
    await page.locator('[data-matrix-id=abstract] [data-analysis-player=column]').click();
    await capture('[data-matrix-id=abstract]', 'strict');
    await page.locator('[data-matrix-id=hannibal] [data-analysis-player=column]').click();
    await capture('[data-matrix-id=hannibal]', 'weak');
    await ready(page, 'mastery'); const task = page.locator('#m02'); await task.getByRole('radio').nth(1).check();
    await task.getByRole('button', { name: 'Проверить ответ', exact: true }).click(); await task.locator('[data-analysis-player=row]').click();
    await capture('#m02', 'mastery');
  });
}
