import { test, expect, Page } from '@playwright/test';

/**
 * Service Request Lifecycle E2E — Real API
 *
 * Full lifecycle: create → approve → fulfill → verify closed.
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

test.describe('Service Request Lifecycle — Real API', () => {
  let token: string;
  let requestId: string;

  test.describe.configure({ mode: 'serial' });

  test('Login', async ({ page }) => {
    token = await loginAndSetup(page);
    expect(token).toBeTruthy();
  });

  test('Create service request via API', async () => {
    const ts = Date.now();
    const res = await apiCall(token, 'POST', '/api/v2/itsm/service-requests', {
      service_id: 'vpn-access',
      service_name: 'VPN Access',
      priority: 'medium',
      form_data: { reason: `E2E test ${ts}`, duration: '1 month' },
      requester: { id: 'test-user', name: 'Test User', email: TEST_USER.email, department: 'IT' },
      site_id: 'default',
    });
    expect(res.success ?? res.data).toBeTruthy();
    requestId = res.data?._id || res.data?.request?._id || res._id;
    expect(requestId).toBeTruthy();
  });

  test('Approve service request', async () => {
    const res = await apiCall(token, 'POST', `/api/v2/itsm/service-requests/${requestId}/status`, {
      status: 'approved',
      notes: 'Approved by E2E test',
    });
    expect(res.success ?? res.data).toBeTruthy();
  });

  test('Fulfill service request', async () => {
    const res = await apiCall(token, 'POST', `/api/v2/itsm/service-requests/${requestId}/status`, {
      status: 'fulfilled',
      notes: 'VPN configured',
    });
    expect(res.success ?? res.data).toBeTruthy();
  });

  test('Verify service request is fulfilled', async () => {
    const res = await apiCall(token, 'GET', `/api/v2/itsm/service-requests/${requestId}`);
    const sr = res.data?.request || res.data || res;
    expect(sr.status).toBe('fulfilled');
  });
});
