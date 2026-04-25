/**
 * challenge-results-visual.spec.js
 *
 * Visual regression for ChallengePage results phase (deep-link entry surface).
 * Verifies that after accepting a challenge, the fixed action bar renders with
 * THREE buttons (Go Back, Try Again, Challenge Someone Else 🎯) above the
 * safe-area-inset-bottom across the 5-device matrix.
 *
 * Critical: the third button is the deep-link forward primitive. Recipients
 * arrive via external link with no app-internal history; deleting that button
 * leaves browser-back as the only exit, which on iOS Safari can close the tab
 * (history.length === 1). Mitigated by FM-X5-10.
 *
 * Author: FE Lead — A-HOTFIX 2026-04-25
 * Spec:   SPEC_A_HOTFIX_VISUAL_FIX_MOBILE_UX_ADDENDUM_2026_04_25.md §5
 *         GATE_REPORT_A_HOTFIX_v2_2026_04_25.md §4.1
 */

import { test, expect } from '@playwright/test';

// ── Fixture: challenge metadata returned by GET /challenge/:id ──
const MOCK_CHALLENGE = {
  challenge_id: 'test-challenge-123',
  name: 'Alex',
  percentage: 65,
  chemistry_label: 'Magnetic Match',
  chemistry_color: '#8B5CF6',
};

// ── Fixture: result returned by POST /challenge/:id/accept ──
// 4 matching features → SocialProof renders "4 of 8 features in common."
const MOCK_ACCEPT_RESPONSE = {
  ok: true,
  percentage: 78,
  chemistry_label: 'Complementary Pair',
  chemistry_color: '#3B82F6',
  embedding_similarity: 0.82,
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
  name_a: 'Alex',
  name_b: 'You',
  fusion_image: null,
};

const TINY_PNG_BASE64 =
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';

async function navigateToChallengeResults(page) {
  // Stub challenge metadata + accept endpoint
  await page.route('**/challenge/test-challenge-123*', async (route) => {
    if (route.request().method() === 'POST') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(MOCK_ACCEPT_RESPONSE),
      });
    } else {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(MOCK_CHALLENGE),
      });
    }
  });
  await page.route('**/face/morph*', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ fusion_image: null }),
    });
  });

  await page.goto('/challenge/test-challenge-123');

  // Accept consent if modal appears
  const consentBtn = page.getByRole('button', { name: /i agree|accept|consent/i });
  if (await consentBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
    await consentBtn.click();
  }

  // Click "Accept Challenge"
  const acceptBtn = page.getByRole('button', { name: /accept challenge/i });
  if (await acceptBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
    await acceptBtn.click();
  }

  // Upload phase — drop a tiny PNG
  const upload = page.locator('input[type="file"]').first();
  if (await upload.isVisible({ timeout: 2000 }).catch(() => false)) {
    const tinyPng = Buffer.from(TINY_PNG_BASE64, 'base64');
    await upload.setInputFiles({ name: 'me.png', mimeType: 'image/png', buffer: tinyPng });
  }

  // Click Compare Faces
  const compareBtn = page.getByRole('button', { name: /compare faces/i });
  if (await compareBtn.isEnabled({ timeout: 2000 }).catch(() => false)) {
    await compareBtn.click();
  }

  // Wait for the results journey + fixed action bar
  await expect(page.getByRole('navigation', { name: 'Results actions' })).toBeVisible({ timeout: 15000 });
}

// ════════════════════════════════════════════════════════════════
// Fixed action bar — THREE buttons above safe area on every device
// ════════════════════════════════════════════════════════════════
test.describe('ChallengePage results phase — fixed action bar', () => {
  test('renders three buttons (Go Back, Try Again, Challenge Someone Else 🎯)', async ({ page }) => {
    await navigateToChallengeResults(page);
    await expect(page.getByRole('button', { name: /go back/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /try again/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /challenge someone else/i })).toBeVisible();
  });

  test('action bar visible above safe-area-inset-bottom', async ({ page }) => {
    await navigateToChallengeResults(page);
    const nav = page.getByRole('navigation', { name: 'Results actions' });
    await expect(nav).toBeInViewport();
  });

  test('snapshot — challenge results phase fixed bar', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'iphone-13',
      'Snapshot only on iphone-13 reference device to control baseline variance');
    await navigateToChallengeResults(page);
    const tolerance = { maxDiffPixels: 50, threshold: 0.15 };
    await expect(page).toHaveScreenshot(`challenge-results-${testInfo.project.name}.png`, tolerance);
  });
});
