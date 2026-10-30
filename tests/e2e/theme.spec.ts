import { test, expect, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const root = '/knowledge-atlas';
const chapter = '/courses/yale-econ-159/lecture-01';
const key = 'knowledge-atlas:theme';
const toggle = (page: Page) => page.locator('button.theme-switcher');
async function choose(page: Page, value: 'light' | 'dark') {
  if (await page.locator('html').getAttribute('data-theme') === value) return;
  // Native keyboard activation preserves the reading viewport in WebKit.
  await toggle(page).focus(); await toggle(page).press('Enter');
}
async function appearance(page: Page, theme: 'light' | 'dark') {
  await expect(page.locator('html')).toHaveAttribute('data-theme', theme);
  expect(await page.locator('html').evaluate((el) => getComputedStyle(el).colorScheme)).toBe(theme);
  expect(await page.locator('body').evaluate((el) => getComputedStyle(el).backgroundColor)).toBe(theme === 'dark' ? 'rgb(27, 29, 34)' : 'rgb(255, 255, 255)');
  for (const meta of await page.locator('meta[name="theme-color"]').all()) await expect(meta).toHaveAttribute('content', theme === 'dark' ? '#1b1d22' : '#ffffff');
}

test('appearance resolves before deferred scripts, persists across locales and leaves learning data intact', async ({ page }) => {
  const errors: string[] = []; page.on('pageerror', (error) => errors.push(error.message));
  await page.addInitScript(() => {
    if (!localStorage.getItem('knowledge-atlas:theme')) localStorage.setItem('knowledge-atlas:theme', 'dark');
  });
  await page.route('**/_astro/*.js', (route) => route.abort());
  await page.goto(`${root}${chapter}/core/`);
  await appearance(page, 'dark');
  await page.unroute('**/_astro/*.js');
  await page.reload();
  await expect(page.locator('[data-reader]')).toHaveAttribute('data-ready', 'true');
  await page.locator('[data-activity="first-choice"]').getByRole('radio', { name: 'β', exact: true }).check();
  await page.locator('[data-complete-step]').first().click();
  const learningKey = 'knowledge-atlas:chapter:yale-econ-159/lecture-01';
  const state = await page.evaluate((key) => localStorage.getItem(key), learningKey);
  await choose(page, 'light');
  await appearance(page, 'light');
  expect(await page.evaluate((key) => localStorage.getItem(key), learningKey)).toBe(state);
  // Navigation must not overwrite the preference; setup script only seeds absent storage.
  await page.locator('.language-switcher a[lang="en"]').focus();
  await page.keyboard.press('Enter');
  await appearance(page, 'light');
  await expect(page.locator('[data-progress-label]')).toHaveText('1 of 8 steps completed');
  await choose(page, 'dark');
  for (const mode of ['quick', 'mastery', 'core']) {
    await page.locator(`.mode-nav a[href$="/${mode}/"]`).click();
    await appearance(page, 'dark');
  }
  await page.reload(); await appearance(page, 'dark');
  expect(await page.evaluate((key) => localStorage.getItem(key), key)).toBe('dark');
  expect(errors).toEqual([]);
});

test('system appearance is the default; one click toggles the theme and action icon without a menu', async ({ page }) => {
  await page.emulateMedia({ colorScheme: 'dark' });
  await page.goto(`${root}/en${chapter}/quick/`);
  await appearance(page, 'dark');
  await expect(toggle(page)).toHaveAccessibleName('Switch to light theme');
  await expect(toggle(page).locator('[data-theme-icon="light"]')).toBeVisible();
  expect(await page.evaluate((key) => localStorage.getItem(key), key)).toBeNull();
  await page.emulateMedia({ colorScheme: 'light' }); await appearance(page, 'light');
  await expect(toggle(page)).toHaveAccessibleName('Switch to dark theme');
  await page.emulateMedia({ colorScheme: 'dark' }); await appearance(page, 'dark');
  await toggle(page).click(); await appearance(page, 'light');
  await expect(toggle(page)).toHaveAccessibleName('Switch to dark theme');
  await expect(toggle(page)).toHaveAttribute('title', 'Switch to dark theme');
  await expect(toggle(page).locator('[data-theme-icon="dark"]')).toBeVisible();
  await expect(toggle(page).locator('[data-theme-icon="light"]')).not.toBeVisible();
  await expect(page.locator('.theme-options, details.theme-switcher')).toHaveCount(0);
  await page.emulateMedia({ colorScheme: 'light' }); await appearance(page, 'light');
  await page.emulateMedia({ colorScheme: 'dark' }); await appearance(page, 'light');
  await toggle(page).focus(); await page.keyboard.press('Enter'); await appearance(page, 'dark');
  await expect(toggle(page)).toBeFocused();
  await expect(toggle(page)).toHaveAccessibleName('Switch to light theme');
  await page.keyboard.press('Space'); await appearance(page, 'light');
  await expect(toggle(page)).toBeFocused();
  await page.reload(); await appearance(page, 'light');
});

test('bad or unavailable storage cannot break appearance or reading', async ({ page }) => {
  const errors: string[] = []; page.on('pageerror', (error) => errors.push(error.message));
  await page.addInitScript(() => {
    localStorage.setItem('knowledge-atlas:theme', 'unexpected');
    Storage.prototype.setItem = () => { throw new DOMException('Blocked', 'SecurityError'); };
  });
  await page.emulateMedia({ colorScheme: 'dark' });
  await page.goto(`${root}${chapter}/core/`); await appearance(page, 'dark');
  await choose(page, 'light'); await appearance(page, 'light');
  await expect(page.locator('[data-theme-status]')).toContainText('хранилище браузера недоступно');
  await expect(page.locator('[data-core-step]:visible')).toHaveCount(1);
  await page.addInitScript(() => {
    Storage.prototype.getItem = () => { throw new DOMException('Blocked', 'SecurityError'); };
  });
  await page.reload(); await appearance(page, 'dark');
  await choose(page, 'light'); await appearance(page, 'light');
  expect(errors).toEqual([]);
});

test('dark system appearance and the complete narrative work without JavaScript', async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false, colorScheme: 'dark' });
  const page = await context.newPage(); await page.goto(`${root}/en${chapter}/core/`);
  expect(await page.locator('body').evaluate((el) => getComputedStyle(el).backgroundColor)).toBe('rgb(27, 29, 34)');
  await expect(toggle(page)).not.toBeVisible();
  await expect(page.locator('[data-core-step]:visible')).toHaveCount(8);
  await context.close();
});

test('graphite remains accessible in both languages, all modes, dialogs and narrow headers', async ({ page }) => {
  await page.emulateMedia({ colorScheme: 'dark' });
  const audit = async () => expect((await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa']).analyze()).violations).toEqual([]);
  for (const locale of ['', '/en']) {
    for (const mode of ['quick', 'core', 'mastery']) {
      await page.goto(`${root}${locale}${chapter}/${mode}/`);
      if (mode === 'core') await page.locator('[data-toggle-all]').click();
      await audit();
    }
    for (const width of [320, 360, 390, 600, 768, 1440]) {
      await page.setViewportSize({ width, height: 900 });
      expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width);
      await toggle(page).focus();
      await expect(toggle(page)).toBeInViewport();
      await expect(toggle(page)).toHaveCSS('width', '44px');
      await expect(toggle(page)).toHaveCSS('height', '44px');
    }
    await audit();
    for (const id of ['sources-dialog', 'course-dialog', 'concepts-dialog']) {
      await page.locator(`[data-open-dialog="${id}"]:visible`).first().click();
      await audit(); await page.keyboard.press('Escape');
    }
  }
});

for (const [name, width, height] of [['desktop', 1440, 1080], ['mobile', 390, 844]] as const) {
  test(`graphite visual reference — ${name}`, async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'dark' });
    await page.setViewportSize({ width, height });
    await page.goto(`${root}/en${chapter}/core/`);
    await page.evaluate(() => document.fonts.ready);
    await expect(page).toHaveScreenshot(`graphite-core-${name}.png`);
    await expect(page.locator('.top')).toHaveScreenshot(`theme-header-dark-${name}.png`);
    await toggle(page).click(); await appearance(page, 'light');
    await expect(page.locator('.top')).toHaveScreenshot(`theme-header-light-${name}.png`);
    await toggle(page).click(); await appearance(page, 'dark');
    await page.mouse.move(0, 0);
    await page.locator('[data-toggle-all]').click();
    const model = page.locator('[data-activity="matrix-layers"]');
    await model.getByRole('radio', { name: 'Payoffs', exact: true }).check();
    await model.evaluate((el) => el.scrollIntoView({ block: 'start', behavior: 'instant' }));
    await expect(model).toHaveScreenshot(`graphite-model-${name}.png`);
    await page.goto(`${root}${chapter}/mastery/`);
    const q = page.locator('#m5');
    await q.getByRole('radio', { name: 'Партнёр: α', exact: true }).check();
    await q.getByRole('group', { name: '2. Выбери свой лучший ответ на эту стратегию' }).getByRole('radio', { name: 'α', exact: true }).check();
    await q.getByRole('button', { name: 'Проверить ответ' }).click();
    const questionHeight = await q.evaluate((el) => Math.ceil(el.getBoundingClientRect().height));
    await page.setViewportSize({ width, height: Math.max(height, questionHeight + 260) });
    await q.evaluate((el) => el.scrollIntoView({ block: 'start', behavior: 'instant' }));
    await page.mouse.move(0, 0);
    await expect(q).toHaveScreenshot(`graphite-mastery-${name}.png`);
  });
}
