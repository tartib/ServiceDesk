import { test, expect, Page } from '@playwright/test';

/**
 * ITSM Incident Lifecycle E2E — Real API
 *
 * Full lifecycle: create → acknowledge → investigate → resolve → verify closed.
 * Uses real backend at localhost:5000.
 */

const API_BASE = 'http://localhost:5000';
const TEST_USER = { email: 'test@example.com', password: 'password123' };

test.use({ storageState: { cookies: [], origins: [] } });

async function loginAndSetup(page: Page): Promise<string> {
  await page.goto('/login', { waitUntil: 'networkidle' });
  await page.getByTestId('email-input').fill(TEST_USER.email);
  await page.getByTestId('password-input').fill(TEST_USER.password);
  await page.getByTestId('login-submit-btn').click();
  await page.waitForURL(/\/(dashboard|itsm)/, { timeout: 15000 });
  const token = await page.evaluate(() =>
    localStorage.getItem('token') || localStorage.getItem('accessToken') || ''
  );
  return token;
}

async function apiCall(token: string, method: string, endpoint: string, body?: object) {
  const response = await fetch(`${API_BASE}${endpoint}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  return response.json();
}

test.describe('Incident Lifecycle — Real API', () => {
  let token: string;
  let incidentId: string;

  test.describe.configure({ mode: 'serial' });

  test('Login', async ({ page }) => {
    token = await loginAndSetup(page);
    expect(token).toBeTruthy();
  });

  test('Create incident via API', async () => {
    const ts = Date.now();
    const res = await apiCall(token, 'POST', '/api/v2/itsm/incidents', {
      title: `E2E Printer Failure ${ts}`,
      description: 'Printer on 3rd floor not responding',
      priority: 'high',
      category_id: 'hardware',
    });
    expect(res.success ?? res.data).toBeTruthy();
    incidentId = res.data?._id || res.data?.incident?._id || res._id;
    expect(incidentId).toBeTruthy();
  });

  test('Acknowledge incident', async () => {
    const res = await apiCall(token, 'PUT', `/api/v2/itsm/incidents/${incidentId}`, {
      status: 'acknowledged',
    });
    expect(res.success ?? res.data).toBeTruthy();
  });

  test('Move to investigating', async () => {
    const res = await apiCall(token, 'PUT', `/api/v2/itsm/incidents/${incidentId}`, {
      status: 'investigating',
    });
    expect(res.success ?? res.data).toBeTruthy();
  });

  test('Resolve incident', async () => {
    const res = await apiCall(token, 'PUT', `/api/v2/itsm/incidents/${incidentId}`, {
      status: 'resolved',
      resolution_notes: 'Replaced toner cartridge',
    });
    expect(res.success ?? res.data).toBeTruthy();
  });

  test('Verify incident is resolved', async () => {
    const res = await apiCall(token, 'GET', `/api/v2/itsm/incidents/${incidentId}`);
    const incident = res.data?.incident || res.data || res;
    expect(incident.status).toBe('resolved');
  });

  test('Navigate to ITSM dashboard and see incidents', async ({ page }) => {
    await loginAndSetup(page);
    await page.goto('/itsm-dashboard', { waitUntil: 'networkidle' });
    await expect(page.locator('h1, h2, [data-testid="itsm-heading"]').first()).toBeVisible({ timeout: 10000 });
  });
});
