import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { readFileSync } from 'node:fs';
import type { Chapter, LearningConfig } from '../../src/lib/content/schema';
import { completeStep, initialState } from '../../src/lib/learning/state';
import { openContents } from './helpers/navigation';

for (const lecture of ['lecture-01', 'lecture-02']) for (const locale of ['ru', 'en']) {
  const chapter = JSON.parse(readFileSync(`src/content/chapters/yale-econ-159/${lecture}/chapter.json`, 'utf8')) as Chapter;
  const config: LearningConfig = { chapterId: chapter.id, contentVersion: chapter.contentVersion, stepIds: chapter.steps.map((s) => s.id) };
  const key = `knowledge-atlas:chapter:${chapter.id}`;
  const base = `/knowledge-atlas${locale === 'en' ? '/en' : ''}/courses/yale-econ-159/${lecture}`;
  const first = chapter.steps[0].id, current = chapter.steps[2].id;

  test(`${lecture} ${locale}: unified contents keep chapter, location, completion and sources distinct`, async ({ page }) => {
    test.setTimeout(60000);
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/knowledge-atlas/');
    const state = chapter.steps.slice(0, 2).reduce((s, step) => completeStep(s, step.id, config), initialState(config));
    await page.evaluate(({ key, state }) => localStorage.setItem(key, JSON.stringify(state)), { key, state });
    for (const [width, theme] of [[320, 'light'], [1440, 'dark']] as const) {
      await page.setViewportSize({ width, height: 900 });
      await page.evaluate((theme) => localStorage.setItem('knowledge-atlas:theme', theme), theme);
      await page.goto(`${base}/core/#${current}`);
      await expect(page.locator('[data-reader]')).toHaveAttribute('data-ready', 'true');
      await expect(page.locator('[data-mode-item=core] [data-progress]')).toHaveAttribute('aria-valuenow', '2');
      await expect(page.locator('.chapter-toolbar button')).toHaveCount(0);
      await expect(page.locator('#contents-dialog, #sources-dialog')).toHaveCount(0);
      await page.evaluate(() => document.fonts.ready);
      await page.evaluate(() => new Promise<void>((resolve) => requestAnimationFrame(() => resolve())));
      const readingScroll = await page.evaluate(() => scrollY);
      if (width === 1440) {
        const trigger = await page.locator('[data-open-dialog=course-dialog]:not([data-drawer-view]):visible').boundingBox();
        await page.mouse.click(trigger!.x + trigger!.width / 2, trigger!.y + trigger!.height / 2);
      } else await openContents(page);
      expect(Math.abs(await page.evaluate(() => scrollY) - readingScroll)).toBeLessThanOrEqual(1);
      const drawer = page.locator('#course-dialog'), branch = drawer.locator('[data-current-chapter]');
      await expect(drawer.locator('.drawer-chapters > li')).toHaveCount(24);
      await expect(branch).toHaveAttribute('open', '');
      if (width === 320) await expect(drawer.locator('.course-chapter:not([data-current-chapter])[open]')).toHaveCount(0);
      await expect(branch.locator('[data-step-link]')).toHaveCount(8);
      await expect(branch.locator(`[data-step-link="${current}"]`)).toHaveAttribute('aria-current', 'location');
      await expect(branch.locator(`[data-step-link="${current}"]`)).toBeInViewport();
      await expect(branch.locator('[data-step-link][data-done=true]')).toHaveCount(2);
      const locked = branch.locator('[data-step-link]').last();
      await expect(locked).toHaveAttribute('aria-disabled', 'true');
      await locked.focus(); await page.keyboard.press('Enter'); await expect(page).toHaveURL(`${base}/core/#${current}`);
      await expect(drawer).toBeVisible();
      const other = drawer.locator('.course-chapter:not([data-current-chapter])');
      if (await other.getAttribute('open') !== null) await other.locator('summary').click();
      await other.locator('summary').click(); await expect(other).toHaveAttribute('open', '');
      await expect(page).toHaveURL(`${base}/core/#${current}`);
      await branch.locator(`[data-step-link="${first}"]`).click();
      await expect(drawer).not.toBeVisible();
      await expect(page.locator(`#${first} h2`).first()).toBeFocused();
      await expect(page).toHaveURL(`${base}/core/#${first}`);

      await openContents(page);
      await page.evaluate(() => new Promise<void>((resolve) => requestAnimationFrame(() => resolve())));
      const before = await drawer.evaluate((el) => el.scrollTop);
      const sourceButton = drawer.locator('[data-show-sources]');
      await expect(sourceButton).toBeInViewport(); await sourceButton.click();
      await expect(page.locator('dialog[open]')).toHaveCount(1);
      await expect(drawer).toHaveAccessibleName(locale === 'ru' ? 'Источники и примечания' : 'Sources and notes');
      await expect(drawer.locator('[data-course-view=sources]')).toBeVisible();
      expect((await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze()).violations).toEqual([]);
      await drawer.locator('[data-course-back]').click();
      await expect(drawer).toHaveAccessibleName(locale === 'ru' ? 'Содержание курса' : 'Course contents');
      await expect(sourceButton).toBeFocused();
      expect(Math.abs(await drawer.evaluate((el) => el.scrollTop) - before)).toBeLessThan(2);
      expect((await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze()).violations).toEqual([]);
      await page.keyboard.press('Escape');
      await expect(page.locator('[data-open-dialog=course-dialog]:not([data-drawer-view]):visible')).toBeFocused();
      const saved = await page.evaluate((key) => JSON.parse(localStorage.getItem(key)!), key);
      expect(saved.completedStepIds).toEqual(config.stepIds.slice(0, 2));
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    }
    for (const mode of ['quick', 'mastery']) {
      await page.goto(`${base}/${mode}/`); await openContents(page);
      await expect(page.locator('[data-current-chapter]')).toContainText(locale === 'ru' ? 'Разделы Core' : 'Core sections');
      await expect(page.locator('[data-progress]')).toHaveCount(0);
      await page.locator(`[data-step-link="${first}"]`).click();
      await expect(page).toHaveURL(`${base}/core/#${first}`);
    }
  });

  test(`${lecture} ${locale}: unified navigation visual reference`, async ({ page }) => {
    const width = lecture === 'lecture-01' ? 1440 : 390;
    const theme = locale === 'en' ? 'dark' : 'light';
    await page.setViewportSize({ width, height: 1000 });
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/knowledge-atlas/');
    const state = chapter.steps.slice(0, 2).reduce((s, step) => completeStep(s, step.id, config), initialState(config));
    await page.evaluate(({ key, state, theme }) => { localStorage.setItem(key, JSON.stringify(state)); localStorage.setItem('knowledge-atlas:theme', theme); }, { key, state, theme });
    await page.goto(`${base}/core/#${current}`);
    await expect(page.locator('[data-reader]')).toHaveAttribute('data-ready', 'true');
    await page.evaluate(() => document.fonts.ready);
    await openContents(page); await page.mouse.move(0, 0);
    await expect(page.locator('#course-dialog [data-step-link][aria-current]')).toBeInViewport();
    await expect(page).toHaveScreenshot(`course-contents-${lecture}-${locale}.png`);
    await page.locator('[data-show-sources]').click(); await page.mouse.move(0, 0);
    await expect(page).toHaveScreenshot(`chapter-sources-${lecture}-${locale}.png`);
  });
}
