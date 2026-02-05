/**
 * Tissaia-AI - Visual Regression Tests
 * =====================================
 * Screenshot-based visual regression tests for UI consistency
 */
import { test, expect, type Page } from '@playwright/test';

// ============================================
// HELPERS
// ============================================

async function waitForAppReady(page: Page) {
  await page.waitForLoadState('networkidle');
  await page.locator('main').first().waitFor({ state: 'visible', timeout: 15000 });
  // Wait for animations to settle
  await page.waitForTimeout(500);
}

async function dismissTooltips(page: Page) {
  const tooltip = page.locator('button:has-text("Rozumiem"), button:has-text("OK")');
  if (await tooltip.isVisible({ timeout: 500 }).catch(() => false)) {
    await tooltip.click();
    await page.waitForTimeout(200);
  }
}

async function setDarkTheme(page: Page) {
  await page.evaluate(() => {
    document.documentElement.classList.remove('light');
    document.documentElement.classList.add('dark');
    localStorage.setItem('theme', 'dark');
  });
  await page.waitForTimeout(300);
}

async function setLightTheme(page: Page) {
  await page.evaluate(() => {
    document.documentElement.classList.remove('dark');
    document.documentElement.classList.add('light');
    localStorage.setItem('theme', 'light');
  });
  await page.waitForTimeout(300);
}

// ============================================
// MAIN VIEWS - DARK THEME
// ============================================

test.describe('Visual Regression - Dark Theme', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await waitForAppReady(page);
    await dismissTooltips(page);
    await setDarkTheme(page);
  });

  test('upload view - dark', async ({ page }) => {
    await page.locator('button:has-text("Wgraj"), button:has-text("Upload")').first().click().catch(() => {});
    await page.waitForTimeout(500);

    await expect(page).toHaveScreenshot('upload-view-dark.png', {
      maxDiffPixelRatio: 0.05,
      animations: 'disabled',
    });
  });

  test('settings view - dark', async ({ page }) => {
    const settingsBtn = page.locator('button:has-text("Ustawienia"), button:has-text("Settings")').first();
    if (await settingsBtn.isVisible().catch(() => false)) {
      await settingsBtn.click();
      await page.waitForTimeout(500);
    }

    await expect(page).toHaveScreenshot('settings-view-dark.png', {
      maxDiffPixelRatio: 0.05,
      animations: 'disabled',
    });
  });

  test('health view - dark', async ({ page }) => {
    const healthBtn = page.locator('button:has-text("Status"), button:has-text("Health")').first();
    if (await healthBtn.isVisible().catch(() => false)) {
      await healthBtn.click();
      await page.waitForTimeout(500);
    }

    await expect(page).toHaveScreenshot('health-view-dark.png', {
      maxDiffPixelRatio: 0.05,
      animations: 'disabled',
    });
  });

  test('history view - dark', async ({ page }) => {
    const historyBtn = page.locator('button:has-text("Historia"), button:has-text("History")').first();
    if (await historyBtn.isVisible().catch(() => false)) {
      await historyBtn.click();
      await page.waitForTimeout(500);
    }

    await expect(page).toHaveScreenshot('history-view-dark.png', {
      maxDiffPixelRatio: 0.05,
      animations: 'disabled',
    });
  });

  test('sidebar expanded - dark', async ({ page }) => {
    const sidebar = page.locator('nav, aside').first();

    await expect(sidebar).toHaveScreenshot('sidebar-expanded-dark.png', {
      maxDiffPixelRatio: 0.05,
      animations: 'disabled',
    });
  });

  test('sidebar collapsed - dark', async ({ page }) => {
    const collapseBtn = page.locator('button[title*="Collapse"]').first();
    if (await collapseBtn.isVisible().catch(() => false)) {
      await collapseBtn.click();
      await page.waitForTimeout(400);
    }

    const sidebar = page.locator('nav, aside').first();

    await expect(sidebar).toHaveScreenshot('sidebar-collapsed-dark.png', {
      maxDiffPixelRatio: 0.05,
      animations: 'disabled',
    });
  });
});

// ============================================
// MAIN VIEWS - LIGHT THEME
// ============================================

test.describe('Visual Regression - Light Theme', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await waitForAppReady(page);
    await dismissTooltips(page);
    await setLightTheme(page);
  });

  test('upload view - light', async ({ page }) => {
    await page.locator('button:has-text("Wgraj"), button:has-text("Upload")').first().click().catch(() => {});
    await page.waitForTimeout(500);

    await expect(page).toHaveScreenshot('upload-view-light.png', {
      maxDiffPixelRatio: 0.05,
      animations: 'disabled',
    });
  });

  test('settings view - light', async ({ page }) => {
    const settingsBtn = page.locator('button:has-text("Ustawienia"), button:has-text("Settings")').first();
    if (await settingsBtn.isVisible().catch(() => false)) {
      await settingsBtn.click();
      await page.waitForTimeout(500);
    }

    await expect(page).toHaveScreenshot('settings-view-light.png', {
      maxDiffPixelRatio: 0.05,
      animations: 'disabled',
    });
  });

  test('health view - light', async ({ page }) => {
    const healthBtn = page.locator('button:has-text("Status"), button:has-text("Health")').first();
    if (await healthBtn.isVisible().catch(() => false)) {
      await healthBtn.click();
      await page.waitForTimeout(500);
    }

    await expect(page).toHaveScreenshot('health-view-light.png', {
      maxDiffPixelRatio: 0.05,
      animations: 'disabled',
    });
  });

  test('sidebar expanded - light', async ({ page }) => {
    const sidebar = page.locator('nav, aside').first();

    await expect(sidebar).toHaveScreenshot('sidebar-expanded-light.png', {
      maxDiffPixelRatio: 0.05,
      animations: 'disabled',
    });
  });
});

// ============================================
// RESPONSIVE VISUAL TESTS
// ============================================

test.describe('Visual Regression - Responsive', () => {
  test('mobile view (375px)', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');
    await waitForAppReady(page);
    await dismissTooltips(page);

    await expect(page).toHaveScreenshot('mobile-view.png', {
      maxDiffPixelRatio: 0.05,
      animations: 'disabled',
    });
  });

  test('tablet view (768px)', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto('/');
    await waitForAppReady(page);
    await dismissTooltips(page);

    await expect(page).toHaveScreenshot('tablet-view.png', {
      maxDiffPixelRatio: 0.05,
      animations: 'disabled',
    });
  });

  test('desktop view (1280px)', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.goto('/');
    await waitForAppReady(page);
    await dismissTooltips(page);

    await expect(page).toHaveScreenshot('desktop-view.png', {
      maxDiffPixelRatio: 0.05,
      animations: 'disabled',
    });
  });

  test('wide view (1920px)', async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.goto('/');
    await waitForAppReady(page);
    await dismissTooltips(page);

    await expect(page).toHaveScreenshot('wide-view.png', {
      maxDiffPixelRatio: 0.05,
      animations: 'disabled',
    });
  });
});

// ============================================
// COMPONENT VISUAL TESTS
// ============================================

test.describe('Visual Regression - Components', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await waitForAppReady(page);
    await dismissTooltips(page);
  });

  test('header component', async ({ page }) => {
    const header = page.locator('header').first();
    if (await header.isVisible().catch(() => false)) {
      await expect(header).toHaveScreenshot('header-component.png', {
        maxDiffPixelRatio: 0.05,
        animations: 'disabled',
      });
    }
  });

  test('dropzone component', async ({ page }) => {
    const dropzone = page.locator('[class*="border-dashed"], [data-testid="dropzone"]').first();
    if (await dropzone.isVisible().catch(() => false)) {
      await expect(dropzone).toHaveScreenshot('dropzone-component.png', {
        maxDiffPixelRatio: 0.05,
        animations: 'disabled',
      });
    }
  });

  test('language dropdown', async ({ page }) => {
    const langBtn = page.locator('button:has(svg[class*="globe"])').first();

    if (await langBtn.isVisible().catch(() => false)) {
      await langBtn.click();
      await page.waitForTimeout(300);

      const dropdown = page.locator('[class*="dropdown"], [role="menu"]').first();
      if (await dropdown.isVisible().catch(() => false)) {
        await expect(dropdown).toHaveScreenshot('language-dropdown.png', {
          maxDiffPixelRatio: 0.05,
          animations: 'disabled',
        });
      }
    }
  });
});

// ============================================
// STATE VISUAL TESTS
// ============================================

test.describe('Visual Regression - States', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await waitForAppReady(page);
    await dismissTooltips(page);
  });

  test('upload view with photos', async ({ page }) => {
    const fileInput = page.locator('input[type="file"]').first();

    const testImageBuffer = Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
      'base64'
    );

    await fileInput.setInputFiles([
      { name: 'photo1.png', mimeType: 'image/png', buffer: testImageBuffer },
      { name: 'photo2.png', mimeType: 'image/png', buffer: testImageBuffer },
    ]);

    await page.waitForTimeout(500);

    await expect(page).toHaveScreenshot('upload-with-photos.png', {
      maxDiffPixelRatio: 0.05,
      animations: 'disabled',
    });
  });

  test('button hover states', async ({ page }) => {
    const btn = page.locator('button:has-text("Przeglądaj"), button:has-text("Browse")').first();

    if (await btn.isVisible().catch(() => false)) {
      await btn.hover();
      await page.waitForTimeout(200);

      await expect(btn).toHaveScreenshot('button-hover.png', {
        maxDiffPixelRatio: 0.1,
        animations: 'disabled',
      });
    }
  });

  test('nav item active state', async ({ page }) => {
    const activeNav = page.locator('button[class*="bg-matrix-accent"], [class*="text-matrix-accent"]').first();

    if (await activeNav.isVisible().catch(() => false)) {
      await expect(activeNav).toHaveScreenshot('nav-active.png', {
        maxDiffPixelRatio: 0.05,
        animations: 'disabled',
      });
    }
  });
});

// ============================================
// ACCESSIBILITY VISUAL TESTS
// ============================================

test.describe('Visual Regression - Accessibility', () => {
  test('focus states visible', async ({ page }) => {
    await page.goto('/');
    await waitForAppReady(page);
    await dismissTooltips(page);

    // Tab to focus first element
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    await page.waitForTimeout(200);

    // Take screenshot with focus ring visible
    await expect(page).toHaveScreenshot('focus-state.png', {
      maxDiffPixelRatio: 0.1,
      animations: 'disabled',
    });
  });

  test('high contrast mode', async ({ page }) => {
    await page.emulateMedia({ forcedColors: 'active' });
    await page.goto('/');
    await waitForAppReady(page);

    await expect(page).toHaveScreenshot('high-contrast.png', {
      maxDiffPixelRatio: 0.1,
      animations: 'disabled',
    });
  });

  test('reduced motion respects preference', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/');
    await waitForAppReady(page);

    // With reduced motion, animations should be disabled
    await expect(page).toHaveScreenshot('reduced-motion.png', {
      maxDiffPixelRatio: 0.05,
      animations: 'disabled',
    });
  });
});

// ============================================
// FULL PAGE SCREENSHOTS
// ============================================

test.describe('Visual Regression - Full Page', () => {
  test('full page - upload view', async ({ page }) => {
    await page.goto('/');
    await waitForAppReady(page);
    await dismissTooltips(page);

    await expect(page).toHaveScreenshot('full-page-upload.png', {
      fullPage: true,
      maxDiffPixelRatio: 0.05,
      animations: 'disabled',
    });
  });

  test('full page - settings view', async ({ page }) => {
    await page.goto('/');
    await waitForAppReady(page);
    await dismissTooltips(page);

    const settingsBtn = page.locator('button:has-text("Ustawienia"), button:has-text("Settings")').first();
    if (await settingsBtn.isVisible().catch(() => false)) {
      await settingsBtn.click();
      await page.waitForTimeout(500);
    }

    await expect(page).toHaveScreenshot('full-page-settings.png', {
      fullPage: true,
      maxDiffPixelRatio: 0.05,
      animations: 'disabled',
    });
  });
});
