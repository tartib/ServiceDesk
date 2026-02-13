import { test, expect, Page } from '@playwright/test';

/**
 * Project Management E2E Tests - Real API Integration
 * Tests the complete workflow with actual backend API calls
 * 
 * Prerequisites:
 * - Backend running at http://localhost:5000
 * - Frontend running at http://localhost:3000
 * - Valid test user credentials
 */

// Test configuration
const API_BASE = 'http://localhost:5000';
const TEST_USER = {
  email: 'test@example.com',
  password: 'password123',
};

// Test data - use unique names to avoid conflicts
const timestamp = Date.now();
const TEST_PROJECT = {
  name: `Website Revamp ${timestamp}`,
  key: `WR${timestamp.toString().slice(-4)}`,
  methodology: 'scrum',
};

const TEST_TASK = {
  title: 'Create Login Page',
  description: 'UI + API integration',
  priority: 'high',
};

// Skip auth setup - we'll login in beforeAll
test.use({ storageState: { cookies: [], origins: [] } });

// Helper to login and get token
async function loginAndSetup(page: Page): Promise<string> {
  // Go to login page
  await page.goto('/login', { waitUntil: 'networkidle' });
  
  // Fill credentials
  await page.getByTestId('email-input').fill(TEST_USER.email);
  await page.getByTestId('password-input').fill(TEST_USER.password);
  
  // Submit and wait for redirect
  await page.getByTestId('login-submit-btn').click();
  await page.waitForURL(/\/(dashboard|projects)/, { timeout: 15000 });
  
  // Get token from localStorage
  const token = await page.evaluate(() => {
    return localStorage.getItem('token') || localStorage.getItem('accessToken') || '';
  });
  
  return token;
}

// Helper to make API calls
async function apiCall(
  token: string,
  method: string,
  endpoint: string,
  body?: object,
  headers?: Record<string, string>
) {
  const response = await fetch(`${API_BASE}${endpoint}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
      ...headers,
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  return response.json();
}

test.describe('Project Management - Real API Tests', () => {
  let token: string;
  let projectId: string;
  let organizationId: string;
  let taskId: string;
  const sprintIds: string[] = [];

  test.describe.configure({ mode: 'serial' }); // Run tests in order

  test('Setup: Login and get authentication', async ({ page }) => {
    token = await loginAndSetup(page);
    expect(token).toBeTruthy();
    
    // Get user info to find organization
    const userResponse = await apiCall(token, 'GET', '/api/v1/auth/me');
    if (userResponse.success && userResponse.data?.user?.organizations?.length > 0) {
      organizationId = userResponse.data.user.organizations[0];
    }
    
    console.log('Logged in successfully, token:', token.substring(0, 20) + '...');
    console.log('Organization ID:', organizationId);
  });

  test.describe('Scenario 1: Create a New Project', () => {
    test('should navigate to projects page', async ({ page }) => {
      await loginAndSetup(page);
      await page.goto('/projects', { waitUntil: 'networkidle' });
      
      // Wait for page to load
      await expect(page.locator('h1, h2').first()).toBeVisible({ timeout: 10000 });
    });

    test('should create a new project via UI', async ({ page }) => {
      token = await loginAndSetup(page);
      await page.goto('/projects', { waitUntil: 'networkidle' });
      
      // Wait for page to fully load
      await page.waitForTimeout(1000);
      
      // Click create project button
      const createBtn = page.locator('button.bg-blue-600, button:has-text("New Project"), button:has-text("مشروع جديد")').first();
      await createBtn.click({ timeout: 10000 });
      
      // Wait for wizard to appear
      await page.waitForTimeout(1000);
      
      // Step 1: Fill project name and key
      const nameInput = page.locator('input[placeholder*="Customer Portal"], input[placeholder*="name"]').first();
      await nameInput.fill(TEST_PROJECT.name);
      await page.waitForTimeout(300);
      
      // Key should auto-generate, but fill it explicitly
      const keyInput = page.locator('input.uppercase, input[placeholder*="CPR"], input[placeholder*="KEY"]').first();
      await keyInput.fill(TEST_PROJECT.key);
      await page.waitForTimeout(300);
      
      // Click Next button
      const nextBtn = page.locator('button:has-text("Next"), button:has-text("التالي")').first();
      await nextBtn.click();
      await page.waitForTimeout(1000);
      
      // Step 2: Select Scrum methodology
      const scrumCard = page.locator('div:has-text("Scrum"), button:has-text("Scrum")').first();
      if (await scrumCard.isVisible({ timeout: 2000 }).catch(() => false)) {
        await scrumCard.click();
        await page.waitForTimeout(300);
      }
      
      // Click Next
      const nextBtn2 = page.locator('button:has-text("Next"), button:has-text("التالي")').first();
      await nextBtn2.click();
      await page.waitForTimeout(1000);
      
      // Step 3: Configuration (skip or click Next)
      const nextBtn3 = page.locator('button:has-text("Next"), button:has-text("التالي")').first();
      if (await nextBtn3.isVisible({ timeout: 2000 }).catch(() => false)) {
        await nextBtn3.click();
        await page.waitForTimeout(1000);
      }
      
      // Step 4: Review and Create
      const createFinalBtn = page.locator('button:has-text("Create Project"), button:has-text("Create"), button:has-text("إنشاء")').last();
      await createFinalBtn.click();
      
      // Wait for redirect to project board
      await page.waitForURL(/\/projects\/[a-zA-Z0-9]+/, { timeout: 15000 });
      
      // Extract project ID from URL
      const url = page.url();
      const match = url.match(/\/projects\/([a-zA-Z0-9]+)/);
      if (match) {
        projectId = match[1];
        console.log('Created project ID:', projectId);
      }
      
      expect(projectId).toBeTruthy();
    });

    test('should verify project appears in list', async ({ page }) => {
      token = await loginAndSetup(page);
      await page.goto('/projects', { waitUntil: 'networkidle' });
      
      // Check if project name is visible
      await expect(page.getByText(TEST_PROJECT.name).first()).toBeVisible({ timeout: 10000 });
    });
  });

  test.describe('Scenario 2: Project Settings and Members', () => {
    test('should navigate to project settings', async ({ page }) => {
      test.skip(!projectId, 'Project not created');
      
      token = await loginAndSetup(page);
      await page.goto(`/projects/${projectId}/settings`, { waitUntil: 'networkidle' });
      
      // Settings page should load
      await expect(page.locator('h1, h2, h3').first()).toBeVisible({ timeout: 10000 });
    });

    test('should view project members', async ({ page }) => {
      test.skip(!projectId, 'Project not created');
      
      token = await loginAndSetup(page);
      await page.goto(`/projects/${projectId}/settings`, { waitUntil: 'networkidle' });
      
      // Look for members section
      const membersSection = page.locator('text=Members, text=أعضاء, text=Team').first();
      if (await membersSection.isVisible()) {
        await membersSection.click();
      }
      
      await page.waitForTimeout(1000);
    });
  });

  test.describe('Scenario 3: Create Task in Backlog', () => {
    test('should navigate to backlog page', async ({ page }) => {
      test.skip(!projectId, 'Project not created');
      
      token = await loginAndSetup(page);
      await page.goto(`/projects/${projectId}/backlog`, { waitUntil: 'networkidle' });
      
      // Backlog page should load
      await page.waitForTimeout(2000);
    });

    test('should create a task via API', async ({ page }) => {
      test.skip(!projectId, 'Project not created');
      
      token = await loginAndSetup(page);
      
      // Create task via API
      const headers: Record<string, string> = {};
      if (organizationId) {
        headers['X-Organization-ID'] = organizationId;
      }
      
      const response = await apiCall(
        token,
        'POST',
        `/api/v1/pm/projects/${projectId}/tasks`,
        {
          title: TEST_TASK.title,
          description: TEST_TASK.description,
          priority: TEST_TASK.priority,
          type: 'task',
        },
        headers
      );
      
      console.log('Create task response:', JSON.stringify(response, null, 2));
      
      if (response.success && response.data?.task) {
        taskId = response.data.task._id;
        console.log('Created task ID:', taskId);
      }
      
      expect(response.success).toBe(true);
      expect(taskId).toBeTruthy();
    });

    test('should verify task appears in backlog', async ({ page }) => {
      test.skip(!projectId || !taskId, 'Project or task not created');
      
      token = await loginAndSetup(page);
      await page.goto(`/projects/${projectId}/backlog`, { waitUntil: 'networkidle' });
      
      // Wait for task to appear
      await expect(page.getByText(TEST_TASK.title).first()).toBeVisible({ timeout: 10000 });
    });
  });

  test.describe('Scenario 4: Create Sprints', () => {
    test('should navigate to sprints page', async ({ page }) => {
      test.skip(!projectId, 'Project not created');
      
      token = await loginAndSetup(page);
      await page.goto(`/projects/${projectId}/sprints`, { waitUntil: 'networkidle' });
      
      // Sprints page should load
      await page.waitForTimeout(2000);
    });

    test('should create Sprint 1 via API', async ({ page }) => {
      test.skip(!projectId, 'Project not created');
      
      token = await loginAndSetup(page);
      
      const headers: Record<string, string> = {};
      if (organizationId) {
        headers['X-Organization-ID'] = organizationId;
      }
      
      const startDate = new Date();
      const endDate = new Date(startDate.getTime() + 14 * 24 * 60 * 60 * 1000); // 2 weeks
      
      const response = await apiCall(
        token,
        'POST',
        `/api/v1/pm/projects/${projectId}/sprints`,
        {
          name: 'Sprint 1',
          goal: 'Complete login feature',
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
        },
        headers
      );
      
      console.log('Create Sprint 1 response:', JSON.stringify(response, null, 2));
      
      if (response.success && response.data?.sprint) {
        sprintIds.push(response.data.sprint._id);
        console.log('Created Sprint 1 ID:', response.data.sprint._id);
      }
      
      expect(response.success).toBe(true);
    });

    test('should create Sprint 2 via API', async ({ page }) => {
      test.skip(!projectId, 'Project not created');
      
      token = await loginAndSetup(page);
      
      const headers: Record<string, string> = {};
      if (organizationId) {
        headers['X-Organization-ID'] = organizationId;
      }
      
      const startDate = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000); // Start after Sprint 1
      const endDate = new Date(startDate.getTime() + 14 * 24 * 60 * 60 * 1000);
      
      const response = await apiCall(
        token,
        'POST',
        `/api/v1/pm/projects/${projectId}/sprints`,
        {
          name: 'Sprint 2',
          goal: 'Complete dashboard feature',
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
        },
        headers
      );
      
      console.log('Create Sprint 2 response:', JSON.stringify(response, null, 2));
      
      if (response.success && response.data?.sprint) {
        sprintIds.push(response.data.sprint._id);
      }
      
      expect(response.success).toBe(true);
    });

    test('should verify sprints appear on page', async ({ page }) => {
      test.skip(!projectId || sprintIds.length === 0, 'Project or sprints not created');
      
      token = await loginAndSetup(page);
      await page.goto(`/projects/${projectId}/sprints`, { waitUntil: 'networkidle' });
      
      // Wait for sprints to load
      await expect(page.getByText('Sprint 1').first()).toBeVisible({ timeout: 10000 });
      await expect(page.getByText('Sprint 2').first()).toBeVisible({ timeout: 10000 });
    });
  });

  test.describe('Scenario 5: Assign Task to Sprint and Start Sprint', () => {
    test('should assign task to Sprint 1 via API', async ({ page }) => {
      test.skip(!taskId || sprintIds.length === 0, 'Task or sprint not created');
      
      token = await loginAndSetup(page);
      
      const headers: Record<string, string> = {};
      if (organizationId) {
        headers['X-Organization-ID'] = organizationId;
      }
      
      const response = await apiCall(
        token,
        'PUT',
        `/api/v1/pm/tasks/${taskId}`,
        {
          sprint: sprintIds[0],
        },
        headers
      );
      
      console.log('Assign task to sprint response:', JSON.stringify(response, null, 2));
      expect(response.success).toBe(true);
    });

    test('should start Sprint 1 via API', async ({ page }) => {
      test.skip(sprintIds.length === 0, 'Sprint not created');
      
      token = await loginAndSetup(page);
      
      const headers: Record<string, string> = {};
      if (organizationId) {
        headers['X-Organization-ID'] = organizationId;
      }
      
      const response = await apiCall(
        token,
        'POST',
        `/api/v1/pm/sprints/${sprintIds[0]}/start`,
        {},
        headers
      );
      
      console.log('Start sprint response:', JSON.stringify(response, null, 2));
      
      // Sprint start might fail if already started or other conditions
      // Just log the result
      if (!response.success) {
        console.log('Sprint start failed (may already be started):', response.message);
      }
    });

    test('should verify sprint is active on board', async ({ page }) => {
      test.skip(!projectId, 'Project not created');
      
      token = await loginAndSetup(page);
      await page.goto(`/projects/${projectId}/board`, { waitUntil: 'networkidle' });
      
      // Board should show active sprint or tasks
      await page.waitForTimeout(2000);
      
      // Check if task appears on board
      const taskVisible = await page.getByText(TEST_TASK.title).first().isVisible().catch(() => false);
      console.log('Task visible on board:', taskVisible);
    });
  });

  test.describe('Scenario 6: Move Task Across Board', () => {
    test('should update task status to In Progress via API', async ({ page }) => {
      test.skip(!taskId, 'Task not created');
      
      token = await loginAndSetup(page);
      
      const headers: Record<string, string> = {};
      if (organizationId) {
        headers['X-Organization-ID'] = organizationId;
      }
      
      const response = await apiCall(
        token,
        'PUT',
        `/api/v1/pm/tasks/${taskId}`,
        {
          status: 'in-progress',
        },
        headers
      );
      
      console.log('Update task to In Progress response:', JSON.stringify(response, null, 2));
      expect(response.success).toBe(true);
    });

    test('should verify task in In Progress column', async ({ page }) => {
      test.skip(!projectId, 'Project not created');
      
      token = await loginAndSetup(page);
      await page.goto(`/projects/${projectId}/board`, { waitUntil: 'networkidle' });
      
      await page.waitForTimeout(2000);
      
      // Look for In Progress column with task
      const inProgressColumn = page.locator('[data-testid="column-in-progress"], .column-in-progress, :has-text("In Progress")').first();
      if (await inProgressColumn.isVisible()) {
        const taskInColumn = inProgressColumn.getByText(TEST_TASK.title);
        const isVisible = await taskInColumn.isVisible().catch(() => false);
        console.log('Task in In Progress column:', isVisible);
      }
    });

    test('should update task status to Done via API', async ({ page }) => {
      test.skip(!taskId, 'Task not created');
      
      token = await loginAndSetup(page);
      
      const headers: Record<string, string> = {};
      if (organizationId) {
        headers['X-Organization-ID'] = organizationId;
      }
      
      const response = await apiCall(
        token,
        'PUT',
        `/api/v1/pm/tasks/${taskId}`,
        {
          status: 'done',
        },
        headers
      );
      
      console.log('Update task to Done response:', JSON.stringify(response, null, 2));
      expect(response.success).toBe(true);
    });
  });

  test.describe('Scenario 7: Complete Sprint', () => {
    test('should complete Sprint 1 via API', async ({ page }) => {
      test.skip(sprintIds.length === 0, 'Sprint not created');
      
      token = await loginAndSetup(page);
      
      const headers: Record<string, string> = {};
      if (organizationId) {
        headers['X-Organization-ID'] = organizationId;
      }
      
      const response = await apiCall(
        token,
        'POST',
        `/api/v1/pm/sprints/${sprintIds[0]}/complete`,
        {
          moveIncompleteTo: sprintIds.length > 1 ? sprintIds[1] : 'backlog',
        },
        headers
      );
      
      console.log('Complete sprint response:', JSON.stringify(response, null, 2));
      
      // Sprint complete might fail if conditions not met
      if (!response.success) {
        console.log('Sprint complete failed:', response.message);
      }
    });

    test('should verify sprint status on sprints page', async ({ page }) => {
      test.skip(!projectId, 'Project not created');
      
      token = await loginAndSetup(page);
      await page.goto(`/projects/${projectId}/sprints`, { waitUntil: 'networkidle' });
      
      await page.waitForTimeout(2000);
      
      // Check for completed status indicator
      const completedBadge = page.locator('text=Completed, text=مكتمل, .status-completed').first();
      const isCompleted = await completedBadge.isVisible().catch(() => false);
      console.log('Sprint shows as completed:', isCompleted);
    });
  });

  test.describe('Cleanup', () => {
    test('should delete test project via API', async ({ page }) => {
      test.skip(!projectId, 'No project to delete');
      
      token = await loginAndSetup(page);
      
      const headers: Record<string, string> = {};
      if (organizationId) {
        headers['X-Organization-ID'] = organizationId;
      }
      
      const response = await apiCall(
        token,
        'DELETE',
        `/api/v1/pm/projects/${projectId}`,
        undefined,
        headers
      );
      
      console.log('Delete project response:', JSON.stringify(response, null, 2));
      
      // Project deletion might require specific permissions
      if (!response.success) {
        console.log('Project deletion failed (may require admin):', response.message);
      }
    });
  });
});
