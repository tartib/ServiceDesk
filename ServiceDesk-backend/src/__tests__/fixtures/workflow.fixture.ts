/**
 * Workflow Engine Test Fixtures
 */

export const createWorkflowDefinitionPayload = (overrides = {}) => ({
  name: 'Approval Workflow',
  description: 'Simple approval workflow for testing',
  version: 1,
  states: [
    {
      id: 'start',
      name: 'Start',
      type: 'start',
      transitions: [{ target: 'pending_approval', trigger: 'submit' }],
    },
    {
      id: 'pending_approval',
      name: 'Pending Approval',
      type: 'task',
      transitions: [
        { target: 'approved', trigger: 'approve' },
        { target: 'rejected', trigger: 'reject' },
      ],
    },
    {
      id: 'approved',
      name: 'Approved',
      type: 'end',
      transitions: [],
    },
    {
      id: 'rejected',
      name: 'Rejected',
      type: 'end',
      transitions: [],
    },
  ],
  initialState: 'start',
  ...overrides,
});

export const createWorkflowInstancePayload = (overrides = {}) => ({
  entityType: 'service_request',
  entityId: 'sr-test-001',
  ...overrides,
});
