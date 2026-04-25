import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  timeout: 30_000,
  retries: 0,
  use: {
    baseURL: 'http://localhost:5174',
    headless: true,
    viewport: { width: 390, height: 844 }, // iPhone 14 Pro (default)
    screenshot: 'only-on-failure',
  },
  webServer: {
    command: 'npx vite --port 5174 --strictPort',
    port: 5174,
    timeout: 20_000,
    reuseExistingServer: false,
  },
  projects: [
    {
      name: 'chromium',
      use: { browserName: 'chromium' },
    },
    // ── Mobile device matrix (A-HOTFIX 2026-04-25: visual regression suite) ──
    {
      name: 'iphone-se',
      use: {
        ...devices['iPhone SE'],
        browserName: 'webkit',
      },
    },
    {
      name: 'iphone-13',
      use: {
        ...devices['iPhone 13'],
        browserName: 'webkit',
      },
    },
    {
      name: 'iphone-15-pro-max',
      use: {
        ...devices['iPhone 15 Pro Max'],
        browserName: 'webkit',
      },
    },
    {
      name: 'pixel-7',
      use: {
        ...devices['Pixel 7'],
        browserName: 'chromium',
      },
    },
    {
      name: 'galaxy-s22',
      use: {
        viewport: { width: 360, height: 780 },
        deviceScaleFactor: 3,
        isMobile: true,
        hasTouch: true,
        userAgent: 'Mozilla/5.0 (Linux; Android 12; SM-S901B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/112.0.0.0 Mobile Safari/537.36',
        browserName: 'chromium',
      },
    },
  ],
});
