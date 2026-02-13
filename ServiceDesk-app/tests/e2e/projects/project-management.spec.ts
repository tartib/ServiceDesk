import { test, expect } from '@playwright/test';

// Skip auth setup dependency - use inline mocking
test.use({ storageState: { cookies: [], origins: [] } });

/**
 * Project Management E2E Tests
 * Tests the complete workflow from project creation to sprint completion
 * Uses mocked API responses for isolated testing
 */

// Test data
const TEST_PROJECT = {
  name: 'Website Revamp',
  key: 'WR',
  methodology: 'scrum',
};

const TEST_TEAMS = ['Frontend', 'Backend', 'Designer'];

const TEST_TASK = {
  title: 'Create Login Page',
  description: 'UI + API integration',
  priority: 'high',
};

const TEST_SPRINTS = [
  { name: 'Sprint 1', duration: '2 weeks' },
  { name: 'Sprint 2', duration: '2 weeks' },
  { name: 'Sprint 3', duration: '2 weeks' },
];

test.describe('Project Management System', () => {
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
              profile: { firstName: 'Test', lastName: 'User' },
              roles: ['user', 'admin'],
              organizations: ['org-1'],
            },
          },
        }),
      });
    });
  });

  test.describe('Scenario 1: Create a New Project', () => {
    test('should display projects page with create button', async ({ page }) => {
      await page.route('**/api/v1/pm/projects', async (route) => {
        if (route.request().method() === 'GET') {
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({ success: true, data: { projects: [] } }),
          });
        }
      });

      await page.goto('/projects', { waitUntil: 'domcontentloaded' });
      await expect(page.getByTestId('create-project-btn')).toBeVisible({ timeout: 5000 });
    });

    test('should open project creation wizard', async ({ page }) => {
      await page.route('**/api/v1/pm/projects', async (route) => {
        if (route.request().method() === 'GET') {
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({ success: true, data: { projects: [] } }),
          });
        }
      });

      await page.goto('/projects', { waitUntil: 'domcontentloaded' });
      await page.getByTestId('create-project-btn').click();
      
      // Project wizard should be visible
      await expect(page.getByTestId('project-wizard')).toBeVisible({ timeout: 3000 });
    });

    test('should create project with name and methodology', async ({ page }) => {
      let createProjectCalled = false;
      
      await page.route('**/api/v1/pm/projects', async (route) => {
        if (route.request().method() === 'GET') {
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({ success: true, data: { projects: [] } }),
          });
        } else if (route.request().method() === 'POST') {
          createProjectCalled = true;
          const body = route.request().postDataJSON();
          expect(body.name).toBe(TEST_PROJECT.name);
          
          await route.fulfill({
            status: 201,
            contentType: 'application/json',
            body: JSON.stringify({
              success: true,
              data: {
                project: {
                  _id: 'proj-new',
                  name: TEST_PROJECT.name,
                  key: TEST_PROJECT.key,
                  methodology: { code: TEST_PROJECT.methodology },
                  organization: 'org-1',
                },
              },
            }),
          });
        }
      });

      await page.goto('/projects', { waitUntil: 'domcontentloaded' });
      await page.getByTestId('create-project-btn').click();
      
      // Fill project name
      await page.getByTestId('project-name-input').fill(TEST_PROJECT.name);
      
      // Select Scrum methodology
      await page.getByTestId('methodology-scrum').click();
      
      // Submit
      await page.getByTestId('create-project-submit').click();
      
      // Verify API was called
      expect(createProjectCalled).toBe(true);
    });

    test('should redirect to project dashboard after creation', async ({ page }) => {
      await page.route('**/api/v1/pm/projects', async (route) => {
        if (route.request().method() === 'GET') {
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({ success: true, data: { projects: [] } }),
          });
        } else if (route.request().method() === 'POST') {
          await route.fulfill({
            status: 201,
            contentType: 'application/json',
            body: JSON.stringify({
              success: true,
              data: {
                project: {
                  _id: 'proj-new',
                  name: TEST_PROJECT.name,
                  key: TEST_PROJECT.key,
                  methodology: { code: TEST_PROJECT.methodology },
                },
              },
            }),
          });
        }
      });

      // Mock the project board page
      await page.route('**/api/v1/pm/projects/proj-new', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: {
              project: {
                _id: 'proj-new',
                name: TEST_PROJECT.name,
                key: TEST_PROJECT.key,
                methodology: { code: TEST_PROJECT.methodology },
              },
            },
          }),
        });
      });

      await page.route('**/api/v1/pm/projects/proj-new/board', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: { tasksByStatus: {}, activeSprint: null },
          }),
        });
      });

      await page.goto('/projects', { waitUntil: 'domcontentloaded' });
      await page.getByTestId('create-project-btn').click();
      await page.getByTestId('project-name-input').fill(TEST_PROJECT.name);
      await page.getByTestId('methodology-scrum').click();
      await page.getByTestId('create-project-submit').click();

      // Should redirect to project board
      await expect(page).toHaveURL(/\/projects\/proj-new\/board/, { timeout: 5000 });
    });

    test('should show project in project list after creation', async ({ page }) => {
      await page.route('**/api/v1/pm/projects', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: {
              projects: [
                {
                  _id: 'proj-1',
                  name: TEST_PROJECT.name,
                  key: TEST_PROJECT.key,
                  methodology: { code: TEST_PROJECT.methodology },
                  status: 'active',
                },
              ],
            },
          }),
        });
      });

      await page.goto('/projects', { waitUntil: 'domcontentloaded' });
      await expect(page.getByText(TEST_PROJECT.name)).toBeVisible({ timeout: 5000 });
    });
  });

  test.describe('Scenario 2: Add Teams', () => {
    test.beforeEach(async ({ page }) => {
      // Mock project API
      await page.route('**/api/v1/pm/projects/proj-1', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: {
              project: {
                _id: 'proj-1',
                name: TEST_PROJECT.name,
                key: TEST_PROJECT.key,
                organization: 'org-1',
              },
            },
          }),
        });
      });
    });

    test('should navigate to project settings', async ({ page }) => {
      await page.goto('/projects/proj-1/settings', { waitUntil: 'domcontentloaded' });
      await expect(page.getByTestId('project-settings-page')).toBeVisible({ timeout: 5000 });
    });

    test('should display teams section in settings', async ({ page }) => {
      await page.route('**/api/v1/pm/projects/proj-1/teams', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ success: true, data: { teams: [] } }),
        });
      });

      await page.goto('/projects/proj-1/settings', { waitUntil: 'domcontentloaded' });
      await expect(page.getByTestId('teams-section')).toBeVisible({ timeout: 5000 });
    });

    test('should add Frontend team', async ({ page }) => {
      let addTeamCalled = false;

      await page.route('**/api/v1/pm/projects/proj-1/teams', async (route) => {
        if (route.request().method() === 'GET') {
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({ success: true, data: { teams: [] } }),
          });
        } else if (route.request().method() === 'POST') {
          addTeamCalled = true;
          const body = route.request().postDataJSON();
          expect(body.name).toBe('Frontend');
          
          await route.fulfill({
            status: 201,
            contentType: 'application/json',
            body: JSON.stringify({
              success: true,
              data: { team: { _id: 'team-1', name: 'Frontend' } },
            }),
          });
        }
      });

      await page.goto('/projects/proj-1/settings', { waitUntil: 'domcontentloaded' });
      await page.getByTestId('add-team-btn').click();
      await page.getByTestId('team-name-input').fill('Frontend');
      await page.getByTestId('save-team-btn').click();

      expect(addTeamCalled).toBe(true);
    });

    test('should display all teams after adding', async ({ page }) => {
      await page.route('**/api/v1/pm/projects/proj-1/teams', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: {
              teams: TEST_TEAMS.map((name, i) => ({ _id: `team-${i}`, name })),
            },
          }),
        });
      });

      await page.goto('/projects/proj-1/settings', { waitUntil: 'domcontentloaded' });
      
      for (const teamName of TEST_TEAMS) {
        await expect(page.getByText(teamName)).toBeVisible({ timeout: 3000 });
      }
    });
  });

  test.describe('Scenario 3: Add Members to Teams', () => {
    test.beforeEach(async ({ page }) => {
      await page.route('**/api/v1/pm/projects/proj-1', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: {
              project: {
                _id: 'proj-1',
                name: TEST_PROJECT.name,
                key: TEST_PROJECT.key,
                organization: 'org-1',
              },
            },
          }),
        });
      });

      await page.route('**/api/v1/pm/projects/proj-1/members', async (route) => {
        if (route.request().method() === 'GET') {
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
              success: true,
              data: {
                members: [
                  { _id: 'member-1', user: { _id: 'user-1', email: 'ahmed@example.com', profile: { firstName: 'Ahmed', lastName: 'Ali' } }, role: 'contributor' },
                ],
              },
            }),
          });
        }
      });
    });

    test('should display members section', async ({ page }) => {
      await page.goto('/projects/proj-1/settings', { waitUntil: 'domcontentloaded' });
      await expect(page.getByTestId('members-section')).toBeVisible({ timeout: 5000 });
    });

    test('should add member to project', async ({ page }) => {
      let inviteCalled = false;

      await page.route('**/api/v1/pm/projects/proj-1/members/invite', async (route) => {
        inviteCalled = true;
        const body = route.request().postDataJSON();
        expect(body.email).toBe('ahmed@example.com');
        expect(body.role).toBe('contributor');

        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: {
              member: {
                _id: 'member-new',
                user: { _id: 'user-ahmed', email: 'ahmed@example.com', profile: { firstName: 'Ahmed' } },
                role: 'contributor',
              },
            },
          }),
        });
      });

      await page.goto('/projects/proj-1/settings', { waitUntil: 'domcontentloaded' });
      await page.getByTestId('add-member-btn').click();
      await page.getByTestId('member-email-input').fill('ahmed@example.com');
      await page.getByTestId('member-role-select').selectOption('contributor');
      await page.getByTestId('invite-member-btn').click();

      expect(inviteCalled).toBe(true);
    });

    test('should display member with role', async ({ page }) => {
      await page.goto('/projects/proj-1/settings', { waitUntil: 'domcontentloaded' });
      await expect(page.getByText('Ahmed')).toBeVisible({ timeout: 5000 });
    });
  });

  test.describe('Scenario 4: Create Task in Backlog', () => {
    test.beforeEach(async ({ page }) => {
      await page.route('**/api/v1/pm/projects/proj-1', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: {
              project: {
                _id: 'proj-1',
                name: TEST_PROJECT.name,
                key: TEST_PROJECT.key,
                organization: 'org-1',
                methodology: { code: 'scrum' },
              },
            },
          }),
        });
      });

      await page.route('**/api/v1/pm/projects/proj-1/backlog', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: { tasks: [], sprints: [] },
          }),
        });
      });
    });

    test('should navigate to backlog page', async ({ page }) => {
      await page.goto('/projects/proj-1/backlog', { waitUntil: 'domcontentloaded' });
      await expect(page.getByTestId('backlog-page')).toBeVisible({ timeout: 5000 });
    });

    test('should open create task modal from backlog', async ({ page }) => {
      await page.goto('/projects/proj-1/backlog', { waitUntil: 'domcontentloaded' });
      await page.getByTestId('create-task-btn').click();
      await expect(page.getByTestId('create-task-modal')).toBeVisible({ timeout: 3000 });
    });

    test('should create task with title, description, and priority', async ({ page }) => {
      let createTaskCalled = false;

      await page.route('**/api/v1/pm/projects/proj-1/tasks', async (route) => {
        if (route.request().method() === 'POST') {
          createTaskCalled = true;
          const body = route.request().postDataJSON();
          expect(body.title).toBe(TEST_TASK.title);
          expect(body.priority).toBe(TEST_TASK.priority);

          await route.fulfill({
            status: 201,
            contentType: 'application/json',
            body: JSON.stringify({
              success: true,
              data: {
                task: {
                  _id: 'task-new',
                  key: 'WR-1',
                  title: TEST_TASK.title,
                  description: TEST_TASK.description,
                  priority: TEST_TASK.priority,
                  status: { id: 'backlog', name: 'Backlog', category: 'todo' },
                },
              },
            }),
          });
        }
      });

      await page.goto('/projects/proj-1/backlog', { waitUntil: 'domcontentloaded' });
      await page.getByTestId('create-task-btn').click();
      
      await page.getByTestId('task-title-input').fill(TEST_TASK.title);
      await page.getByTestId('task-description-input').fill(TEST_TASK.description);
      await page.getByTestId('priority-select').selectOption(TEST_TASK.priority);
      await page.getByTestId('save-task-btn').click();

      expect(createTaskCalled).toBe(true);
    });

    test('should display task in backlog after creation', async ({ page }) => {
      await page.route('**/api/v1/pm/projects/proj-1/backlog', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: {
              tasks: [
                {
                  _id: 'task-1',
                  key: 'WR-1',
                  title: TEST_TASK.title,
                  priority: TEST_TASK.priority,
                  status: { id: 'backlog', name: 'Backlog', category: 'todo' },
                },
              ],
              sprints: [],
            },
          }),
        });
      });

      await page.goto('/projects/proj-1/backlog', { waitUntil: 'domcontentloaded' });
      await expect(page.getByText(TEST_TASK.title)).toBeVisible({ timeout: 5000 });
    });
  });

  test.describe('Scenario 5: Create Sprints', () => {
    test.beforeEach(async ({ page }) => {
      await page.route('**/api/v1/pm/projects/proj-1', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: {
              project: {
                _id: 'proj-1',
                name: TEST_PROJECT.name,
                key: TEST_PROJECT.key,
                organization: 'org-1',
                methodology: { code: 'scrum' },
              },
            },
          }),
        });
      });
    });

    test('should navigate to sprints page', async ({ page }) => {
      await page.route('**/api/v1/pm/projects/proj-1/sprints', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ success: true, data: { sprints: [] } }),
        });
      });

      await page.goto('/projects/proj-1/sprints', { waitUntil: 'domcontentloaded' });
      await expect(page.getByTestId('sprints-page')).toBeVisible({ timeout: 5000 });
    });

    test('should open create sprint modal', async ({ page }) => {
      await page.route('**/api/v1/pm/projects/proj-1/sprints', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ success: true, data: { sprints: [] } }),
        });
      });

      await page.goto('/projects/proj-1/sprints', { waitUntil: 'domcontentloaded' });
      await page.getByTestId('create-sprint-btn').click();
      await expect(page.getByTestId('create-sprint-modal')).toBeVisible({ timeout: 3000 });
    });

    test('should create Sprint 1 with 2 weeks duration', async ({ page }) => {
      let createSprintCalled = false;

      await page.route('**/api/v1/pm/projects/proj-1/sprints', async (route) => {
        if (route.request().method() === 'GET') {
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({ success: true, data: { sprints: [] } }),
          });
        } else if (route.request().method() === 'POST') {
          createSprintCalled = true;
          const body = route.request().postDataJSON();
          expect(body.name).toBe('Sprint 1');

          await route.fulfill({
            status: 201,
            contentType: 'application/json',
            body: JSON.stringify({
              success: true,
              data: {
                sprint: {
                  _id: 'sprint-1',
                  name: 'Sprint 1',
                  status: 'planning',
                  startDate: new Date().toISOString(),
                  endDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
                },
              },
            }),
          });
        }
      });

      await page.goto('/projects/proj-1/sprints', { waitUntil: 'domcontentloaded' });
      await page.getByTestId('create-sprint-btn').click();
      await page.getByTestId('sprint-name-input').fill('Sprint 1');
      await page.getByTestId('sprint-duration-select').selectOption('2-weeks');
      await page.getByTestId('save-sprint-btn').click();

      expect(createSprintCalled).toBe(true);
    });

    test('should display all sprints in order', async ({ page }) => {
      await page.route('**/api/v1/pm/projects/proj-1/sprints', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: {
              sprints: TEST_SPRINTS.map((sprint, i) => ({
                _id: `sprint-${i + 1}`,
                name: sprint.name,
                status: 'planning',
                stats: { totalTasks: 0, completedTasks: 0, totalPoints: 0, completedPoints: 0 },
                progress: 0,
              })),
            },
          }),
        });
      });

      await page.goto('/projects/proj-1/sprints', { waitUntil: 'domcontentloaded' });
      
      for (const sprint of TEST_SPRINTS) {
        await expect(page.getByText(sprint.name)).toBeVisible({ timeout: 3000 });
      }
    });
  });

  test.describe('Scenario 6: Start Sprint 1', () => {
    test.beforeEach(async ({ page }) => {
      await page.route('**/api/v1/pm/projects/proj-1', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: {
              project: {
                _id: 'proj-1',
                name: TEST_PROJECT.name,
                key: TEST_PROJECT.key,
                organization: 'org-1',
                methodology: { code: 'scrum' },
              },
            },
          }),
        });
      });
    });

    test('should move task to sprint from backlog', async ({ page }) => {
      let updateTaskCalled = false;

      await page.route('**/api/v1/pm/projects/proj-1/backlog', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: {
              tasks: [
                { _id: 'task-1', key: 'WR-1', title: TEST_TASK.title, sprint: null },
              ],
              sprints: [
                { _id: 'sprint-1', name: 'Sprint 1', status: 'planning' },
              ],
            },
          }),
        });
      });

      await page.route('**/api/v1/pm/tasks/task-1', async (route) => {
        if (route.request().method() === 'PUT' || route.request().method() === 'PATCH') {
          updateTaskCalled = true;
          const body = route.request().postDataJSON();
          expect(body.sprint).toBe('sprint-1');

          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({ success: true }),
          });
        }
      });

      await page.goto('/projects/proj-1/backlog', { waitUntil: 'domcontentloaded' });
      
      // Drag task to sprint or use context menu
      await page.getByTestId('task-WR-1').click({ button: 'right' });
      await page.getByTestId('move-to-sprint-option').click();
      await page.getByTestId('sprint-option-sprint-1').click();

      expect(updateTaskCalled).toBe(true);
    });

    test('should start sprint', async ({ page }) => {
      let startSprintCalled = false;

      await page.route('**/api/v1/pm/projects/proj-1/sprints', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: {
              sprints: [
                {
                  _id: 'sprint-1',
                  name: 'Sprint 1',
                  status: 'planning',
                  stats: { totalTasks: 1, completedTasks: 0, totalPoints: 0, completedPoints: 0 },
                  progress: 0,
                },
              ],
            },
          }),
        });
      });

      await page.route('**/api/v1/pm/sprints/sprint-1/start', async (route) => {
        startSprintCalled = true;
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: {
              sprint: {
                _id: 'sprint-1',
                name: 'Sprint 1',
                status: 'active',
              },
            },
          }),
        });
      });

      await page.goto('/projects/proj-1/sprints', { waitUntil: 'domcontentloaded' });
      await page.getByTestId('sprint-sprint-1').click();
      await page.getByTestId('start-sprint-btn').click();
      
      // Confirm start
      await page.getByTestId('confirm-start-sprint').click();

      expect(startSprintCalled).toBe(true);
    });

    test('should show sprint as active after starting', async ({ page }) => {
      await page.route('**/api/v1/pm/projects/proj-1/sprints', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: {
              sprints: [
                {
                  _id: 'sprint-1',
                  name: 'Sprint 1',
                  status: 'active',
                  stats: { totalTasks: 1, completedTasks: 0, totalPoints: 0, completedPoints: 0 },
                  progress: 0,
                },
              ],
            },
          }),
        });
      });

      await page.goto('/projects/proj-1/sprints', { waitUntil: 'domcontentloaded' });
      await expect(page.getByTestId('sprint-status-active')).toBeVisible({ timeout: 5000 });
    });
  });

  test.describe('Scenario 7: Move Task Across Board Columns', () => {
    const mockTasksWithSprint = {
      'todo': [
        {
          _id: 'task-1',
          key: 'WR-1',
          title: TEST_TASK.title,
          type: 'task',
          status: { id: 'todo', name: 'To Do', category: 'todo' },
          priority: 'high',
          sprint: 'sprint-1',
        },
      ],
      'in-progress': [],
      'done': [],
    };

    test.beforeEach(async ({ page }) => {
      await page.route('**/api/v1/pm/projects/proj-1', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: {
              project: {
                _id: 'proj-1',
                name: TEST_PROJECT.name,
                key: TEST_PROJECT.key,
                organization: 'org-1',
              },
            },
          }),
        });
      });

      await page.route('**/api/v1/pm/projects/proj-1/board', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: {
              tasksByStatus: mockTasksWithSprint,
              activeSprint: { _id: 'sprint-1', name: 'Sprint 1' },
            },
          }),
        });
      });
    });

    test('should display sprint board with task in To Do', async ({ page }) => {
      await page.goto('/projects/proj-1/board', { waitUntil: 'domcontentloaded' });
      
      const todoColumn = page.getByTestId('column-todo');
      await expect(todoColumn.getByText(TEST_TASK.title)).toBeVisible({ timeout: 5000 });
    });

    test('should move task from To Do to In Progress', async ({ page }) => {
      let statusUpdateCalled = false;

      await page.route('**/api/v1/pm/tasks/task-1/status', async (route) => {
        statusUpdateCalled = true;
        const body = route.request().postDataJSON();
        expect(body.status).toBe('in-progress');

        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ success: true }),
        });
      });

      await page.goto('/projects/proj-1/board', { waitUntil: 'domcontentloaded' });
      
      const taskCard = page.getByTestId('task-card-WR-1');
      const targetColumn = page.getByTestId('column-in-progress');
      
      await taskCard.dragTo(targetColumn);

      // Verify API was called (drag-drop may require additional setup)
      // For now, test the status change via dropdown
      await taskCard.click();
      await page.getByTestId('status-dropdown').click();
      await page.getByTestId('status-option-in-progress').click();

      expect(statusUpdateCalled).toBe(true);
    });

    test('should move task from In Progress to Done', async ({ page }) => {
      let statusUpdateCalled = false;

      await page.route('**/api/v1/pm/projects/proj-1/board', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: {
              tasksByStatus: {
                'todo': [],
                'in-progress': [
                  {
                    _id: 'task-1',
                    key: 'WR-1',
                    title: TEST_TASK.title,
                    type: 'task',
                    status: { id: 'in-progress', name: 'In Progress', category: 'in_progress' },
                    priority: 'high',
                  },
                ],
                'done': [],
              },
              activeSprint: { _id: 'sprint-1', name: 'Sprint 1' },
            },
          }),
        });
      });

      await page.route('**/api/v1/pm/tasks/task-1/status', async (route) => {
        statusUpdateCalled = true;
        const body = route.request().postDataJSON();
        expect(body.status).toBe('done');

        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ success: true }),
        });
      });

      await page.goto('/projects/proj-1/board', { waitUntil: 'domcontentloaded' });
      
      await page.getByTestId('task-card-WR-1').click();
      await page.getByTestId('status-dropdown').click();
      await page.getByTestId('status-option-done').click();

      expect(statusUpdateCalled).toBe(true);
    });

    test('should persist status change after refresh', async ({ page }) => {
      await page.route('**/api/v1/pm/projects/proj-1/board', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: {
              tasksByStatus: {
                'todo': [],
                'in-progress': [],
                'done': [
                  {
                    _id: 'task-1',
                    key: 'WR-1',
                    title: TEST_TASK.title,
                    type: 'task',
                    status: { id: 'done', name: 'Done', category: 'done' },
                    priority: 'high',
                  },
                ],
              },
              activeSprint: { _id: 'sprint-1', name: 'Sprint 1' },
            },
          }),
        });
      });

      await page.goto('/projects/proj-1/board', { waitUntil: 'domcontentloaded' });
      
      const doneColumn = page.getByTestId('column-done');
      await expect(doneColumn.getByText(TEST_TASK.title)).toBeVisible({ timeout: 5000 });
    });
  });

  test.describe('Scenario 8: Complete Sprint', () => {
    test.beforeEach(async ({ page }) => {
      await page.route('**/api/v1/pm/projects/proj-1', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: {
              project: {
                _id: 'proj-1',
                name: TEST_PROJECT.name,
                key: TEST_PROJECT.key,
                organization: 'org-1',
                methodology: { code: 'scrum' },
              },
            },
          }),
        });
      });
    });

    test('should show complete sprint button for active sprint', async ({ page }) => {
      await page.route('**/api/v1/pm/projects/proj-1/board', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: {
              tasksByStatus: {
                'todo': [],
                'in-progress': [],
                'done': [
                  { _id: 'task-1', key: 'WR-1', title: TEST_TASK.title, status: { id: 'done', name: 'Done', category: 'done' } },
                ],
              },
              activeSprint: { _id: 'sprint-1', name: 'Sprint 1', status: 'active' },
            },
          }),
        });
      });

      await page.goto('/projects/proj-1/board', { waitUntil: 'domcontentloaded' });
      await expect(page.getByTestId('complete-sprint-btn')).toBeVisible({ timeout: 5000 });
    });

    test('should open complete sprint modal', async ({ page }) => {
      await page.route('**/api/v1/pm/projects/proj-1/board', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: {
              tasksByStatus: { 'todo': [], 'in-progress': [], 'done': [] },
              activeSprint: { _id: 'sprint-1', name: 'Sprint 1', status: 'active' },
            },
          }),
        });
      });

      await page.goto('/projects/proj-1/board', { waitUntil: 'domcontentloaded' });
      await page.getByTestId('complete-sprint-btn').click();
      
      await expect(page.getByTestId('complete-sprint-modal')).toBeVisible({ timeout: 3000 });
    });

    test('should display sprint summary in completion modal', async ({ page }) => {
      await page.route('**/api/v1/pm/projects/proj-1/board', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: {
              tasksByStatus: {
                'todo': [],
                'in-progress': [
                  { _id: 'task-2', key: 'WR-2', title: 'Incomplete Task', status: { id: 'in-progress', name: 'In Progress', category: 'in_progress' } },
                ],
                'done': [
                  { _id: 'task-1', key: 'WR-1', title: TEST_TASK.title, status: { id: 'done', name: 'Done', category: 'done' } },
                ],
              },
              activeSprint: { _id: 'sprint-1', name: 'Sprint 1', status: 'active' },
            },
          }),
        });
      });

      await page.goto('/projects/proj-1/board', { waitUntil: 'domcontentloaded' });
      await page.getByTestId('complete-sprint-btn').click();
      
      // Should show summary
      await expect(page.getByTestId('sprint-summary')).toBeVisible({ timeout: 3000 });
      await expect(page.getByText('1 completed')).toBeVisible();
      await expect(page.getByText('1 incomplete')).toBeVisible();
    });

    test('should allow selecting destination for incomplete tasks', async ({ page }) => {
      await page.route('**/api/v1/pm/projects/proj-1/board', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: {
              tasksByStatus: {
                'todo': [],
                'in-progress': [
                  { _id: 'task-2', key: 'WR-2', title: 'Incomplete Task' },
                ],
                'done': [],
              },
              activeSprint: { _id: 'sprint-1', name: 'Sprint 1', status: 'active' },
            },
          }),
        });
      });

      await page.route('**/api/v1/pm/projects/proj-1/sprints', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: {
              sprints: [
                { _id: 'sprint-1', name: 'Sprint 1', status: 'active' },
                { _id: 'sprint-2', name: 'Sprint 2', status: 'planning' },
              ],
            },
          }),
        });
      });

      await page.goto('/projects/proj-1/board', { waitUntil: 'domcontentloaded' });
      await page.getByTestId('complete-sprint-btn').click();
      
      // Should show destination selector
      await expect(page.getByTestId('incomplete-tasks-destination')).toBeVisible({ timeout: 3000 });
      await page.getByTestId('incomplete-tasks-destination').selectOption('sprint-2');
    });

    test('should complete sprint and update status', async ({ page }) => {
      let completeSprintCalled = false;

      await page.route('**/api/v1/pm/projects/proj-1/board', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: {
              tasksByStatus: {
                'todo': [],
                'in-progress': [],
                'done': [
                  { _id: 'task-1', key: 'WR-1', title: TEST_TASK.title, status: { id: 'done', name: 'Done', category: 'done' } },
                ],
              },
              activeSprint: { _id: 'sprint-1', name: 'Sprint 1', status: 'active' },
            },
          }),
        });
      });

      await page.route('**/api/v1/pm/sprints/sprint-1/complete', async (route) => {
        completeSprintCalled = true;
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: {
              sprint: {
                _id: 'sprint-1',
                name: 'Sprint 1',
                status: 'completed',
              },
            },
          }),
        });
      });

      await page.goto('/projects/proj-1/board', { waitUntil: 'domcontentloaded' });
      await page.getByTestId('complete-sprint-btn').click();
      await page.getByTestId('confirm-complete-sprint').click();

      expect(completeSprintCalled).toBe(true);
    });

    test('should show Sprint 2 as ready to start after completing Sprint 1', async ({ page }) => {
      await page.route('**/api/v1/pm/projects/proj-1/sprints', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: {
              sprints: [
                {
                  _id: 'sprint-1',
                  name: 'Sprint 1',
                  status: 'completed',
                  stats: { totalTasks: 1, completedTasks: 1, totalPoints: 5, completedPoints: 5 },
                  progress: 100,
                },
                {
                  _id: 'sprint-2',
                  name: 'Sprint 2',
                  status: 'planning',
                  stats: { totalTasks: 1, completedTasks: 0, totalPoints: 3, completedPoints: 0 },
                  progress: 0,
                },
              ],
            },
          }),
        });
      });

      await page.goto('/projects/proj-1/sprints', { waitUntil: 'domcontentloaded' });
      
      // Sprint 1 should show as completed
      await expect(page.getByTestId('sprint-sprint-1').getByText('Completed')).toBeVisible({ timeout: 5000 });
      
      // Sprint 2 should be ready to start
      await page.getByTestId('sprint-sprint-2').click();
      await expect(page.getByTestId('start-sprint-btn')).toBeVisible({ timeout: 3000 });
    });
  });
});
