import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright E2E Test Configuration for Tissaia-AI
 * Photo Restoration Dashboard
 * @see https://playwright.dev/docs/test-configuration
 */
export default defineConfig({
  testDir: './e2e',

  /* Run tests in files in parallel */
  fullyParallel: true,

  /* Fail the build on CI if you accidentally left test.only in the source code */
  forbidOnly: !!process.env.CI,

  /* Retry on CI only */
  retries: process.env.CI ? 2 : 1,

  /* Parallel workers configuration */
  workers: process.env.CI ? 1 : '50%',

  /* Global timeout for each test */
  timeout: 30000,

  /* Expect timeout for assertions */
  expect: {
    timeout: 10000,
    toHaveScreenshot: {
      maxDiffPixelRatio: 0.05,
    },
  },

  /* Reporter configuration */
  reporter: process.env.CI
    ? [
        ['html', { outputFolder: 'playwright-report', open: 'never' }],
        ['junit', { outputFile: 'test-results/junit.xml' }],
        ['github'],
      ]
    : [
        ['html', { outputFolder: 'playwright-report', open: 'on-failure' }],
        ['list'],
      ],

  /* Output folders */
  outputDir: 'test-results',

  /* Shared settings for all the projects below */
  use: {
    /* Base URL to use in actions like `await page.goto('/')` */
    baseURL: 'http://127.0.0.1:5175',

    /* Collect trace when retrying the failed test */
    trace: 'on-first-retry',

    /* Take screenshot on failure */
    screenshot: 'only-on-failure',

    /* Record video on failure */
    video: 'on-first-retry',

    /* Viewport size */
    viewport: { width: 1280, height: 720 },

    /* Ignore HTTPS errors */
    ignoreHTTPSErrors: true,

    /* Locale and timezone for consistent tests */
    locale: 'pl-PL',
    timezoneId: 'Europe/Warsaw',

    /* Action timeout */
    actionTimeout: 15000,

    /* Navigation timeout */
    navigationTimeout: 30000,
  },

  /* Configure projects for major browsers */
  projects: [
    /* Desktop browsers */
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        launchOptions: {
          args: ['--disable-web-security', '--disable-features=VizDisplayCompositor'],
        },
      },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },

    /* Mobile browsers */
    {
      name: 'mobile-chrome',
      use: { ...devices['Pixel 5'] },
    },
    {
      name: 'mobile-safari',
      use: { ...devices['iPhone 13'] },
    },

    /* Tablet */
    {
      name: 'tablet',
      use: { ...devices['iPad Pro 11'] },
    },
  ],

  /* Run your local dev server before starting the tests */
  webServer: {
    command: 'pnpm dev --host',
    url: 'http://127.0.0.1:5175',
    reuseExistingServer: true,
    timeout: 180000,
    stdout: 'pipe',
    stderr: 'pipe',
  },
});
