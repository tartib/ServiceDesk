/**
 * ITSM Module Test Fixtures
 */

export const createServiceCatalogPayload = (overrides = {}) => ({
  name: 'IT Support',
  description: 'General IT support services',
  category: 'IT',
  status: 'published',
  sla: { responseTime: 4, resolutionTime: 24 },
  ...overrides,
});

export const createServiceRequestPayload = (overrides = {}) => ({
  title: 'New laptop request',
  description: 'Need a new development laptop',
  priority: 'medium',
  category: 'hardware',
  ...overrides,
});

export const createConfigItemPayload = (overrides = {}) => ({
  name: 'Web Server 01',
  type: 'server',
  status: 'active',
  environment: 'production',
  description: 'Primary web server',
  attributes: { os: 'Ubuntu 22.04', ip: '10.0.1.10' },
  ...overrides,
});

export const createCIRelationshipPayload = (overrides = {}) => ({
  type: 'depends_on',
  ...overrides,
});

export const createAutomationRulePayload = (overrides = {}) => ({
  name: 'Auto-assign high priority',
  description: 'Automatically assign high-priority tickets',
  trigger: { event: 'ticket.created', conditions: [{ field: 'priority', operator: 'equals', value: 'high' }] },
  actions: [{ type: 'assign', params: { teamId: 'team-001' } }],
  isActive: true,
  ...overrides,
});
