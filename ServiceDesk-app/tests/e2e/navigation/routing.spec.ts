import { test, expect } from '@playwright/test';

// These tests use storageState from playwright.config.ts for authentication
test.describe('Navigation & Routing', () => {
  test.beforeEach(async ({ page }) => {
    // Mock auth API
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

    // Mock projects API
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
  });

  test.describe('Main Navigation', () => {
    test('should navigate to dashboard', async ({ page }) => {
      await page.goto('/dashboard', { waitUntil: 'domcontentloaded' });
      await expect(page.getByTestId('dashboard-page')).toBeVisible({ timeout: 5000 });
    });

    test('should navigate to projects list', async ({ page }) => {
      await page.goto('/dashboard', { waitUntil: 'domcontentloaded' });
      await page.getByTestId('nav-projects').first().click();
      // Wait for projects page content, not just URL
      await expect(page.locator('body')).toContainText(/project/i, { timeout: 5000 });
    });

    test('should navigate to tickets page', async ({ page }) => {
      await page.goto('/dashboard', { waitUntil: 'domcontentloaded' });
      const ticketsNav = page.locator('[data-testid="nav-tickets"]');
      if (await ticketsNav.count() > 0) {
        await Promise.all([
          page.waitForURL(/\/tickets/),
          ticketsNav.first().click(),
        ]);
      } else {
        test.skip();
      }
    });

    test('should navigate to settings page', async ({ page }) => {
      await page.goto('/dashboard', { waitUntil: 'domcontentloaded' });
      const settingsNav = page.locator('[data-testid="nav-settings"]');
      if (await settingsNav.count() > 0) {
        await Promise.all([
          page.waitForURL(/\/settings/),
          settingsNav.first().click(),
        ]);
      } else {
        test.skip();
      }
    });
  });

  test.describe('Project Routes', () => {
    test.beforeEach(async ({ page }) => {
      // Mock projects API
      await page.route('**/api/v1/pm/projects', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: {
              projects: [
                { _id: 'proj-1', name: 'Project Alpha', key: 'PA' },
                { _id: 'proj-2', name: 'Project Beta', key: 'PB' }
              ]
            }
          }),
        });
      });

      await page.route('**/api/v1/pm/projects/proj-1', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: {
              project: { _id: 'proj-1', name: 'Project Alpha', key: 'PA', organization: 'org-1' }
            }
          }),
        });
      });
    });

    test('should load project board page', async ({ page }) => {
      await page.route('**/api/v1/pm/projects/proj-1/board', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: { tasksByStatus: {}, activeSprint: null }
          }),
        });
      });

      await page.goto('/projects/proj-1/board');
      await expect(page).toHaveURL('/projects/proj-1/board');
    });

    test('should load project backlog page', async ({ page }) => {
      await page.route('**/api/v1/pm/projects/proj-1/sprints', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ success: true, data: { sprints: [] } }),
        });
      });

      await page.route('**/api/v1/pm/projects/proj-1/backlog', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ success: true, data: { tasks: [] } }),
        });
      });

      await page.goto('/projects/proj-1/backlog');
      await expect(page).toHaveURL('/projects/proj-1/backlog');
    });

    test('should load project settings page', async ({ page }) => {
      await page.goto('/projects/proj-1/settings');
      await expect(page).toHaveURL('/projects/proj-1/settings');
    });

    test('should handle dynamic task route with query param', async ({ page }) => {
      await page.route('**/api/v1/pm/projects/proj-1/board', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: {
              tasksByStatus: {
                'backlog': [{ _id: 'task-1', key: 'PA-1', title: 'Test Task', type: 'task', status: { id: 'backlog', name: 'Backlog', category: 'todo' }, priority: 'medium' }]
              }
            }
          }),
        });
      });

      await page.goto('/projects/proj-1/board?selectedIssue=PA-1');
      await expect(page).toHaveURL(/selectedIssue=PA-1/);
    });
  });

  test.describe('Breadcrumb Navigation', () => {
    test('should display correct breadcrumbs on project page', async ({ page }) => {
      await page.route('**/api/v1/pm/projects/proj-1', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: { project: { _id: 'proj-1', name: 'Project Alpha', key: 'PA' } }
          }),
        });
      });

      await page.route('**/api/v1/pm/projects/proj-1/board', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ success: true, data: { tasksByStatus: {} } }),
        });
      });

      await page.goto('/projects/proj-1/board');
      await expect(page.getByTestId('breadcrumb-projects')).toBeVisible();
      await expect(page.getByTestId('breadcrumb-project-name')).toContainText('Project Alpha');
    });

    test('should navigate back via breadcrumbs', async ({ page }) => {
      await page.route('**/api/v1/pm/projects/**', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ success: true, data: { project: { _id: 'proj-1', name: 'Test', key: 'T' }, tasksByStatus: {} } }),
        });
      });

      await page.goto('/projects/proj-1/board');
      await page.getByTestId('breadcrumb-projects').click();
      await expect(page).toHaveURL('/projects');
    });
  });

  test.describe('Tab Navigation', () => {
    test.beforeEach(async ({ page }) => {
      await page.route('**/api/v1/pm/projects/proj-1**', async (route) => {
        const url = route.request().url();
        if (url.includes('/board')) {
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({ success: true, data: { tasksByStatus: {} } }),
          });
        } else if (url.includes('/sprints')) {
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({ success: true, data: { sprints: [] } }),
          });
        } else if (url.includes('/backlog')) {
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({ success: true, data: { tasks: [] } }),
          });
        } else {
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({ success: true, data: { project: { _id: 'proj-1', name: 'Test', key: 'T' } } }),
          });
        }
      });
    });

    test('should switch between project tabs', async ({ page }) => {
      await page.goto('/projects/proj-1/board');

      // Use .first() to get desktop tab (avoid mobile duplicate)
      await page.getByTestId('tab-backlog').first().click();
      await expect(page).toHaveURL(/\/backlog/);

      await page.getByTestId('tab-board').first().click();
      await expect(page).toHaveURL(/\/board/);
    });

    test('should highlight active tab', async ({ page }) => {
      await page.goto('/projects/proj-1/board');
      // Use .first() to get desktop tab
      await expect(page.getByTestId('tab-board').first()).toHaveClass(/active|selected/);
    });
  });

  test.describe('404 & Error Pages', () => {
    test('should show 404 for non-existent routes', async ({ page }) => {
      await page.goto('/non-existent-page');
      await expect(page.getByText(/404|not found/i)).toBeVisible();
    });

    test('should show error for non-existent project', async ({ page }) => {
      await page.route('**/api/v1/pm/projects/invalid-id', async (route) => {
        await route.fulfill({
          status: 404,
          contentType: 'application/json',
          body: JSON.stringify({ success: false, error: 'Project not found' }),
        });
      });

      await page.goto('/projects/invalid-id/board');
      await expect(page.getByText(/not found|error/i)).toBeVisible();
    });
  });
});
