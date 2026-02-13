import { test, expect } from '@playwright/test';

test.describe('Authentication', () => {
  test.describe('Login Page', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/login', { waitUntil: 'domcontentloaded' });
    });

    test('should display login form with all required elements', async ({ page }) => {
      await expect(page.getByTestId('login-form')).toBeVisible({ timeout: 3000 });
      await expect(page.getByTestId('email-input')).toBeVisible();
      await expect(page.getByTestId('password-input')).toBeVisible();
      await expect(page.getByTestId('login-submit-btn')).toBeVisible();
    });

    test('should show validation errors for empty form submission', async ({ page }) => {
      await page.getByTestId('login-submit-btn').click();
      // Use locator to find any visible error (more stable than exact testid)
      await expect(page.locator('[data-testid="email-error"], [role="alert"]').first()).toBeVisible({ timeout: 3000 });
    });

    test('should show error for invalid email format', async ({ page }) => {
      await page.getByTestId('email-input').fill('invalid-email');
      await page.getByTestId('email-input').blur();
      await page.getByTestId('password-input').fill('password123');
      await page.getByTestId('login-submit-btn').click();
      // Check for any validation error indicator
      await expect(page.locator('[data-testid="email-error"], [role="alert"]').first()).toBeVisible({ timeout: 3000 });
    });

    test('should show error for incorrect credentials', async ({ page }) => {
      await page.route('**/api/v1/auth/login', async (route) => {
        await route.fulfill({
          status: 401,
          contentType: 'application/json',
          body: JSON.stringify({ success: false, message: 'Invalid credentials' }),
        });
      });

      await page.getByTestId('email-input').fill('wrong@example.com');
      await page.getByTestId('password-input').fill('wrongpassword');
      await page.getByTestId('login-submit-btn').click();
      // Check for login error or alert
      await expect(page.locator('[data-testid="login-error"], [role="alert"]').first()).toBeVisible({ timeout: 3000 });
    });

    test('should successfully login with valid credentials', async ({ page }) => {
      // Mock successful login API response
      await page.route('**/api/v1/auth/login', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: {
              token: 'mock-jwt-token',
              user: {
                _id: 'user-123',
                email: 'test@example.com',
                profile: { firstName: 'Test', lastName: 'User' }
              }
            }
          }),
        });
      });

      await page.getByTestId('email-input').fill('test@example.com');
      await page.getByTestId('password-input').fill('password123');
      await page.getByTestId('login-submit-btn').click();

      await expect(page).toHaveURL('/dashboard');
    });

    test('should toggle password visibility', async ({ page }) => {
      const passwordInput = page.getByTestId('password-input');
      const toggleBtn = page.getByTestId('toggle-password-btn');

      await expect(passwordInput).toHaveAttribute('type', 'password');
      await toggleBtn.click();
      await expect(passwordInput).toHaveAttribute('type', 'text');
      await toggleBtn.click();
      await expect(passwordInput).toHaveAttribute('type', 'password');
    });

    test('should have forgot password link', async ({ page }) => {
      // Check that the forgot password link exists and is visible
      await expect(page.getByTestId('forgot-password-link')).toBeVisible();
      await expect(page.getByTestId('forgot-password-link')).toHaveAttribute('href', '/forgot-password');
    });

    test('should navigate to register page', async ({ page }) => {
      await page.getByTestId('register-link').click();
      await expect(page).toHaveURL('/register');
    });
  });

  test.describe('Protected Routes (Unauthenticated)', () => {
    // These tests verify redirect behavior for unauthenticated users
    test('should redirect unauthenticated users to login', async ({ page }) => {
      await page.goto('/dashboard');
      await expect(page).toHaveURL(/\/login/);
    });

    test('should redirect unauthenticated users from projects page', async ({ page }) => {
      await page.goto('/projects');
      await expect(page).toHaveURL(/\/login/);
    });
  });
});

// Authenticated tests - these use storageState from setup
test.describe('Authentication (Authenticated)', () => {
  // Use storageState for authenticated tests
  test.use({ storageState: 'tests/e2e/.auth/user.json' });

  test.beforeEach(async ({ page }) => {
    // Mock auth API for authenticated requests
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
              profile: { firstName: 'Test', lastName: 'User' }
            }
          }
        }),
      });
    });
  });

  test('should allow authenticated users to access dashboard', async ({ page }) => {
    await page.goto('/dashboard', { waitUntil: 'domcontentloaded' });
    await expect(page.getByTestId('dashboard-page')).toBeVisible({ timeout: 5000 });
  });

  test.describe('Logout', () => {
    test('should logout and redirect to login page', async ({ page }) => {
      await page.goto('/dashboard', { waitUntil: 'domcontentloaded' });
      await page.getByTestId('user-menu-btn').click();
      
      await Promise.all([
        page.waitForURL(/\/login/),
        page.getByTestId('logout-btn').click(),
      ]);
    });

    test('should clear auth token on logout', async ({ page }) => {
      await page.goto('/dashboard', { waitUntil: 'domcontentloaded' });
      await page.getByTestId('user-menu-btn').click();
      
      await Promise.all([
        page.waitForURL(/\/login/),
        page.getByTestId('logout-btn').click(),
      ]);

      const token = await page.evaluate(() => localStorage.getItem('token'));
      expect(token).toBeNull();
    });
  });
});
