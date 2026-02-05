import { test, expect } from '@playwright/test';
import path from 'path';

test.describe('Full Workflow Test', () => {
  test('complete restoration workflow', async ({ page }) => {
    // Increase timeout for this long test
    test.setTimeout(120000); 

    const photoPath = 'C:/Users/BIURODOM/Desktop/Tissaia/test-photos/1.png';
    
    console.log('1. Launching App...');
    await page.goto('/');
    await page.locator('main').waitFor({ state: 'visible', timeout: 120000 });
    
    // Dismiss tooltips
    const tooltip = page.locator('button:has-text("Rozumiem"), button:has-text("OK")');
    if (await tooltip.isVisible().catch(() => false)) {
      await tooltip.click();
    }

    // ----------------------------------------------------------------
    // UPLOAD STAGE
    // ----------------------------------------------------------------
    console.log('2. Upload Stage...');
    
    // Go to upload view if not there
    const uploadNav = page.locator('button:has-text("Wgraj"), button:has-text("Upload")');
    await uploadNav.click();

    // Upload file
    const fileInput = page.locator('input[type="file"]').first();
    await fileInput.setInputFiles(photoPath);

    // Verify upload success (thumbnail visible)
    const thumbnail = page.locator('img[src*="blob:"], [data-testid="photo-thumbnail"]').first();
    await expect(thumbnail).toBeVisible({ timeout: 10000 });
    console.log('   Upload successful.');

    // ----------------------------------------------------------------
    // ANALYZE STAGE
    // ----------------------------------------------------------------
    console.log('3. Analyze Stage...');
    
    // Navigate to Analyze view first (if not already there)
    const analyzeNav = page.locator('nav button:has-text("Analiza"), nav button:has-text("Analyze")').first();
    if (await analyzeNav.isVisible()) {
        await analyzeNav.click();
    }

    console.log('   Starting analysis process...');
    // Click the actual "Start Analysis" button in the main view
    const startAnalyzeBtn = page.locator('main button:has-text("Rozpocznij analizę"), main button:has-text("Start Analysis"), main button:has-text("Analizuj")').first();
    
    // Retry clicking if needed
    await startAnalyzeBtn.waitFor({ state: 'visible', timeout: 10000 });
    
    let isAnalyzing = false;
    for (let i = 0; i < 3; i++) {
        if (await startAnalyzeBtn.isVisible()) {
            await startAnalyzeBtn.click({ force: true });
            await page.waitForTimeout(1000);
            
            // Check if analysis started (button disappeared or progress bar appeared)
            if (!(await startAnalyzeBtn.isVisible()) || (await page.locator('.progress-bar').isVisible())) {
                isAnalyzing = true;
                break;
            }
        }
    }

    if (!isAnalyzing && await startAnalyzeBtn.isVisible()) {
        console.log('   Warning: Start button still visible, analysis might not have started.');
    } else {
        console.log('   Analysis started...');
    }

    // Wait for analysis to complete (loading indicator to disappear)
    // It might take time depending on AI response
    await page.waitForTimeout(2000); // Give it a moment to start
    const progressBar = page.locator('.progress-bar, [role="progressbar"]');
    
    // Wait for results to appear (Analysis View shows results)
    // Look for indicators of success: Damage score, "Wykryte uszkodzenia", or "Ocena uszkodzeń"
    const resultsIndicator = page.locator('text=Ocena uszkodzeń')
        .or(page.locator('text=Wykryte uszkodzenia'))
        .or(page.locator('text=Damage score'))
        .or(page.locator('text=45%')); // From mock data
        
    await expect(resultsIndicator.first()).toBeVisible({ timeout: 60000 });
    console.log('   Analysis complete.');

    // ----------------------------------------------------------------
    // RESTORE STAGE
    // ----------------------------------------------------------------
    console.log('4. Restore Stage...');

    // Navigate to Restore (or click 'Go to Restore' button if available)
    const goToRestoreBtn = page.locator('button:has-text("Przejdź do restauracji"), button:has-text("Go to Restore")');
    if (await goToRestoreBtn.isVisible()) {
        await goToRestoreBtn.click();
    } else {
        const restoreNav = page.locator('button:has-text("Restauracja"), button:has-text("Restore")');
        await restoreNav.click();
    }

    // Start Restoration
    const startRestoreBtn = page.locator('button:has-text("Rozpocznij"), button:has-text("Start Restoration")');
    
    // Retry clicking restore if needed
    await startRestoreBtn.waitFor({ state: 'visible', timeout: 10000 });
    let isRestoring = false;
    for (let i = 0; i < 3; i++) {
        if (await startRestoreBtn.isVisible()) {
            await startRestoreBtn.click({ force: true });
            await page.waitForTimeout(1000);
            if (!(await startRestoreBtn.isVisible()) || (await page.locator('.progress-bar').isVisible())) {
                isRestoring = true;
                break;
            }
        }
    }

    // Wait for completion (Results view)
    // Update locator to match actual UI text "Wynik restauracji"
    const successHeader = page.locator('h2:has-text("Wynik restauracji"), h2:has-text("Restoration Result"), h2:has-text("Wyniki")');
    await expect(successHeader).toBeVisible({ timeout: 60000 });
    console.log('   Restoration complete.');

    // ----------------------------------------------------------------
    // VERIFICATION
    // ----------------------------------------------------------------
    console.log('5. Verification...');
    
    // Check if result image is displayed
    const resultImage = page.locator('img[alt="Restored"]');
    await expect(resultImage).toBeVisible();

    // Check if download button exists
    const downloadBtn = page.locator('button:has-text("Pobierz"), button:has-text("Download")');
    await expect(downloadBtn).toBeVisible();

    console.log('Full workflow test passed!');
  });
});






