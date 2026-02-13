import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    actionTimeout: 5_000,
    navigationTimeout: 15_000,
  },
  expect: {
    timeout: 5_000,
  },
  projects: [
    // Setup project - runs first to create auth state
    {
      name: 'setup',
      testMatch: /.*\.auth\/setup\.ts/,
    },
    // Public routes - no auth needed (login page tests)
    {
      name: 'chromium-public',
      testMatch: /auth\/login\.spec\.ts/,
      use: { ...devices['Desktop Chrome'] },
    },
    // Protected routes - requires auth
    {
      name: 'chromium',
      testMatch: /.*(?<!login)\.spec\.ts/,
      testIgnore: /.*\.auth\/setup\.ts/,
      dependencies: ['setup'],
      use: {
        ...devices['Desktop Chrome'],
        storageState: 'tests/e2e/.auth/user.json',
      },
    },
    {
      name: 'firefox',
      testMatch: /.*(?<!login)\.spec\.ts/,
      testIgnore: /.*\.auth\/setup\.ts/,
      dependencies: ['setup'],
      use: {
        ...devices['Desktop Firefox'],
        storageState: 'tests/e2e/.auth/user.json',
      },
    },
    {
      name: 'webkit',
      testMatch: /.*(?<!login)\.spec\.ts/,
      testIgnore: /.*\.auth\/setup\.ts/,
      dependencies: ['setup'],
      use: {
        ...devices['Desktop Safari'],
        storageState: 'tests/e2e/.auth/user.json',
      },
    },
  ],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000,
  },
});
