import { test as setup, expect } from '@playwright/test';

/**
 * Auth setup - runs once before all tests to create authenticated state
 * This stores cookies/localStorage in .auth/user.json for reuse
 */
setup('authenticate', async ({ page }) => {
  // Mock the login API for testing
  await page.route('**/api/v1/auth/login', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        success: true,
        data: {
          token: 'mock-jwt-token-for-e2e-tests',
          user: {
            _id: 'user-123',
            email: 'test@example.com',
            profile: { firstName: 'Test', lastName: 'User' },
            roles: ['user', 'admin'],
            organizations: ['org-1']
          }
        }
      }),
    });
  });

  // Mock auth verification for subsequent requests
  await page.route('**/api/v1/auth/me', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        success: true,
        data: {
          user: {
            _id: 'user-123',
            email: 'test@example.com',
            profile: { firstName: 'Test', lastName: 'User' },
            roles: ['user', 'admin'],
            organizations: ['org-1']
          }
        }
      }),
    });
  });

  // Go to login page
  await page.goto('/login', { waitUntil: 'domcontentloaded' });

  // Fill login form
  await page.getByTestId('email-input').fill('test@example.com');
  await page.getByTestId('password-input').fill('password123');

  // Submit and wait for redirect
  await Promise.all([
    page.waitForURL(/\/dashboard/, { timeout: 10000 }),
    page.getByTestId('login-submit-btn').click(),
  ]);

  // Verify we're logged in
  await expect(page.getByTestId('dashboard-page')).toBeVisible({ timeout: 5000 });

  // Save storage state (cookies + localStorage)
  await page.context().storageState({
    path: 'tests/e2e/.auth/user.json',
  });
});
