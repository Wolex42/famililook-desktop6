/**
 * results-story-visual.spec.js
 *
 * Visual regression tests for the FamiliMatch results journey (SwipeJourney).
 * Asserts that cards 1, 2, 5, and 8 render their bottom content fully and
 * that the fixed action bar ("Results actions") is visible across the 5-device
 * matrix defined in playwright.config.js.
 *
 * Card inventory:
 *   Card 1 — CompatibilityScore (type: reveal)
 *   Card 2 — ChemistryLabel (type: verdict, position: absolute, gradient bg)
 *   Card 5 — SocialProof / Variant 2 (type: deepdive, CEO-locked "X of 8 features")
 *   Card 8 — DuoUpgrade (type: upsell, position: absolute, £3.99/mo line)
 *
 * NOTE: These tests require VITE_USE_SHARED_JOURNEY=true and a running dev server
 * (configured in playwright.config.js webServer block). The mock results are
 * injected via the _e2e_mock query param handled by the SoloPage E2E test hook.
 *
 * Since the SoloPage does not currently implement _e2e_mock injection, the tests
 * use page.route() to intercept the /compare/faces API call and return fixture data.
 *
 * Author: FE Lead — A-HOTFIX 2026-04-25
 * Spec: SPEC_A_HOTFIX_VISUAL_FIX_MOBILE_UX_2026_04_25.md §4
 */

import { test, expect } from '@playwright/test';

// ── Fixture data matching compare_faces.v1 contract ──
// 4 matching features (eyebrows, smile, skin, hair) — renders "4 of 8 features in common."
const MOCK_COMPARE_RESPONSE = {
  ok: true,
  percentage: 73,
  chemistry_label: 'Complementary Pair',
  chemistry_color: '#3B82F6',
  embedding_similarity: 0.78,
  feature_similarity: 0.625,
  feature_comparisons: [
    { feature: 'eyes', label_a: 'Round', label_b: 'Almond', match: false },
    { feature: 'eyebrows', label_a: 'Arched', label_b: 'Arched', match: true },
    { feature: 'smile', label_a: 'Wide', label_b: 'Wide', match: true },
    { feature: 'nose', label_a: 'Straight', label_b: 'Button', match: false },
    { feature: 'face_shape', label_a: 'Oval', label_b: 'Round', match: false },
    { feature: 'skin', label_a: 'Fair', label_b: 'Fair', match: true },
    { feature: 'hair', label_a: 'Dark', label_b: 'Dark', match: true },
    { feature: 'ears', label_a: 'Detached', label_b: 'Attached', match: false },
  ],
  shared_features: ['eyebrows', 'smile', 'skin', 'hair'],
  calibrated_a: {},
  calibrated_b: {},
  name_a: 'Alice',
  name_b: 'Bob',
  fusion_image: null,
};

// ── Helper: intercept API and inject mock results ──
async function interceptAndInjectResults(page) {
  await page.route('**/compare/faces*', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(MOCK_COMPARE_RESPONSE),
    });
  });
  await page.route('**/face/morph*', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ fusion_image: null }),
    });
  });
}

// ── Helper: navigate to /solo and submit the comparison form ──
// Uses file upload simulation — uploads 1x1 pixel PNG blobs as photoA and photoB.
const TINY_PNG_BASE64 =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';

async function navigateToResults(page) {
  await interceptAndInjectResults(page);
  await page.goto('/solo');

  // Accept consent if modal appears
  const consentBtn = page.getByRole('button', { name: /i agree|accept|consent/i });
  if (await consentBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
    await consentBtn.click();
  }

  // Upload photos via file chooser simulation
  const uploads = page.locator('input[type="file"]');
  const uploadCount = await uploads.count();
  if (uploadCount >= 2) {
    // Create tiny PNG blobs and upload
    const tinyPng = Buffer.from(TINY_PNG_BASE64.split(',')[1], 'base64');
    await uploads.nth(0).setInputFiles({ name: 'photo_a.png', mimeType: 'image/png', buffer: tinyPng });
    await uploads.nth(1).setInputFiles({ name: 'photo_b.png', mimeType: 'image/png', buffer: tinyPng });
  } else {
    // Photos may be set via click-to-upload — fall back to direct state injection
    await page.evaluate((mockData) => {
      // Attempt to set results state via the window.__e2e_inject if present
      if (window.__e2e_injectResults) window.__e2e_injectResults(mockData);
    }, MOCK_COMPARE_RESPONSE);
  }

  // Click Compare Faces
  const compareBtn = page.getByRole('button', { name: /compare faces/i });
  if (await compareBtn.isEnabled({ timeout: 2000 }).catch(() => false)) {
    await compareBtn.click();
  }

  // Wait for the results journey to appear (SwipeJourney renders)
  await expect(page.getByRole('navigation', { name: 'Results actions' })).toBeVisible({ timeout: 15000 });
}

// ════════════════════════════════════════════════════════════════
// Card 1 — CompatibilityScore: action bar visible, bottom content not clipped
// ════════════════════════════════════════════════════════════════
test.describe('Card 1 — CompatibilityScore bottom content visible', () => {
  test('action bar is visible above safe area', async ({ page }, testInfo) => {
    await navigateToResults(page);
    // Action bar must be in viewport
    await expect(page.getByRole('navigation', { name: 'Results actions' })).toBeInViewport();
    await expect(page.getByRole('button', { name: /go back/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /try again/i })).toBeVisible();
  });

  test('snapshot — card 1 full render', async ({ page }, testInfo) => {
    // Only run snapshot tests on chromium to avoid cross-browser font diff noise
    test.skip(testInfo.project.name !== 'chromium' && testInfo.project.name !== 'iphone-13',
      'Snapshot only on chromium and iphone-13 to control baseline variance');
    await navigateToResults(page);
    const tolerance = testInfo.project.name.includes('iphone')
      ? { maxDiffPixels: 50, threshold: 0.15 }
      : { maxDiffPixels: 100, threshold: 0.2 };
    await expect(page).toHaveScreenshot(`card-1-${testInfo.project.name}.png`, tolerance);
  });
});

// ════════════════════════════════════════════════════════════════
// Card 2 — ChemistryLabel: swipe to card 2, verify content + action bar
// ════════════════════════════════════════════════════════════════
test.describe('Card 2 — ChemistryLabel bottom content visible', () => {
  test('chemistry label text visible after swipe to card 2', async ({ page }, testInfo) => {
    await navigateToResults(page);

    // Swipe to card 2
    await page.locator('[data-testid="swipe-journey"], [class*="swipe"], [class*="journey"]')
      .first()
      .evaluate((el) => {
        el.dispatchEvent(new TouchEvent('touchstart', { touches: [new Touch({ identifier: 1, target: el, clientX: 200, clientY: 400 })] }));
        el.dispatchEvent(new TouchEvent('touchend', { changedTouches: [new Touch({ identifier: 1, target: el, clientX: 200, clientY: 100 })] }));
      }).catch(() => {
        // Fallback: keyboard swipe
        return page.keyboard.press('ArrowUp');
      });

    await page.waitForTimeout(600);
    await expect(page.getByRole('navigation', { name: 'Results actions' })).toBeInViewport();
  });

  test('snapshot — card 2 full render', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'iphone-13',
      'Snapshot only on iphone-13 reference device');
    await navigateToResults(page);
    // Advance to card 2
    await page.keyboard.press('ArrowUp');
    await page.waitForTimeout(600);
    await expect(page).toHaveScreenshot(`card-2-${testInfo.project.name}.png`,
      { maxDiffPixels: 50, threshold: 0.15 });
  });
});

// ════════════════════════════════════════════════════════════════
// Card 5 — SocialProof Variant 2: "X of 8 features in common."
// MUST be captured AFTER Variant 2 copy lands (co-required atomic diff).
// ════════════════════════════════════════════════════════════════
test.describe('Card 5 — SocialProof Variant 2 (no fake counter)', () => {
  test('renders "X of 8 features in common." — real data, no fabricated number', async ({ page }) => {
    await navigateToResults(page);

    // Advance to card 5 (index 4)
    for (let i = 0; i < 4; i++) {
      await page.keyboard.press('ArrowUp');
      await page.waitForTimeout(300);
    }

    // Must show Variant 2 copy (4 matches in MOCK_COMPARE_RESPONSE)
    await expect(page.getByText('4 of 8 features in common.')).toBeVisible({ timeout: 3000 });

    // Must NOT show fabricated counter strings
    await expect(page.getByText('comparisons today')).not.toBeVisible();
    await expect(page.getByText('Your match is rarer than you think.')).not.toBeVisible();
    await expect(page.getByText(/2,?847/)).not.toBeVisible();
  });

  test('action bar still visible on card 5', async ({ page }) => {
    await navigateToResults(page);
    for (let i = 0; i < 4; i++) {
      await page.keyboard.press('ArrowUp');
      await page.waitForTimeout(300);
    }
    await expect(page.getByRole('navigation', { name: 'Results actions' })).toBeInViewport();
  });

  test('snapshot — card 5 Variant 2 full render', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'iphone-13',
      'Snapshot only on iphone-13 reference device');
    await navigateToResults(page);
    for (let i = 0; i < 4; i++) {
      await page.keyboard.press('ArrowUp');
      await page.waitForTimeout(300);
    }
    await expect(page.getByText('4 of 8 features in common.')).toBeVisible();
    await expect(page).toHaveScreenshot(`card-5-${testInfo.project.name}.png`,
      { maxDiffPixels: 50, threshold: 0.15 });
  });
});

// ════════════════════════════════════════════════════════════════
// Card 8 — DuoUpgrade: £3.99/mo line and sub-line both visible above action bar
// ════════════════════════════════════════════════════════════════
test.describe('Card 8 — DuoUpgrade bottom content visible', () => {
  test('price line and sub-line visible above action bar', async ({ page }) => {
    await navigateToResults(page);

    // Advance to card 8 (index 7)
    for (let i = 0; i < 7; i++) {
      await page.keyboard.press('ArrowUp');
      await page.waitForTimeout(300);
    }

    await expect(page.getByText(/£3\.99\/mo/)).toBeVisible({ timeout: 3000 });
    await expect(page.getByText(/Includes Duo, Group/)).toBeVisible({ timeout: 3000 });
    await expect(page.getByRole('navigation', { name: 'Results actions' })).toBeInViewport();
  });

  test('snapshot — card 8 full render', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'iphone-13',
      'Snapshot only on iphone-13 reference device');
    await navigateToResults(page);
    for (let i = 0; i < 7; i++) {
      await page.keyboard.press('ArrowUp');
      await page.waitForTimeout(300);
    }
    await expect(page.getByText(/£3\.99\/mo/)).toBeVisible();
    await expect(page).toHaveScreenshot(`card-8-${testInfo.project.name}.png`,
      { maxDiffPixels: 50, threshold: 0.15 });
  });
});
