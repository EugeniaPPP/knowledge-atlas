import { defineConfig, devices } from '@playwright/test';
import { existsSync } from 'node:fs';

const macChrome = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const useInstalled = process.platform === 'darwin' && existsSync(macChrome);
const previewPort = process.env.PLAYWRIGHT_PORT || '4321';
const previewUrl = `http://127.0.0.1:${previewPort}/knowledge-atlas/`;
export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  workers: 2,
  timeout: 30000,
  expect: { timeout: 7000, toHaveScreenshot: { animations: 'disabled', maxDiffPixelRatio: .003 } },
  reporter: [['list'], ['html', { open: 'never' }]],
  use: { baseURL: previewUrl, trace: 'retain-on-failure', screenshot: 'only-on-failure' },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'], launchOptions: useInstalled ? { executablePath: macChrome } : {} } },
    { name: 'firefox', grepInvert: /visual reference/, use: { ...devices['Desktop Firefox'] } },
    { name: 'webkit', grepInvert: /visual reference/, use: { ...devices['Desktop Safari'] } },
  ],
  webServer: { command: `npm run preview -- --port ${previewPort}`, url: previewUrl, reuseExistingServer: !process.env.CI, timeout: 30000 },
});
