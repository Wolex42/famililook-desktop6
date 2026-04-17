// e2e/solo-flow.spec.js
// FamiliMatch Solo comparison flow — end-to-end tests

import { test, expect } from '@playwright/test';

test.describe('Landing Page', () => {
  test('renders hero and mode cards', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByText('How Alike Are You,')).toBeVisible();
    await expect(page.getByText('Really?')).toBeVisible();
    await expect(page.getByText('Compare Now — Free')).toBeVisible();
  });

  test('shows three mode cards (Solo, Duo, Group)', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByText('Solo')).toBeVisible();
    await expect(page.getByText('Duo')).toBeVisible();
    await expect(page.getByText('Group')).toBeVisible();
  });

  test('Duo and Group show Plus lock badge', async ({ page }) => {
    await page.goto('/');
    // Both locked cards should show "Plus" badge text
    const plusBadges = page.getByText('Plus', { exact: true });
    await expect(plusBadges).toHaveCount(2);
  });

  test('clicking locked mode shows upgrade modal', async ({ page }) => {
    await page.goto('/');
    await page.getByText('Duo').click();
    await expect(page.getByText('Unlock Duo Mode')).toBeVisible();
    await expect(page.getByText('Upgrade to Plus')).toBeVisible();
    // Dismiss
    await page.getByText('Maybe later').click();
    await expect(page.getByText('Unlock Duo Mode')).not.toBeVisible();
  });

  test('privacy and terms links exist', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByText('Privacy')).toBeVisible();
    await expect(page.getByText('Terms')).toBeVisible();
  });
});

test.describe('Solo Page — Navigation', () => {
  test('CTA shows consent gate before solo navigation', async ({ page }) => {
    await page.goto('/');
    await page.getByText('Compare Now — Free').click();
    // Should show consent modal (biometric consent required before navigation)
    await expect(page.getByText('I Agree')).toBeVisible({ timeout: 3000 });
  });

  test('solo page shows upload UI', async ({ page }) => {
    await page.goto('/solo');
    await expect(page.getByText('Compare Faces')).toBeVisible();
  });

  test('compare button disabled without photos', async ({ page }) => {
    await page.goto('/solo');
    const btn = page.getByText('Compare Faces');
    await expect(btn).toBeVisible();
    await expect(btn).toBeDisabled();
  });

  test('back button navigates to landing', async ({ page }) => {
    await page.goto('/solo');
    // Dismiss onboarding overlay — requires entering a name then clicking Continue
    const nameInput = page.getByPlaceholder('Enter your name');
    await nameInput.waitFor({ state: 'visible', timeout: 3000 }).catch(() => {});
    if (await nameInput.isVisible()) {
      await nameInput.click();
      await nameInput.fill('Test User');
      await page.getByText('Continue').click();
      // Wait for the overlay to animate out
      await page.locator('.fixed.inset-0.z-50').waitFor({ state: 'hidden', timeout: 3000 }).catch(() => {});
    }
    await page.getByText('Back').click();
    await expect(page).toHaveURL('/');
  });
});

test.describe('Solo Page — Privacy', () => {
  test('shows privacy note on upload screen', async ({ page }) => {
    await page.goto('/solo');
    await expect(page.getByText(/never stored/i)).toBeVisible();
  });
});

test.describe('Navigation — Direct URLs', () => {
  test('/solo loads solo page directly', async ({ page }) => {
    await page.goto('/solo');
    await expect(page.getByText('Compare Faces')).toBeVisible();
  });

  test('/privacy loads privacy page', async ({ page }) => {
    await page.goto('/privacy');
    await expect(page.getByRole('heading', { name: 'Privacy Policy' })).toBeVisible();
  });

  test('/terms loads terms page', async ({ page }) => {
    await page.goto('/terms');
    await expect(page.getByRole('heading', { name: 'Terms of Service' })).toBeVisible();
  });

  test('unknown route shows content', async ({ page }) => {
    await page.goto('/nonexistent');
    // App should render something — lazy loading may show the fallback or a route
    await page.waitForLoadState('networkidle');
    const content = await page.locator('body').textContent();
    expect(content.length).toBeGreaterThan(0);
  });
});
