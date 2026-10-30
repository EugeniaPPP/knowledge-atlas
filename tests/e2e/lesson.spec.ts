import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { readFile } from 'node:fs/promises';

const siteRoot = '/knowledge-atlas';
const base = `${siteRoot}/courses/yale-econ-159/lecture-01`;
const stepIds = ['strategic-situations', 'outcomes', 'payoffs', 'dominance', 'prisoners-dilemma', 'preferences', 'other-player', 'number-game'];
const ready = async (page: import('@playwright/test').Page, mode = 'core') => {
  await page.goto(`${base}/${mode}/`);
  await expect(page.locator('[data-reader]')).toHaveAttribute('data-ready', 'true');
};

test('GitHub Pages base survives mode links, MDX links, assets and persisted learning state', async ({ page, baseURL }) => {
  const failed: string[] = [];
  const origin = new URL(baseURL!).origin;
  page.on('requestfailed', (request) => failed.push(request.url()));
  page.on('response', (response) => { if (response.url().startsWith(origin) && response.status() >= 400) failed.push(response.url()); });
  await ready(page);
  const modes = page.getByRole('navigation', { name: 'Режимы главы 01' });
  await page.locator('[data-activity="first-choice"]').getByRole('radio', { name: 'β', exact: true }).check();
  await page.locator('[data-complete-step="strategic-situations"]').click();
  await modes.getByRole('link', { name: /Quick/ }).click();
  await expect(page).toHaveURL(`${base}/quick/`);
  await page.getByRole('button', { name: 'Показать ответ ↓' }).click();
  await modes.getByRole('link', { name: /Mastery/ }).click();
  await expect(page).toHaveURL(`${base}/mastery/`);
  const question = page.locator('#m1');
  await question.getByRole('radio', { name: 'A строго доминирует B.' }).check();
  await question.getByRole('button', { name: 'Проверить ответ' }).click();
  await page.getByLabel('Твоё объяснение').fill('Прогресс сохраняется под путём проекта.');
  await page.reload();
  await expect(question.locator('.feedback')).toContainText('Верно.');
  await expect(page.getByLabel('Твоё объяснение')).toHaveValue('Прогресс сохраняется под путём проекта.');
  await page.getByRole('link', { name: 'Повторить ключевые идеи →', exact: true }).click();
  await expect(page).toHaveURL(`${base}/quick/`);
  await expect(page.locator('#quick-answer')).toBeVisible();
  await page.getByRole('link', { name: 'Перейти к Core →', exact: true }).click();
  await expect(page).toHaveURL(`${base}/core/`);
  await expect(page.locator('[data-activity="first-choice"]').getByRole('radio', { name: 'β', exact: true })).toBeChecked();
  await expect(page.locator('[data-progress-label]')).toHaveText('1 из 8 шагов завершено');
  await expect(page.getByRole('link', { name: 'K/ — Knowledge Atlas, главная' })).toHaveAttribute('href', `${siteRoot}/`);
  expect(failed).toEqual([]);
});

test('catalog and concept links lead to actual content without completing it', async ({ page }) => {
  await page.goto(`${siteRoot}/`);
  await page.getByRole('link', { name: 'Все 24 лекции' }).click();
  await expect(page.locator('.course-list > li')).toHaveCount(24);
  await expect(page.locator('.availability').filter({ hasText: 'Планируется' })).toHaveCount(23);
  await page.goto(`${siteRoot}/concepts/`);
  await expect(page.locator('.concept-list > li')).toHaveCount(8);
  await page.getByRole('link', { name: 'Строгое доминирование', exact: true }).click();
  await page.getByRole('link', { name: 'Разобраться в контексте →' }).click();
  await expect(page).toHaveURL(`${base}/core/#dominance`);
  await expect(page.locator('#dominance')).toBeVisible();
  await expect(page.locator('[data-progress-label]')).toHaveText('0 из 8 шагов завершено');
});

test('reading is progressive and a first choice is saved without grading', async ({ page }) => {
  const errors: string[] = []; page.on('pageerror', (error) => errors.push(error.message));
  await ready(page);
  await expect(page.locator('[data-core-step]:visible')).toHaveCount(1);
  await expect(page.locator('[data-progress-label]')).toHaveText('0 из 8 шагов завершено');
  await page.locator('[data-activity="first-choice"]').getByRole('radio', { name: 'β', exact: true }).check();
  await expect(page.locator('[data-activity="first-choice"] [role=status]')).toContainText('Ты выбрал(а) β');
  await page.locator('[data-complete-step="strategic-situations"]').click();
  await expect(page.locator('[data-core-step]:visible')).toHaveCount(2);
  await expect(page.locator('[data-progress-label]')).toHaveText('1 из 8 шагов завершено');
  await page.reload();
  await expect(page.locator('[data-activity="first-choice"]').getByRole('radio', { name: 'β', exact: true })).toBeChecked();
  await expect(page.locator('[data-core-step]:visible')).toHaveCount(2);
  expect(errors).toEqual([]);
});

test('all steps can be read and completed without mandatory questions', async ({ page }) => {
  await ready(page);
  await page.getByRole('button', { name: 'Показать всю главу', exact: true }).first().click();
  await expect(page.locator('[data-core-step]:visible')).toHaveCount(8);
  await expect(page.locator('[data-progress-label]')).toHaveText('0 из 8 шагов завершено');
  await page.getByRole('button', { name: 'Вернуть пошаговый режим' }).click();
  await expect(page.locator('[data-core-step]:visible')).toHaveCount(1);
  for (const id of stepIds) await page.locator(`[data-complete-step="${id}"]`).click();
  await expect(page).toHaveURL(`${base}/mastery/`);
  await expect(page.locator('[data-progress-label]')).toHaveText('8 из 8 шагов завершено');
});

test('models compare outcomes, payoffs, preferences and roles correctly', async ({ page }) => {
  await ready(page);
  await page.getByRole('button', { name: 'Показать всю главу', exact: true }).first().click();
  const outcome = page.locator('[data-activity="outcome-explorer"]');
  await outcome.getByRole('group', { name: 'Выбор партнёра' }).getByRole('radio', { name: 'β' }).check();
  await expect(outcome.getByRole('status')).toContainText('твоя оценка A, оценка партнёра C');
  const layers = page.locator('[data-activity="matrix-layers"]');
  await layers.getByRole('radio', { name: 'Выигрыши' }).check();
  await expect(layers.locator('td').nth(1)).toHaveText('3, −1');
  const dominance = page.locator('[data-activity="dominance"]');
  await dominance.getByRole('radio', { name: 'β' }).check();
  await expect(dominance.getByRole('status')).toContainText('3 > 1');
  const motivation = page.locator('[data-activity="motivation"]');
  await motivation.getByRole('radio', { name: 'Также справедливость' }).check();
  await expect(motivation.locator('td').nth(1)).toHaveText('−1, −3');
  const roles = page.locator('[data-activity="roles"]');
  await roles.getByRole('radio', { name: 'Тебе важна и справедливость' }).check();
  await expect(roles.getByRole('status')).toContainText('Твоя α не является доминирующей');
  const paradox = page.locator('[data-activity="paradox"]');
  await paradox.getByRole('radio', { name: 'Оба выбрали β · (1, 1)' }).check();
  await expect(paradox.getByRole('status')).toContainText('Оба получили бы по 1');
  const number = page.getByLabel('Выбери целое число от 1 до 100');
  await number.press('ArrowRight');
  await page.getByRole('button', { name: 'Сохранить прогноз', exact: true }).click();
  await page.reload();
  await expect(number).toHaveValue('34');
});

test('Mastery keeps feedback, keyboard focus, essay and rubric across reload', async ({ page }) => {
  await ready(page, 'mastery');
  const question = page.locator('#m1');
  await question.getByRole('radio', { name: 'B строго доминирует A.' }).check();
  await question.getByRole('button', { name: 'Проверить ответ' }).focus();
  await page.keyboard.press('Enter');
  await expect(question.locator('.feedback')).toContainText('Не совсем.');
  await expect(question.getByRole('button', { name: 'Проверить ответ' })).toBeFocused();
  await question.getByRole('radio', { name: 'A строго доминирует B.' }).check();
  await expect(question.locator('.feedback')).toHaveCount(0);
  await question.getByRole('button', { name: 'Проверить ответ' }).click();
  await page.getByLabel('Твоё объяснение').fill('Результат зависит и от выбора партнёра.');
  await page.getByRole('button', { name: 'Критерии самопроверки' }).click();
  await page.reload();
  await expect(question.locator('.feedback')).toContainText('Верно.');
  await expect(page.getByLabel('Твоё объяснение')).toHaveValue('Результат зависит и от выбора партнёра.');
  await expect(page.locator('#essay-rubric')).toBeVisible();
});

test('Mastery exercises include their own matrices and stage partner prediction before a best response', async ({ page }) => {
  await ready(page, 'mastery');
  for (let i = 1; i <= 6; i++) await expect(page.locator(`#m${i} table`)).toHaveCount(1);
  await expect(page.getByRole('region', { name: 'Объясни своими словами' }).getByRole('table')).toHaveCount(1);
  const angels = page.locator('#m3');
  await expect(angels.locator('td').nth(1)).toHaveText('−1, −3');
  const question = page.locator('#m5');
  await expect(question.locator('td').nth(1)).toHaveText('−1, −1');
  const response = question.getByRole('group', { name: '2. Выбери свой лучший ответ на эту стратегию' });
  const partnerAlpha = question.getByRole('radio', { name: 'Партнёр: α' });
  const partnerBeta = question.getByRole('radio', { name: 'Партнёр: β' });
  const check = question.getByRole('button', { name: 'Проверить ответ' });
  await expect(response.getByRole('radio', { name: 'α', exact: true })).toBeDisabled();
  await expect(check).toBeDisabled();
  await partnerBeta.check();
  await expect(question.locator('td.selected')).toHaveCount(2);
  await expect(question.locator('.feedback')).toHaveCount(0);
  await response.getByRole('radio', { name: 'β', exact: true }).check();
  await check.click();
  await expect(question.locator('.feedback')).toContainText('Не совсем.');
  await page.reload();
  await expect(partnerBeta).toBeChecked();
  await expect(response.getByRole('radio', { name: 'β', exact: true })).toBeChecked();
  await expect(question.locator('.feedback')).toContainText('Не совсем.');
  await partnerBeta.focus(); await page.keyboard.press('ArrowLeft');
  await expect(partnerAlpha).toBeChecked();
  await expect(response.getByRole('radio', { checked: true })).toHaveCount(0);
  await expect(check).toBeDisabled();
  await expect(question.locator('.feedback')).toHaveCount(0);
  await response.getByRole('radio', { name: 'α', exact: true }).check();
  await expect(question.locator('td.selected')).toHaveText('0, 0');
  await check.click();
  await expect(question.locator('.feedback')).toContainText('Верно.');
  await expect(question.locator('.feedback')).toContainText('твоя α не доминирует β');
  // A previously saved pair must restore both stages even without the new column response.
  await page.evaluate(() => {
    const key = 'knowledge-atlas:chapter:yale-econ-159/lecture-01';
    const previous = JSON.parse(localStorage.getItem(key)!);
    delete previous.responses['mastery-m5-partner'];
    localStorage.setItem(key, JSON.stringify(previous));
  });
  await page.reload();
  await expect(partnerAlpha).toBeChecked();
  await expect(response.getByRole('radio', { name: 'α', exact: true })).toBeChecked();
  await expect(question.locator('.feedback')).toContainText('Верно.');
  for (const width of [320, 390, 768, 1024]) {
    await page.setViewportSize({ width, height: 900 });
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width);
  }
});

test('export, reset and import restore the complete chapter without accepting malformed files', async ({ page }, info) => {
  await ready(page);
  await page.locator('[data-complete-step="strategic-situations"]').click();
  await page.getByRole('button', { name: 'Показать всю главу', exact: true }).first().click();
  await page.getByLabel('Что ты теперь думаешь об этом выборе?').fill('Моя заметка β');
  await page.getByRole('button', { name: 'Источники', exact: true }).click();
  await page.getByText('Сохранение и перенос прогресса', { exact: true }).click();
  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Экспортировать JSON' }).click();
  const download = await downloadPromise, filename = info.outputPath('progress.json');
  await download.saveAs(filename);
  const content = await readFile(filename, 'utf8');
  expect(JSON.parse(content).chapters[0].notes.reflection).toBe('Моя заметка β');
  page.once('dialog', (d) => d.accept());
  await page.getByRole('button', { name: 'Сбросить прогресс главы' }).click();
  await expect(page.locator('[data-progress-label]')).toHaveText('0 из 8 шагов завершено');
  await page.getByRole('button', { name: 'Источники', exact: true }).click();
  await page.getByText('Сохранение и перенос прогресса', { exact: true }).click();
  page.once('dialog', (d) => d.accept());
  await page.getByLabel('Импортировать прогресс этой главы').setInputFiles({ name: 'progress.json', mimeType: 'application/json', buffer: Buffer.from(content) });
  await expect(page.locator('#import-status')).toContainText('Импорт завершён');
  await expect(page.locator('[data-progress-label]')).toHaveText('1 из 8 шагов завершено');
  await page.getByLabel('Импортировать прогресс этой главы').setInputFiles({ name: 'bad.json', mimeType: 'application/json', buffer: Buffer.from('{') });
  await expect(page.locator('#import-status')).toContainText('Не удалось прочитать JSON');
  await page.keyboard.press('Escape');
  await expect(page.getByLabel('Что ты теперь думаешь об этом выборе?')).toHaveValue('Моя заметка β');
});

test('dialogs contain focus, close on Escape and return to their trigger', async ({ page }) => {
  await ready(page);
  const trigger = page.getByRole('button', { name: 'Источники', exact: true });
  await trigger.focus(); await page.keyboard.press('Enter');
  const dialog = page.getByRole('dialog', { name: 'Источники и примечания' });
  await expect(dialog).toBeVisible();
  for (let i = 0; i < 12; i++) { await page.keyboard.press('Tab'); expect(await page.evaluate(() => !!document.activeElement?.closest('dialog'))).toBe(true); }
  await page.keyboard.press('Escape');
  await expect(trigger).toBeFocused();
  await page.getByRole('button', { name: 'Разделы главы', exact: true }).click();
  await expect(page.getByRole('dialog', { name: 'Разделы главы' })).toBeVisible();
  await page.keyboard.press('Escape');
});

test('course drawers preserve the reading context and distinguish course from chapter navigation', async ({ page }) => {
  for (const width of [1440, 390]) {
    await page.setViewportSize({ width, height: 900 });
    await ready(page);
    const url = page.url();
    const modes = page.getByRole('navigation', { name: 'Режимы главы 01' });
    await expect(modes.getByRole('link', { name: /core/i })).toHaveAttribute('aria-current', 'page');
    const course = page.getByRole('button', { name: 'Главы курса', exact: true });
    await course.click();
    const drawer = page.getByRole('dialog', { name: 'Главы курса', exact: true });
    await expect(drawer).toBeVisible();
    await expect(course).toHaveAttribute('aria-expanded', 'true');
    await expect(drawer.getByRole('link', { name: 'Обзор курса и все главы →' })).toHaveAttribute('href', `${siteRoot}/courses/yale-econ-159/`);
    expect(page.url()).toBe(url);
    await page.keyboard.press('Escape');
    await expect(course).toBeFocused();
    await expect(course).toHaveAttribute('aria-expanded', 'false');
    await page.getByRole('button', { name: 'Понятия курса', exact: true }).click();
    const concepts = page.getByRole('dialog', { name: 'Понятия курса', exact: true });
    await expect(concepts.locator('.drawer-concepts > li')).toHaveCount(8);
    const footer = concepts.getByRole('link', { name: 'Все понятия и связи →' });
    const footerBox = await footer.boundingBox();
    expect(footerBox!.y + footerBox!.height).toBeLessThanOrEqual(900);
    await concepts.evaluate((el) => { el.scrollTop = el.scrollHeight; });
    await expect(concepts.getByRole('button', { name: 'Закрыть понятия курса' })).toBeInViewport();
    await footer.click();
    await expect(page).toHaveURL(`${siteRoot}/concepts/`);
    await page.getByRole('button', { name: 'Главы курса', exact: true }).click();
    await expect(page.getByRole('dialog', { name: 'Главы курса', exact: true })).toBeVisible();
    await page.keyboard.press('Escape');
  }
});

test('editorial appendix is ancillary, intact and available from every chapter mode', async ({ page }) => {
  for (const mode of ['core', 'quick', 'mastery']) {
    await ready(page, mode);
    await expect(page.locator('.narrative').getByRole('heading', { name: 'Источники и редакционные примечания' })).toHaveCount(0);
    await page.getByRole('button', { name: 'Источники', exact: true }).click();
    const dialog = page.getByRole('dialog', { name: 'Источники и примечания', exact: true });
    await dialog.getByText('Редакционные примечания и таймкоды', { exact: true }).click();
    await expect(dialog.getByRole('heading', { name: 'Источники и редакционные примечания', exact: true })).toBeVisible();
    await expect(dialog.locator('.editorial-notes')).toContainText('Видео 1:03:20–1:08:32');
    await expect(dialog.locator('.editorial-notes li')).toHaveCount(8);
    await page.keyboard.press('Escape');
  }
});

test('chapter text remains readable without JavaScript', async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage(); await page.goto(`${base}/core/`);
  await expect(page.locator('[data-core-step]:visible')).toHaveCount(8);
  await expect(page.getByRole('heading', { name: '08. Новая задача: угадать две трети среднего' })).toBeVisible();
  await context.close();
});

test('blocked storage is explained and learner data never leaves the app', async ({ page, baseURL }) => {
  await page.addInitScript(() => { Storage.prototype.setItem = () => { throw new DOMException('Quota', 'QuotaExceededError'); }; });
  const external: string[] = [];
  page.on('request', (r) => { if (!r.url().startsWith(baseURL!)) external.push(r.url()); });
  await ready(page, 'quick');
  await expect(page.locator('[data-reader] [data-storage-message]')).toContainText('Не удалось сохранить');
  await page.getByRole('button', { name: 'Показать ответ ↓' }).click();
  await expect(page.locator('#quick-answer')).toContainText('Нет.');
  expect(external).toEqual([]);
});

test('layouts fit mobile and tablet widths and source access stays available', async ({ page }) => {
  for (const width of [320, 390, 768, 1024]) {
    await page.setViewportSize({ width, height: 900 }); await ready(page);
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width);
    await expect(page.getByRole('button', { name: 'Источники', exact: true })).toBeVisible();
    const toggle = page.locator('[data-toggle-all]');
    if (await toggle.getAttribute('aria-pressed') === 'false') await toggle.click();
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width);
  }
});

test('automated accessibility covers all modes, expanded content and dialogs', async ({ page }) => {
  for (const mode of ['core', 'quick', 'mastery']) {
    await ready(page, mode);
    if (mode === 'core') await page.getByRole('button', { name: 'Показать всю главу', exact: true }).first().click();
    const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa']).analyze();
    expect(results.violations).toEqual([]);
  }
  await page.getByRole('button', { name: 'Источники', exact: true }).click();
  await page.getByText('Редакционные примечания и таймкоды', { exact: true }).click();
  await page.getByText('Сохранение и перенос прогресса', { exact: true }).click();
  expect((await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze()).violations).toEqual([]);
  await page.keyboard.press('Escape');
  for (const name of ['Главы курса', 'Понятия курса']) {
    await page.getByRole('button', { name, exact: true }).click();
    expect((await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze()).violations).toEqual([]);
    await page.keyboard.press('Escape');
  }
});

for (const [name, width, height] of [['desktop', 1440, 1080], ['mobile', 390, 844]] as const) {
  test(`Mastery matrices visual reference — ${name}`, async ({ page }) => {
    await page.setViewportSize({ width, height }); await ready(page, 'mastery');
    await page.evaluate(() => document.fonts.ready);
    const angels = page.locator('#m3');
    await angels.evaluate((el) => el.scrollIntoView({ block: 'start', behavior: 'instant' }));
    await page.mouse.move(0, 0);
    await expect(angels).toHaveScreenshot(`mastery-angels-${name}.png`);
    const sequence = page.locator('#m5');
    await sequence.getByRole('radio', { name: 'Партнёр: α' }).check();
    await sequence.getByRole('group', { name: '2. Выбери свой лучший ответ на эту стратегию' }).getByRole('radio', { name: 'α', exact: true }).check();
    await sequence.getByRole('button', { name: 'Проверить ответ' }).click();
    // Keep the entire long exercise in the capture viewport, below the sticky navigation.
    const questionHeight = await sequence.evaluate((el) => Math.ceil(el.getBoundingClientRect().height));
    await page.setViewportSize({ width, height: Math.max(height, questionHeight + 260) });
    await sequence.evaluate((el) => el.scrollIntoView({ block: 'start', behavior: 'instant' }));
    await page.mouse.move(0, 0);
    await expect(sequence).toHaveScreenshot(`mastery-sequence-${name}.png`);
  });
  test(`visual reference — ${name}`, async ({ page }) => {
    await page.setViewportSize({ width, height }); await ready(page);
    await page.evaluate(() => document.fonts.ready);
    await expect(page).toHaveScreenshot(`chapter-${name}.png`);
    await page.getByRole('button', { name: 'Главы курса', exact: true }).click();
    await expect(page).toHaveScreenshot(`course-drawer-${name}.png`);
    await page.keyboard.press('Escape');
    await page.getByRole('button', { name: 'Понятия курса', exact: true }).click();
    await expect(page).toHaveScreenshot(`concepts-drawer-${name}.png`);
    await page.keyboard.press('Escape');
    await page.getByRole('button', { name: 'Источники', exact: true }).click();
    await expect(page).toHaveScreenshot(`sources-${name}.png`);
    await page.keyboard.press('Escape');
    await page.locator('[data-activity="first-choice"]').scrollIntoViewIfNeeded();
    await expect(page.locator('[data-activity="first-choice"]')).toHaveAttribute('data-hydrated', 'true');
    await expect(page.locator('[data-activity="first-choice"]')).toHaveScreenshot(`model-${name}.png`);
    await ready(page, 'quick');
    const quickModel = page.locator('.quick-section').nth(1);
    await page.evaluate(() => document.fonts.ready);
    await quickModel.evaluate((element) => element.scrollIntoView({ block: 'start', behavior: 'instant' }));
    await expect(quickModel).toHaveScreenshot(`quick-${name}.png`);
    await ready(page, 'mastery');
    const question = page.locator('#m1');
    await question.getByRole('radio', { name: 'A строго доминирует B.' }).check();
    await question.getByRole('button', { name: 'Проверить ответ' }).click();
    await question.evaluate((element) => element.scrollIntoView({ block: 'start', behavior: 'instant' }));
    await page.mouse.move(0, 0);
    await expect(question).toHaveScreenshot(`mastery-${name}.png`);
  });
}
