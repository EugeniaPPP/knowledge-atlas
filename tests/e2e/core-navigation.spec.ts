import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { readFileSync } from 'node:fs';
import type { Chapter, LearningConfig } from '../../src/lib/content/schema';
import { completeStep, initialState } from '../../src/lib/learning/state';

const root = '/knowledge-atlas';
for (const lecture of ['lecture-01', 'lecture-02']) for (const locale of ['ru', 'en']) {
  const chapter = JSON.parse(readFileSync(`src/content/chapters/yale-econ-159/${lecture}/chapter.json`, 'utf8')) as Chapter;
  const config: LearningConfig = { chapterId: chapter.id, contentVersion: chapter.contentVersion, stepIds: chapter.steps.map((s) => s.id) };
  const base = `${root}${locale === 'en' ? '/en' : ''}/courses/yale-econ-159/${lecture}`;
  const first = chapter.steps[0].id, next = chapter.steps[1].id;

  test(`${lecture} ${locale}: Core progress stays visible and completed actions disappear across reload`, async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.setViewportSize({ width: 320, height: 900 });
    await page.goto(`${base}/core/`);
    await expect(page.locator('[data-reader]')).toHaveAttribute('data-ready', 'true');
    const progress = page.getByRole('progressbar');
    await expect(page.locator('.chapter-toolbar [data-progress]')).toHaveCount(1);
    await expect(progress).toHaveAttribute('aria-valuenow', '0');
    await expect(progress).toHaveAttribute('aria-valuemax', String(chapter.steps.length));
    const button = page.locator(`[data-complete-step="${first}"]`);
    await button.focus(); await page.keyboard.press('Enter');
    await expect(button).toBeHidden();
    await expect(page.locator(`#${next} h2`).first()).toBeFocused();
    await expect(progress).toHaveAttribute('aria-valuenow', '1');
    await expect(progress).toHaveAttribute('aria-valuetext', locale === 'ru' ? '1 из 8 шагов завершено' : '1 of 8 steps completed');
    await expect(progress).toBeInViewport({ ratio: 1 });
    await expect(page.locator('[data-progress-count]')).toHaveText('1');
    await expect(page.locator('[data-progress-step][data-done=true]')).toHaveCount(1);
    expect(await page.locator(`#${next}`).evaluate((el) => getComputedStyle(el).borderTopWidth)).toBe('0px');
    await expect(page.locator(`#${first} .source-ref a`)).toHaveAttribute('href', /https:/);

    for (const width of [320, 390, 768, 1440]) {
      await page.setViewportSize({ width, height: 900 });
      await page.locator(`#${next} .step-footer`).evaluate((el) => el.scrollIntoView({ block: 'center', behavior: 'instant' }));
      await expect(progress).toBeInViewport({ ratio: 1 });
      const boxes = await page.locator('.top, .chapter-toolbar').evaluateAll((elements) => elements.map((el) => el.getBoundingClientRect().toJSON()));
      expect(Math.abs(boxes[1].top - boxes[0].bottom)).toBeLessThanOrEqual(1);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    }
    await page.reload();
    await expect(page.locator('[data-reader]')).toHaveAttribute('data-ready', 'true');
    await expect(button).toBeHidden();
    await expect(progress).toHaveAttribute('aria-valuenow', '1');
    await page.locator('[data-toggle-all]').click();
    await expect(page.locator('[data-core-step]:visible')).toHaveCount(chapter.steps.length);
    await page.locator('[data-core-step]').last().evaluate((el) => el.scrollIntoView({ block: 'start', behavior: 'instant' }));
    await expect(progress).toHaveAttribute('aria-valuenow', '1');
    await expect(progress).toBeInViewport({ ratio: 1 });
    expect((await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze()).violations).toEqual([]);
    for (const mode of ['quick', 'mastery']) {
      await page.locator('.mode-nav').getByRole('link', { name: mode === 'quick' ? 'Quick' : 'Mastery', exact: true }).click();
      await expect(page).toHaveURL(`${base}/${mode}/`);
      await expect(page.locator('[data-core-progress]')).toHaveCount(0);
    }
  });

  for (const theme of ['light', 'dark']) {
    test(`${lecture} ${locale}: Core reading visual reference — ${theme}`, async ({ page }) => {
      const width = (lecture === 'lecture-01') === (locale === 'ru') ? 1440 : 320;
      await page.setViewportSize({ width, height: 1000 });
      await page.emulateMedia({ reducedMotion: 'reduce' });
      await page.goto(`${root}/`);
      const state = chapter.steps.slice(0, 3).reduce((s, step) => completeStep(s, step.id, config), initialState(config));
      await page.evaluate(({ key, state, theme }) => {
        localStorage.setItem(key, JSON.stringify(state)); localStorage.setItem('knowledge-atlas:theme', theme);
      }, { key: `knowledge-atlas:chapter:${chapter.id}`, state, theme });
      await page.goto(`${base}/core/`);
      await expect(page.locator('[data-reader]')).toHaveAttribute('data-ready', 'true');
      await page.evaluate(() => document.fonts.ready);
      await page.locator(`#${chapter.steps[2].id} .step-footer`).evaluate((el) => el.scrollIntoView({ block: 'center', behavior: 'instant' }));
      await page.mouse.move(0, 0);
      await expect(page.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '3');
      await expect(page).toHaveScreenshot(`core-reading-${lecture}-${locale}-${theme}.png`);
    });
  }
}
