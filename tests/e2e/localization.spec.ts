import { test, expect, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { readFile } from 'node:fs/promises';

const root = '/knowledge-atlas', chapter = '/courses/yale-econ-159/lecture-01';
const ru = root + chapter, en = root + '/en' + chapter;
const ready = async (page: Page, mode = 'core') => {
  await page.goto(`${en}/${mode}/`);
  await expect(page.locator('[data-reader]')).toHaveAttribute('data-ready', 'true');
  await expect(page.locator('html')).toHaveAttribute('lang', 'en');
};
const switchTo = async (page: Page, locale: 'en' | 'ru') => {
  const link = page.locator('.language-switcher').getByRole('link', { name: locale === 'en' ? 'English' : 'Русский', exact: true });
  // Native keyboard activation preserves the actual viewport. WebKit's locator.click()
  // scrolls sticky header links before clicking, unlike a real mouse click.
  await link.focus(); await link.press('Enter');
};

test('language switching preserves mode, section, answers, notes and shared progress', async ({ page }) => {
  await page.goto(`${ru}/core/`);
  await page.locator('[data-activity="first-choice"]').getByRole('radio', { name: 'β', exact: true }).check();
  await page.locator('[data-complete-step="strategic-situations"]').click();
  await page.locator('#outcomes').evaluate((el) => el.scrollIntoView({ block: 'start', behavior: 'instant' }));
  await switchTo(page, 'en');
  await expect(page).toHaveURL(`${en}/core/#outcomes`);
  await expect(page.locator('[data-progress-label]')).toHaveText('1 of 8 steps completed');
  await expect(page.locator('[data-core-step]:visible')).toHaveCount(2);
  await expect(page.locator('[data-activity="first-choice"]').getByRole('radio', { name: 'β', exact: true })).toBeChecked();
  await page.locator('.mode-nav').getByRole('link', { name: /Mastery/ }).click();
  const q = page.locator('#m5');
  await q.getByRole('radio', { name: 'Partner: α' }).check();
  await q.getByRole('group', { name: '2. Choose your best response to that strategy' }).getByRole('radio', { name: 'α', exact: true }).check();
  await q.getByRole('button', { name: 'Check answer' }).click();
  await q.evaluate((el) => el.scrollIntoView({ block: 'start', behavior: 'instant' }));
  await switchTo(page, 'ru');
  await expect(page).toHaveURL(`${ru}/mastery/#m5`);
  await expect(q.locator('.feedback')).toContainText('Верно.');
  await page.getByLabel('Твоё объяснение').fill('Мои мысли / my reasoning: α > β');
  await page.getByRole('button', { name: 'Критерии самопроверки' }).click();
  await switchTo(page, 'en');
  await expect(page).toHaveURL(`${en}/mastery/#self-explanation`);
  await expect(page.getByLabel('Your explanation')).toHaveValue('Мои мысли / my reasoning: α > β');
  await expect(page.locator('#essay-rubric')).toBeVisible();
  await expect(q.locator('.feedback')).toContainText('Correct.');
  await page.reload();
  await expect(page.getByLabel('Your explanation')).toHaveValue('Мои мысли / my reasoning: α > β');
  const keys = await page.evaluate(() => Object.keys(localStorage).filter((key) => key.startsWith('knowledge-atlas:chapter:')));
  expect(keys).toEqual(['knowledge-atlas:chapter:yale-econ-159/lecture-01']);
  await page.locator('.mode-nav').getByRole('link', { name: /Quick/ }).click();
  await page.getByRole('button', { name: 'Show answer ↓' }).click();
  await switchTo(page, 'ru');
  await expect(page).toHaveURL(`${ru}/quick/`);
  await expect(page.locator('#quick-answer')).toContainText('Нет.');
});

test('English Core has complete narrative, nine working activities and ungated completion', async ({ page }) => {
  const errors: string[] = []; page.on('pageerror', (e) => errors.push(e.message));
  await ready(page);
  await expect(page.locator('[data-core-step]:visible')).toHaveCount(1);
  await page.getByRole('button', { name: 'Reveal the whole chapter', exact: true }).first().click();
  await expect(page.locator('[data-core-step]:visible')).toHaveCount(8);
  await expect(page.locator('[data-activity]')).toHaveCount(9);
  await expect(page.locator('details.extra')).toHaveCount(5);
  const outcome = page.locator('[data-activity="outcome-explorer"]');
  await outcome.getByRole('group', { name: 'Your partner’s choice' }).getByRole('radio', { name: 'β' }).check();
  await expect(outcome.getByRole('status')).toContainText('your grade is A, your partner’s grade is C');
  const layers = page.locator('[data-activity="matrix-layers"]');
  await layers.getByRole('radio', { name: 'Payoffs' }).check();
  await expect(layers.locator('td').nth(1)).toHaveText('3, −1');
  const dominance = page.locator('[data-activity="dominance"]');
  await dominance.getByRole('radio', { name: 'β' }).check();
  await expect(dominance.getByRole('status')).toContainText('3 > 1');
  const preferences = page.locator('[data-activity="motivation"]');
  await preferences.getByRole('radio', { name: 'Fairness as well' }).check();
  await expect(preferences.locator('td').nth(1)).toHaveText('−1, −3');
  const roles = page.locator('[data-activity="roles"]');
  await roles.getByRole('radio', { name: 'You also care about fairness' }).check();
  await expect(roles.getByRole('status')).toContainText('not strictly dominant');
  const paradox = page.locator('[data-activity="paradox"]');
  await paradox.getByRole('radio', { name: 'Both choose β · (1, 1)' }).check();
  await expect(paradox.getByRole('status')).toContainText('better for each');
  await page.getByLabel('Choose an integer from 1 to 100').press('ArrowRight');
  await page.getByRole('button', { name: 'Save prediction', exact: true }).click();
  await page.getByLabel('What do you think about your choice now?').fill('Preferences matter.');
  await page.reload();
  await expect(page.getByLabel('Choose an integer from 1 to 100')).toHaveValue('34');
  await expect(page.getByLabel('What do you think about your choice now?')).toHaveValue('Preferences matter.');
  expect(await page.locator('.narrative').innerText()).not.toMatch(/[А-Яа-яЁё]/u);
  await page.getByRole('button', { name: 'Return to step-by-step reading' }).click();
  const ids = await page.locator('[data-complete-step]').evaluateAll((els) => els.map((el) => (el as HTMLElement).dataset.completeStep!));
  for (const id of ids) await page.locator(`[data-complete-step="${id}"]`).click();
  await expect(page).toHaveURL(`${en}/mastery/`);
  await expect(page.locator('[data-progress-label]')).toHaveText('8 of 8 steps completed');
  expect(errors).toEqual([]);
});

test('English Mastery is self-contained and distinguishes prediction from dominance', async ({ page }) => {
  await ready(page, 'mastery');
  for (let i = 1; i <= 6; i++) await expect(page.locator(`#m${i} table`)).toHaveCount(1);
  await expect(page.locator('#self-explanation table')).toHaveCount(1);
  const angels = page.locator('#m3');
  await expect(angels.locator('td').nth(1)).toHaveText('−1, −3');
  await angels.getByRole('radio', { name: 'Neither.', exact: true }).check();
  await angels.getByRole('button', { name: 'Check answer' }).click();
  await expect(angels.locator('.feedback')).toContainText('Correct.');
  const q = page.locator('#m5'), response = q.getByRole('group', { name: '2. Choose your best response to that strategy' });
  await expect(response.getByRole('radio').first()).toBeDisabled();
  await expect(q.locator('td').nth(1)).toHaveText('−1, −1');
  await q.getByRole('radio', { name: 'Partner: β' }).check();
  await response.getByRole('radio', { name: 'β', exact: true }).check();
  await q.getByRole('button', { name: 'Check answer' }).focus(); await page.keyboard.press('Enter');
  await expect(q.locator('.feedback')).toContainText('Not quite.');
  await q.getByRole('radio', { name: 'Partner: β' }).focus(); await page.keyboard.press('ArrowLeft');
  await expect(q.getByRole('button', { name: 'Check answer' })).toBeDisabled();
  await expect(q.locator('.feedback')).toHaveCount(0);
  await response.getByRole('radio', { name: 'α', exact: true }).check();
  await q.getByRole('button', { name: 'Check answer' }).click();
  await expect(q.locator('.feedback')).toContainText('Your α does not strictly dominate β');
  await page.reload(); await expect(q.locator('.feedback')).toContainText('Correct.');
  expect(await page.locator('.narrative').innerText()).not.toMatch(/[А-Яа-яЁё]/u);
});

test('English navigation, concepts and source appendix stay in the selected language', async ({ page }) => {
  await page.goto(`${root}/en/`);
  await page.getByRole('link', { name: 'All 24 lectures', exact: true }).click();
  await expect(page.locator('.course-list > li')).toHaveCount(24);
  await expect(page.locator('.availability').filter({ hasText: 'Planned' })).toHaveCount(23);
  await page.goto(`${root}/en/concepts/`);
  await expect(page.locator('.concept-list > li')).toHaveCount(8);
  await page.getByRole('link', { name: 'Strict dominance', exact: true }).click();
  await page.getByRole('link', { name: 'Understand in context →' }).click();
  await expect(page).toHaveURL(`${en}/core/#dominance`);
  await expect(page.locator('#dominance')).toBeVisible();
  await switchTo(page, 'ru'); await expect(page).toHaveURL(`${ru}/core/#dominance`);
  for (const mode of ['core', 'quick', 'mastery']) {
    await ready(page, mode);
    for (const [trigger, heading] of [['Course chapters','Course chapters'],['Course concepts','Course concepts'],['Chapter sections','Chapter sections'],['Sources','Sources and notes']]) {
      const button = page.getByRole('button', { name: trigger, exact: true });
      await button.click();
      const dialog = page.getByRole('dialog', { name: heading, exact: true });
      expect(await dialog.innerText()).not.toMatch(/[А-Яа-яЁё]/u);
      if (trigger === 'Sources') {
        await dialog.getByText('Editorial notes and timestamps', { exact: true }).click();
        await expect(dialog.locator('.editorial-notes li')).toHaveCount(8);
        await expect(dialog.locator('.editorial-notes')).toContainText('1:03:20–1:08:32');
      }
      await page.keyboard.press('Escape'); await expect(button).toBeFocused();
    }
  }
});

test('English export/import and storage errors preserve existing data formats', async ({ page }, info) => {
  await ready(page);
  await page.locator('[data-complete-step="strategic-situations"]').click();
  await page.getByRole('button', { name: 'Sources', exact: true }).click();
  await page.getByText('Save and transfer progress', { exact: true }).click();
  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Export JSON' }).click();
  const file = info.outputPath('progress.json'); await (await downloadPromise).saveAs(file);
  const content = await readFile(file, 'utf8');
  expect(JSON.parse(content).chapters[0].completedStepIds).toEqual(['strategic-situations']);
  page.once('dialog', (d) => { expect(d.message()).toContain('Reset this chapter'); return d.accept(); });
  await page.getByRole('button', { name: 'Reset chapter progress' }).click();
  await expect(page).toHaveURL(`${en}/core/`);
  await page.getByRole('button', { name: 'Sources', exact: true }).click();
  await page.getByText('Save and transfer progress', { exact: true }).click();
  page.once('dialog', (d) => { expect(d.message()).toContain('Completed steps: 1'); return d.accept(); });
  await page.getByLabel('Import progress for this chapter').setInputFiles({ name: 'progress.json', mimeType: 'application/json', buffer: Buffer.from(content) });
  await expect(page.locator('#import-status')).toContainText('Import complete.');
  await page.getByLabel('Import progress for this chapter').setInputFiles({ name: 'bad.json', mimeType: 'application/json', buffer: Buffer.from('{') });
  await expect(page.locator('#import-status')).toContainText('could not be read');
  await page.keyboard.press('Escape');
  await switchTo(page, 'ru'); await expect(page.locator('[data-progress-label]')).toHaveText('1 из 8 шагов завершено');
  await page.addInitScript(() => { Storage.prototype.setItem = () => { throw new DOMException('Quota', 'QuotaExceededError'); }; });
  await ready(page, 'quick');
  await expect(page.locator('[data-reader] [data-storage-message]')).toContainText('Changes could not be saved');
  await page.getByRole('button', { name: 'Show answer ↓' }).click();
  await expect(page.locator('#quick-answer')).toContainText('No.');
});

test('English layouts fit all supported widths and pass accessibility checks', async ({ page }) => {
  for (const mode of ['core', 'quick', 'mastery']) {
    await ready(page, mode);
    if (mode === 'core') await page.getByRole('button', { name: 'Reveal the whole chapter', exact: true }).first().click();
    for (const width of [320, 390, 768, 1440]) {
      await page.setViewportSize({ width, height: 900 });
      expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width);
      await expect(page.locator('.language-switcher').getByRole('link', { name: 'Русский', exact: true })).toBeVisible();
      await expect(page.getByRole('button', { name: 'Sources', exact: true })).toBeVisible();
    }
    expect((await new AxeBuilder({ page }).withTags(['wcag2a','wcag2aa','wcag21aa','wcag22aa']).analyze()).violations).toEqual([]);
  }
  for (const name of ['Sources', 'Course chapters', 'Course concepts', 'Chapter sections']) {
    await page.getByRole('button', { name, exact: true }).click();
    expect((await new AxeBuilder({ page }).withTags(['wcag2a','wcag2aa','wcag21aa']).analyze()).violations).toEqual([]);
    await page.keyboard.press('Escape');
  }
});

test('native language links and complete English Core work without JavaScript', async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage(); await page.goto(`${ru}/core/`);
  await switchTo(page, 'en');
  await expect(page).toHaveURL(`${en}/core/`);
  await expect(page.locator('[data-core-step]:visible')).toHaveCount(8);
  await expect(page.getByRole('heading', { name: '08. A new game: guess two thirds of the average' })).toBeVisible();
  await context.close();
});

for (const [name, width, height] of [['desktop',1440,1080], ['mobile',390,844]] as const) {
  test(`English visual reference — ${name}`, async ({ page }) => {
    await page.setViewportSize({ width, height }); await ready(page);
    await page.evaluate(() => document.fonts.ready);
    await expect(page).toHaveScreenshot(`english-chapter-${name}.png`);
    await ready(page, 'mastery');
    const q = page.locator('#m5');
    await q.getByRole('radio', { name: 'Partner: α' }).check();
    await q.getByRole('group', { name: '2. Choose your best response to that strategy' }).getByRole('radio', { name: 'α', exact: true }).check();
    await q.getByRole('button', { name: 'Check answer' }).click();
    const questionHeight = await q.evaluate((el) => Math.ceil(el.getBoundingClientRect().height));
    await page.setViewportSize({ width, height: Math.max(height, questionHeight + 260) });
    await q.evaluate((el) => el.scrollIntoView({ block: 'start', behavior: 'instant' }));
    await page.mouse.move(0,0);
    await expect(q).toHaveScreenshot(`english-sequence-${name}.png`);
  });
}
