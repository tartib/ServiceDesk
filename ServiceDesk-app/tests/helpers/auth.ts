import { Page } from '@playwright/test';

/**
 * Central auth helper for Playwright tests
 * Sets up authenticated session with mocked API responses
 */
export async function setupAuth(page: Page) {
  // Disable animations for faster tests
  await page.addStyleTag({
    content: `
      *, *::before, *::after {
        transition: none !important;
        animation: none !important;
      }
    `,
  });

  // Mock auth verification API
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

  // Navigate to login page first to set localStorage - use domcontentloaded for speed
  await page.goto('/login', { waitUntil: 'domcontentloaded' });
  await page.evaluate(() => {
    localStorage.setItem('token', 'mock-jwt-token');
    localStorage.setItem('user', JSON.stringify({
      _id: 'user-123',
      email: 'test@example.com',
      profile: { firstName: 'Test', lastName: 'User' }
    }));
  });
}

/**
 * Login with credentials (for actual login flow tests)
 */
export async function login(page: Page, email = 'test@example.com', password = 'password123') {
  await page.goto('/login');
  await page.getByTestId('email-input').fill(email);
  await page.getByTestId('password-input').fill(password);
  await page.getByTestId('login-submit-btn').click();
  await page.waitForURL(/\/dashboard/, { timeout: 10000 });
}

/**
 * Setup mock for projects API
 */
export async function mockProjectsAPI(page: Page) {
  await page.route('**/api/v1/pm/projects', async (route) => {
    if (route.request().method() === 'GET') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            projects: [
              { _id: 'proj-1', name: 'Project Alpha', key: 'PA', organization: 'org-1' },
              { _id: 'proj-2', name: 'Project Beta', key: 'PB', organization: 'org-1' }
            ]
          }
        }),
      });
    } else {
      await route.continue();
    }
  });
}

/**
 * Setup mock for single project API
 */
export async function mockProjectAPI(page: Page, projectId = 'proj-1') {
  await page.route(`**/api/v1/pm/projects/${projectId}`, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        success: true,
        data: {
          project: {
            _id: projectId,
            name: 'Project Alpha',
            key: 'PA',
            organization: 'org-1',
            methodology: 'agile'
          }
        }
      }),
    });
  });
}

/**
 * Setup mock for board API
 */
export async function mockBoardAPI(page: Page, projectId = 'proj-1') {
  await page.route(`**/api/v1/pm/projects/${projectId}/board`, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        success: true,
        data: {
          tasksByStatus: {
            'backlog': [
              { _id: 'task-1', key: 'PA-1', title: 'Task 1', type: 'task', status: { id: 'backlog', name: 'Backlog', category: 'todo' }, priority: 'medium' },
              { _id: 'task-2', key: 'PA-2', title: 'Task 2', type: 'bug', status: { id: 'backlog', name: 'Backlog', category: 'todo' }, priority: 'high' }
            ],
            'in-progress': [],
            'done': []
          },
          activeSprint: null
        }
      }),
    });
  });
}

/**
 * Wait for page to be fully loaded and settled
 */
export async function waitForPageReady(page: Page) {
  await page.waitForLoadState('networkidle');
  // Wait for fonts to load (important for RTL tests)
  await page.evaluate(() => document.fonts.ready);
}
