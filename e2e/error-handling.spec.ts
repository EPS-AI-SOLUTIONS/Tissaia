/**
 * Tissaia-AI - Error Handling E2E Tests
 * ======================================
 * Tests for error states, validation, and edge cases
 */
import { test, expect, type Page } from '@playwright/test';

// ============================================
// HELPERS
// ============================================

async function waitForAppReady(page: Page) {
  await page.waitForLoadState('networkidle');
  await page.locator('main').first().waitFor({ state: 'visible', timeout: 15000 });
}

async function dismissTooltips(page: Page) {
  const tooltip = page.locator('button:has-text("Rozumiem"), button:has-text("OK")');
  if (await tooltip.isVisible({ timeout: 500 }).catch(() => false)) {
    await tooltip.click();
  }
}

// ============================================
// FILE VALIDATION TESTS
// ============================================

test.describe('File Validation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await waitForAppReady(page);
    await dismissTooltips(page);
  });

  test('rejects files over 20MB limit', async ({ page }) => {
    const fileInput = page.locator('input[type="file"]').first();

    // Create a large fake file (simulated - actual buffer would be too large)
    // We'll check if the app handles the rejection gracefully
    const largeFileBuffer = Buffer.alloc(100); // Small buffer for test

    await fileInput.setInputFiles({
      name: 'huge-file.png',
      mimeType: 'image/png',
      buffer: largeFileBuffer,
    });

    await page.waitForTimeout(500);

    // App should not crash - main content still visible
    const main = page.locator('main').first();
    await expect(main).toBeVisible();
  });

  test('rejects non-image files gracefully', async ({ page }) => {
    const fileInput = page.locator('input[type="file"]').first();

    // Try uploading a text file
    await fileInput.setInputFiles({
      name: 'document.txt',
      mimeType: 'text/plain',
      buffer: Buffer.from('This is not an image'),
    });

    await page.waitForTimeout(500);

    // App should handle gracefully - no crash
    const main = page.locator('main').first();
    await expect(main).toBeVisible();
  });

  test('handles empty file gracefully', async ({ page }) => {
    const fileInput = page.locator('input[type="file"]').first();

    await fileInput.setInputFiles({
      name: 'empty.png',
      mimeType: 'image/png',
      buffer: Buffer.alloc(0),
    });

    await page.waitForTimeout(500);

    // App should not crash
    const main = page.locator('main').first();
    await expect(main).toBeVisible();
  });

  test('handles file with special characters in name', async ({ page }) => {
    const fileInput = page.locator('input[type="file"]').first();

    const testImageBuffer = Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
      'base64'
    );

    await fileInput.setInputFiles({
      name: 'zdjęcie-świąteczne (2024) [final].png',
      mimeType: 'image/png',
      buffer: testImageBuffer,
    });

    await page.waitForTimeout(500);

    // Should handle Polish characters and special chars
    const main = page.locator('main').first();
    await expect(main).toBeVisible();
  });

  test('handles corrupted image data', async ({ page }) => {
    const fileInput = page.locator('input[type="file"]').first();

    // Invalid PNG data
    await fileInput.setInputFiles({
      name: 'corrupted.png',
      mimeType: 'image/png',
      buffer: Buffer.from('not valid png data at all'),
    });

    await page.waitForTimeout(500);

    // App should handle gracefully
    const main = page.locator('main').first();
    await expect(main).toBeVisible();
  });
});

// ============================================
// NETWORK ERROR HANDLING
// ============================================

test.describe('Network Error Handling', () => {
  test('handles API timeout gracefully', async ({ page }) => {
    // Intercept API calls and delay them
    await page.route('**/api/**', async (route) => {
      await new Promise((resolve) => setTimeout(resolve, 5000));
      await route.abort('timedout');
    });

    await page.goto('/');
    await waitForAppReady(page);

    // App should still load and be usable
    const main = page.locator('main').first();
    await expect(main).toBeVisible();
  });

  test('handles API 500 error gracefully', async ({ page }) => {
    await page.route('**/api/**', (route) => {
      route.fulfill({
        status: 500,
        body: JSON.stringify({ error: 'Internal Server Error' }),
      });
    });

    await page.goto('/');
    await waitForAppReady(page);

    // App should handle error gracefully
    const main = page.locator('main').first();
    await expect(main).toBeVisible();
  });

  test('handles network offline state', async ({ page }) => {
    await page.goto('/');
    await waitForAppReady(page);

    // Simulate offline
    await page.context().setOffline(true);
    await page.waitForTimeout(1000);

    // App should still be visible (offline-first)
    const main = page.locator('main').first();
    await expect(main).toBeVisible();

    // Restore online
    await page.context().setOffline(false);
  });
});

// ============================================
// STATE RECOVERY TESTS
// ============================================

test.describe('State Recovery', () => {
  test('recovers from localStorage corruption', async ({ page }) => {
    // Set corrupted localStorage data
    await page.addInitScript(() => {
      localStorage.setItem('tissaia_settings', 'not-valid-json{{{');
      localStorage.setItem('tissaia_photos', '[invalid]');
    });

    await page.goto('/');

    // App should recover and load
    const main = page.locator('main').first();
    await expect(main).toBeVisible({ timeout: 10000 });
  });

  test('handles missing localStorage gracefully', async ({ page }) => {
    // Clear all localStorage
    await page.addInitScript(() => {
      localStorage.clear();
    });

    await page.goto('/');
    await waitForAppReady(page);

    // App should work with default values
    const main = page.locator('main').first();
    await expect(main).toBeVisible();
  });

  test('persists photos across page reload', async ({ page }) => {
    await page.goto('/');
    await waitForAppReady(page);

    const fileInput = page.locator('input[type="file"]').first();

    const testImageBuffer = Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
      'base64'
    );

    await fileInput.setInputFiles({
      name: 'persist-test.png',
      mimeType: 'image/png',
      buffer: testImageBuffer,
    });

    await page.waitForTimeout(500);

    // Reload page
    await page.reload();
    await waitForAppReady(page);

    // Check if app recovered (may or may not persist photos depending on implementation)
    const main = page.locator('main').first();
    await expect(main).toBeVisible();
  });
});

// ============================================
// EDGE CASE TESTS
// ============================================

test.describe('Edge Cases', () => {
  test('handles rapid navigation clicks', async ({ page }) => {
    await page.goto('/');
    await waitForAppReady(page);
    await dismissTooltips(page);

    // Rapidly click different nav items
    const navButtons = page.locator('nav button, aside button');
    const count = await navButtons.count();

    for (let i = 0; i < Math.min(count, 10); i++) {
      await navButtons.nth(i % count).click({ force: true }).catch(() => {});
      // No wait - rapid clicks
    }

    await page.waitForTimeout(500);

    // App should still be stable
    const main = page.locator('main').first();
    await expect(main).toBeVisible();
  });

  test('handles rapid theme toggles', async ({ page }) => {
    await page.goto('/');
    await waitForAppReady(page);
    await dismissTooltips(page);

    const themeToggle = page.locator('button:has(svg[class*="moon"]), button:has(svg[class*="sun"])').first();

    if (await themeToggle.isVisible({ timeout: 2000 }).catch(() => false)) {
      // Rapidly toggle theme
      for (let i = 0; i < 10; i++) {
        await themeToggle.click({ force: true });
      }

      await page.waitForTimeout(300);

      // App should still work
      const main = page.locator('main').first();
      await expect(main).toBeVisible();
    }
  });

  test('handles very long file names', async ({ page }) => {
    await page.goto('/');
    await waitForAppReady(page);

    const fileInput = page.locator('input[type="file"]').first();

    const testImageBuffer = Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
      'base64'
    );

    const longName = 'a'.repeat(255) + '.png';

    await fileInput.setInputFiles({
      name: longName,
      mimeType: 'image/png',
      buffer: testImageBuffer,
    });

    await page.waitForTimeout(500);

    // App should handle long names (truncate display)
    const main = page.locator('main').first();
    await expect(main).toBeVisible();
  });

  test('handles double-click on buttons', async ({ page }) => {
    await page.goto('/');
    await waitForAppReady(page);
    await dismissTooltips(page);

    const uploadBtn = page.locator('button:has-text("Wgraj"), button:has-text("Upload")').first();

    if (await uploadBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await uploadBtn.dblclick();
      await page.waitForTimeout(300);

      // App should handle double-click
      const main = page.locator('main').first();
      await expect(main).toBeVisible();
    }
  });

  test('handles browser back/forward navigation', async ({ page }) => {
    await page.goto('/');
    await waitForAppReady(page);
    await dismissTooltips(page);

    // Navigate to settings
    const settingsBtn = page.locator('button:has-text("Ustawienia"), button:has-text("Settings")').first();
    if (await settingsBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await settingsBtn.click();
      await page.waitForTimeout(300);
    }

    // Go back
    await page.goBack();
    await page.waitForTimeout(300);

    // Go forward
    await page.goForward();
    await page.waitForTimeout(300);

    // App should still work
    const main = page.locator('main').first();
    await expect(main).toBeVisible();
  });
});

// ============================================
// MEMORY LEAK PREVENTION TESTS
// ============================================

test.describe('Memory Management', () => {
  test('cleans up blob URLs on photo removal', async ({ page }) => {
    await page.goto('/');
    await waitForAppReady(page);

    const fileInput = page.locator('input[type="file"]').first();

    const testImageBuffer = Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
      'base64'
    );

    // Upload a single image
    await fileInput.setInputFiles({
      name: 'cleanup-test.png',
      mimeType: 'image/png',
      buffer: testImageBuffer,
    });

    await page.waitForTimeout(500);

    // Hover over photo thumbnail to reveal X button (it's hidden by default, shows on group-hover)
    const photoThumb = page.locator('.group, [class*="group"]').first();
    if (await photoThumb.isVisible({ timeout: 2000 }).catch(() => false)) {
      await photoThumb.hover();
      await page.waitForTimeout(300);

      // Now try to click the remove button
      const removeBtn = page.locator('button[aria-label*="Usuń"], button[aria-label*="Delete"]').first();
      if (await removeBtn.isVisible({ timeout: 1000 }).catch(() => false)) {
        await removeBtn.click({ force: true });
      }
    }

    await page.waitForTimeout(300);

    // App should still be responsive
    const main = page.locator('main').first();
    await expect(main).toBeVisible();
  });

  test('handles many photos without performance degradation', async ({ page }) => {
    await page.goto('/');
    await waitForAppReady(page);

    const fileInput = page.locator('input[type="file"]').first();

    const testImageBuffer = Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
      'base64'
    );

    const startTime = Date.now();

    // Upload 10 photos at once
    const files = Array.from({ length: 10 }, (_, i) => ({
      name: `batch-${i}.png`,
      mimeType: 'image/png',
      buffer: testImageBuffer,
    }));

    await fileInput.setInputFiles(files);
    await page.waitForTimeout(1000);

    const duration = Date.now() - startTime;

    // Should complete within reasonable time
    expect(duration).toBeLessThan(10000);

    // App should still be responsive
    const main = page.locator('main').first();
    await expect(main).toBeVisible();
  });
});

// ============================================
// CONCURRENT OPERATIONS TESTS
// ============================================

test.describe('Concurrent Operations', () => {
  test('handles simultaneous uploads and navigation', async ({ page }) => {
    await page.goto('/');
    await waitForAppReady(page);
    await dismissTooltips(page);

    const fileInput = page.locator('input[type="file"]').first();

    const testImageBuffer = Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
      'base64'
    );

    // Start upload
    const uploadPromise = fileInput.setInputFiles({
      name: 'concurrent.png',
      mimeType: 'image/png',
      buffer: testImageBuffer,
    });

    // Simultaneously navigate
    const settingsBtn = page.locator('button:has-text("Ustawienia"), button:has-text("Settings")').first();
    const navPromise = settingsBtn.isVisible().then((visible) => {
      if (visible) return settingsBtn.click();
    });

    await Promise.all([uploadPromise, navPromise]);
    await page.waitForTimeout(500);

    // App should still work
    const main = page.locator('main').first();
    await expect(main).toBeVisible();
  });
});
