import { test, expect } from '@playwright/test';

test('verify settings and ollama integration', async ({ page }) => {
  console.log('Navigating to app...');
  await page.goto('/');
  
  // Wait for app to be ready
  await page.locator('main').waitFor({ state: 'visible', timeout: 30000 });
  
  // Dismiss tooltips
  const tooltip = page.locator('button:has-text("Rozumiem"), button:has-text("OK")');
  if (await tooltip.isVisible().catch(() => false)) {
    await tooltip.click();
  }

  // Navigate to Settings
  console.log('Navigating to Settings...');
  const settingsBtn = page.locator('button:has-text("Ustawienia"), button:has-text("Settings")');
  await settingsBtn.click();

  // Check for Settings Title
  await expect(page.locator('h2:has-text("Ustawienia"), h2:has-text("Settings")')).toBeVisible();

  // Check for Ollama Section (New Feature)
  console.log('Checking for Ollama Local Models section...');
  await expect(page.locator('text=Ollama Local Models')).toBeVisible({ timeout: 5000 });
  
  // Check for text indicating connection status or model list
  // It might say "Brak dostępnych modeli", "Ładowanie...", "Błąd połączenia" OR show the loaded models
  const ollamaStatus = page.locator('text=Ładowanie modeli...')
    .or(page.locator('text=Brak dostępnych modeli'))
    .or(page.locator('text=Błąd połączenia'))
    .or(page.locator('text=llama3.2:vision'));
  
  await expect(ollamaStatus.first()).toBeVisible();

  console.log('Settings view verified successfully.');
});

