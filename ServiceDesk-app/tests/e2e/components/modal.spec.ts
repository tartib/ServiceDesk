import { test, expect } from '@playwright/test';

// These tests use storageState from playwright.config.ts for authentication
test.describe('Modals', () => {
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

    await page.route('**/api/v1/pm/projects/**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, data: { project: { _id: 'proj-1', name: 'Test', key: 'T' }, tasksByStatus: {}, sprints: [], tasks: [] } }),
      });
    });
  });

  test.describe('Create Task Modal', () => {
    test('should open modal when clicking create button', async ({ page }) => {
      await page.goto('/projects/proj-1/board');
      await page.getByTestId('create-task-btn').click();

      await expect(page.getByTestId('create-task-modal')).toBeVisible();
    });

    test('should close modal on Cancel button', async ({ page }) => {
      await page.goto('/projects/proj-1/board');
      await page.getByTestId('create-task-btn').click();
      await page.getByTestId('cancel-btn').click();

      await expect(page.getByTestId('create-task-modal')).not.toBeVisible();
    });

    test('should close modal on ESC key', async ({ page }) => {
      await page.goto('/projects/proj-1/board');
      await page.getByTestId('create-task-btn').click();
      await page.keyboard.press('Escape');

      await expect(page.getByTestId('create-task-modal')).not.toBeVisible();
    });

    test('should close modal on overlay click', async ({ page }) => {
      await page.goto('/projects/proj-1/board');
      await page.getByTestId('create-task-btn').click();
      await page.getByTestId('modal-overlay').click({ position: { x: 10, y: 10 } });

      await expect(page.getByTestId('create-task-modal')).not.toBeVisible();
    });

    test('should trap focus within modal', async ({ page }) => {
      await page.goto('/projects/proj-1/board');
      await page.getByTestId('create-task-btn').click();

      // Tab through focusable elements
      await page.keyboard.press('Tab');
      await page.keyboard.press('Tab');
      await page.keyboard.press('Tab');

      // Focus should stay within modal
      const focusedElement = await page.evaluate(() => document.activeElement?.closest('[data-testid="create-task-modal"]'));
      expect(focusedElement).not.toBeNull();
    });
  });

  test.describe('Confirmation Modal', () => {
    // Note: Task actions menu is not yet implemented in TaskDetailPanel
    // These tests are skipped until the feature is added
    test.skip('should show delete confirmation modal', async ({ page }) => {
      await page.goto('/projects/proj-1/board?selectedIssue=T-1');
      await page.getByTestId('task-actions-btn').click();
      await page.getByTestId('delete-task-btn').click();
      await expect(page.getByTestId('confirm-delete-modal')).toBeVisible();
    });

    test.skip('should cancel delete action', async ({ page }) => {
      await page.goto('/projects/proj-1/board?selectedIssue=T-1');
      await page.getByTestId('task-actions-btn').click();
      await page.getByTestId('delete-task-btn').click();
      await page.getByTestId('cancel-delete-btn').click();
      await expect(page.getByTestId('confirm-delete-modal')).not.toBeVisible();
    });

    test.skip('should proceed with delete on confirm', async ({ page }) => {
      await page.goto('/projects/proj-1/board?selectedIssue=T-1');
      await page.getByTestId('task-actions-btn').click();
      await page.getByTestId('delete-task-btn').click();
      await page.getByTestId('confirm-delete-btn').click();
      await expect(page.getByTestId('confirm-delete-modal')).not.toBeVisible();
    });
  });

  test.describe('Complete Sprint Modal', () => {
    test.beforeEach(async ({ page }) => {
      await page.route('**/api/v1/pm/projects/proj-1/sprints', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: {
              sprints: [{ _id: 'sprint-1', name: 'Sprint 1', status: 'active', startDate: '2024-01-01', endDate: '2024-01-14' }]
            }
          }),
        });
      });

      await page.route('**/api/v1/pm/projects/proj-1/backlog', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ success: true, data: { tasks: [] } }),
        });
      });

      await page.route('**/api/v1/pm/sprints/sprint-1', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ success: true, data: { tasks: [] } }),
        });
      });
    });

    // Note: Complete sprint button is not yet implemented in backlog page
    test.skip('should open complete sprint modal', async ({ page }) => {
      await page.goto('/projects/proj-1/backlog');
      await page.getByTestId('complete-sprint-btn').click();
      await expect(page.getByTestId('complete-sprint-modal')).toBeVisible();
    });

    test.skip('should show options for incomplete tasks', async ({ page }) => {
      await page.goto('/projects/proj-1/backlog');
      await page.getByTestId('complete-sprint-btn').click();
      await expect(page.getByText(/backlog/i)).toBeVisible();
    });
  });

  test.describe('Add People Modal', () => {
    // Note: Add people button is hidden on small screens, tests need desktop viewport
    test.skip('should open add people modal', async ({ page }) => {
      await page.goto('/projects/proj-1/board');
      await page.getByTestId('add-people-btn').click();
      await expect(page.getByTestId('add-people-modal')).toBeVisible();
    });

    test.skip('should have email input and role selector', async ({ page }) => {
      await page.goto('/projects/proj-1/board');
      await page.getByTestId('add-people-btn').click();
      await expect(page.getByTestId('invite-email-input')).toBeVisible();
      await expect(page.getByTestId('role-select')).toBeVisible();
    });

    test.skip('should validate email format', async ({ page }) => {
      await page.goto('/projects/proj-1/board');
      await page.getByTestId('add-people-btn').click();
      await page.getByTestId('invite-email-input').fill('invalid-email');
      await page.getByTestId('send-invite-btn').click();
      await expect(page.getByTestId('email-error')).toBeVisible();
    });
  });
});
