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

// ── Incident Fixtures ──

export const createIncidentPayload = (overrides = {}) => ({
  title: 'Email server is down',
  description: 'Users cannot send or receive emails since 9:00 AM today',
  impact: 'high',
  urgency: 'high',
  channel: 'self_service',
  category_id: 'cat-001',
  site_id: 'site-001',
  ...overrides,
});

// ── Change Fixtures ──

export const createChangePayload = (overrides = {}) => ({
  title: 'Upgrade database to v15',
  description: 'Upgrading PostgreSQL from v14 to v15 for performance improvements',
  type: 'normal',
  priority: 'medium',
  impact: 'medium',
  risk: 'medium',
  risk_assessment: 'Moderate risk, tested in staging',
  implementation_plan: 'Step 1: Backup. Step 2: Upgrade. Step 3: Verify.',
  rollback_plan: 'Restore from backup and downgrade',
  reason_for_change: 'Performance optimization',
  site_id: 'site-001',
  affected_services: ['database'],
  schedule: {
    planned_start: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
    planned_end: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000 + 4 * 60 * 60 * 1000).toISOString(),
  },
  ...overrides,
});

// ── Problem Fixtures ──

export const createProblemPayload = (overrides = {}) => ({
  title: 'Recurring email delivery failures',
  description: 'Multiple incidents related to email delivery delays',
  priority: 'high',
  impact: 'high',
  category_id: 'cat-001',
  site_id: 'site-001',
  ...overrides,
});

// ── Release Fixtures ──

export const createReleasePayload = (overrides: Record<string, unknown> = {}) => ({
  release_id: `REL-${Date.now()}`,
  title: 'Q1 Platform Release',
  description: 'Quarterly platform update with bug fixes and features',
  priority: 'medium',
  type: 'minor',
  site_id: 'SITE-001',
  deployment: {
    planned_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    environment: 'production',
    deployment_window: '02:00-06:00 UTC',
  },
  ...overrides,
});

// ── Knowledge Article Fixtures ──

export const createKnowledgeArticlePayload = (overrides = {}) => ({
  title: 'How to Reset Your Password',
  content: 'Step 1: Go to the login page. Step 2: Click "Forgot Password". Step 3: Enter your email.',
  category_id: 'self-help',
  visibility: 'internal',
  tags: ['password', 'self-service'],
  ...overrides,
});
