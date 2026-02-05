import { test, expect } from '@playwright/test';
import path from 'path';

test('debug upload with user photo', async ({ page }) => {
  const photoPath = 'C:/Users/BIURODOM/Desktop/Tissaia/test-photos/1.png';
  
  console.log('Navigating to app...');
  await page.goto('/');
  
  // Wait for app to be ready
  await page.locator('main').waitFor({ state: 'visible', timeout: 30000 });
  
  // Dismiss any tooltips
  const tooltip = page.locator('button:has-text("Rozumiem"), button:has-text("OK")');
  if (await tooltip.isVisible().catch(() => false)) {
    await tooltip.click();
  }

  // Ensure we are on upload view
  const uploadBtn = page.locator('button:has-text("Wgraj"), button:has-text("Upload")');
  if (await uploadBtn.isVisible()) {
    await uploadBtn.click();
  }

  console.log('Uploading photo:', photoPath);
  const fileInput = page.locator('input[type="file"]').first();
  await fileInput.setInputFiles(photoPath);

  // Wait for result
  console.log('Waiting for preview...');
  const preview = page.locator('img[src*="blob:"], [data-testid="photo-preview"]').first();
  await expect(preview).toBeVisible({ timeout: 10000 });
  
  console.log('Upload successful! Pausing for 5 seconds for visual inspection...');
  await page.waitForTimeout(5000);
});
