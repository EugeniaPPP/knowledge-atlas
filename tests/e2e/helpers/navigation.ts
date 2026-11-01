import type { Page } from '@playwright/test';

export async function openContents(page: Page) {
  const trigger = page.locator('[data-open-dialog="course-dialog"]:not([data-drawer-view]):visible');
  await trigger.focus(); await trigger.press('Enter');
}

export async function openSources(page: Page) {
  await openContents(page);
  await page.locator('[data-show-sources]').click();
}
