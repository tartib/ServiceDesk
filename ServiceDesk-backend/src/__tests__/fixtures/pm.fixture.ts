/**
 * PM Module Test Fixtures
 */

export const createProjectPayload = (overrides = {}) => ({
  name: 'Test Project',
  key: 'TP',
  description: 'Project for integration testing',
  ...overrides,
});

export const createTaskPayload = (overrides = {}) => ({
  title: 'Test Task',
  type: 'task',
  priority: 'medium',
  description: 'Task for integration testing',
  ...overrides,
});

export const createSprintPayload = (overrides = {}) => {
  const startDate = new Date();
  const endDate = new Date();
  endDate.setDate(endDate.getDate() + 14);

  return {
    name: 'Sprint 1',
    goal: 'Test sprint goal',
    startDate: startDate.toISOString(),
    endDate: endDate.toISOString(),
    ...overrides,
  };
};

export const createCommentPayload = (overrides = {}) => ({
  content: 'This is a test comment',
  ...overrides,
});
