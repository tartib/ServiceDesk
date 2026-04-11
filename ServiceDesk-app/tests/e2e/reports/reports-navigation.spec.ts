import { test, expect, Page } from '@playwright/test';

/**
 * Reports Navigation E2E — Real API
 *
 * Verifies the unified reports page loads correctly with ITSM/PM/Legacy tabs
 * and that the analytics API endpoints respond.
 */

const API_BASE = 'http://localhost:5000';
const TEST_USER = { email: 'test@example.com', password: 'password123' };

test.use({ storageState: { cookies: [], origins: [] } });

async function loginAndSetup(page: Page): Promise<string> {
  await page.goto('/login', { waitUntil: 'networkidle' });
  await page.getByTestId('email-input').fill(TEST_USER.email);
  await page.getByTestId('password-input').fill(TEST_USER.password);
  await page.getByTestId('login-submit-btn').click();
  await page.waitForURL(/\/(dashboard|reports)/, { timeout: 15000 });
  const token = await page.evaluate(() =>
    localStorage.getItem('token') || localStorage.getItem('accessToken') || ''
  );
  return token;
}

async function apiCall(token: string, method: string, endpoint: string) {
  const response = await fetch(`${API_BASE}${endpoint}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
  });
  return response.json();
}

test.describe('Reports & Analytics — Navigation + API', () => {
  let token: string;

  test.describe.configure({ mode: 'serial' });

  test('Login', async ({ page }) => {
    token = await loginAndSetup(page);
    expect(token).toBeTruthy();
  });

  test('Navigate to reports page', async ({ page }) => {
    await loginAndSetup(page);
    await page.goto('/reports', { waitUntil: 'networkidle' });
    await expect(page.locator('h1').first()).toBeVisible({ timeout: 10000 });
  });

  test('ITSM tab is default and renders', async ({ page }) => {
    await loginAndSetup(page);
    await page.goto('/reports', { waitUntil: 'networkidle' });
    // ITSM tab should be active by default
    const itsmButton = page.locator('button:has-text("ITSM")').first();
    await expect(itsmButton).toBeVisible({ timeout: 10000 });
  });

  test('PM tab is clickable', async ({ page }) => {
    await loginAndSetup(page);
    await page.goto('/reports', { waitUntil: 'networkidle' });
    const pmButton = page.locator('button:has-text("Project")').first();
    await expect(pmButton).toBeVisible({ timeout: 10000 });
    await pmButton.click();
    await page.waitForTimeout(500);
  });

  test('Legacy tab is clickable', async ({ page }) => {
    await loginAndSetup(page);
    await page.goto('/reports', { waitUntil: 'networkidle' });
    const legacyButton = page.locator('button:has-text("Task")').first();
    await expect(legacyButton).toBeVisible({ timeout: 10000 });
    await legacyButton.click();
    await page.waitForTimeout(500);
  });

  // API endpoint tests
  test('ITSM summary API responds', async () => {
    const res = await apiCall(token, 'GET', '/api/v2/analytics/itsm/summary');
    expect(res.success ?? res.data).toBeTruthy();
  });

  test('ITSM incident trend API responds', async () => {
    const res = await apiCall(token, 'GET', '/api/v2/analytics/itsm/incident-trend?days=7');
    expect(res.success ?? res.data).toBeTruthy();
  });

  test('ITSM SLA trend API responds', async () => {
    const res = await apiCall(token, 'GET', '/api/v2/analytics/itsm/sla-trend?days=30');
    expect(res.success ?? res.data).toBeTruthy();
  });

  test('PM summary API responds', async () => {
    const res = await apiCall(token, 'GET', '/api/v2/analytics/pm/summary');
    expect(res.success ?? res.data).toBeTruthy();
  });

  test('PM velocity trend API responds', async () => {
    const res = await apiCall(token, 'GET', '/api/v2/analytics/pm/velocity-trend?limit=5');
    expect(res.success ?? res.data).toBeTruthy();
  });

  test('Legacy dashboard analytics API responds', async () => {
    const res = await apiCall(token, 'GET', '/api/v2/analytics/reports/dashboard');
    expect(res.success ?? res.data).toBeTruthy();
  });
});
