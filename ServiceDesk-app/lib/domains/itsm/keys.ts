/**
 * ITSM Domain — React Query Key Factories
 *
 * Centralized query key management for all ITSM-related queries.
 * Usage: queryKey: itsmKeys.incidents.list(filters)
 */

export const itsmKeys = {
  all: ['itsm'] as const,

  incidents: {
    all: ['itsm', 'incidents'] as const,
    list: (filters?: Record<string, unknown>) => ['itsm', 'incidents', 'list', filters] as const,
    detail: (id: string) => ['itsm', 'incidents', id] as const,
    stats: () => ['itsm', 'incidents', 'stats'] as const,
    open: () => ['itsm', 'incidents', 'open'] as const,
    breached: () => ['itsm', 'incidents', 'breached'] as const,
    major: () => ['itsm', 'incidents', 'major'] as const,
    myAssignments: () => ['itsm', 'incidents', 'my-assignments'] as const,
    myRequests: () => ['itsm', 'incidents', 'my-requests'] as const,
  },

  problems: {
    all: ['itsm', 'problems'] as const,
    list: (filters?: Record<string, unknown>) => ['itsm', 'problems', 'list', filters] as const,
    detail: (id: string) => ['itsm', 'problems', id] as const,
    stats: () => ['itsm', 'problems', 'stats'] as const,
    knownErrors: () => ['itsm', 'problems', 'known-errors'] as const,
  },

  changes: {
    all: ['itsm', 'changes'] as const,
    list: (filters?: Record<string, unknown>) => ['itsm', 'changes', 'list', filters] as const,
    detail: (id: string) => ['itsm', 'changes', id] as const,
    stats: () => ['itsm', 'changes', 'stats'] as const,
    calendar: (filters?: Record<string, unknown>) => ['itsm', 'changes', 'calendar', filters] as const,
  },

  releases: {
    all: ['itsm', 'releases'] as const,
    list: (filters?: Record<string, unknown>) => ['itsm', 'releases', 'list', filters] as const,
    detail: (id: string) => ['itsm', 'releases', id] as const,
    stats: () => ['itsm', 'releases', 'stats'] as const,
  },

  pirs: {
    all: ['itsm', 'pirs'] as const,
    list: () => ['itsm', 'pirs', 'list'] as const,
    detail: (id: string) => ['itsm', 'pirs', id] as const,
    byIncident: (incidentId: string) => ['itsm', 'pirs', 'incident', incidentId] as const,
  },

  serviceCatalog: {
    all: ['itsm', 'service-catalog'] as const,
    list: (filters?: Record<string, unknown>) => ['itsm', 'service-catalog', 'list', filters] as const,
    detail: (id: string) => ['itsm', 'service-catalog', id] as const,
    categories: () => ['itsm', 'service-catalog', 'categories'] as const,
    featured: () => ['itsm', 'service-catalog', 'featured'] as const,
  },

  serviceRequests: {
    all: ['itsm', 'service-requests'] as const,
    list: (filters?: Record<string, unknown>) => ['itsm', 'service-requests', 'list', filters] as const,
    detail: (id: string) => ['itsm', 'service-requests', id] as const,
  },

  automationRules: {
    all: ['itsm', 'automation-rules'] as const,
    list: () => ['itsm', 'automation-rules', 'list'] as const,
    detail: (id: string) => ['itsm', 'automation-rules', id] as const,
    stats: () => ['itsm', 'automation-rules', 'stats'] as const,
    logs: (ruleId: string) => ['itsm', 'automation-rules', ruleId, 'logs'] as const,
  },

  dashboard: {
    all: ['itsm', 'dashboard'] as const,
    summary: () => ['itsm', 'dashboard', 'summary'] as const,
    incidentKPIs: () => ['itsm', 'dashboard', 'incident-kpis'] as const,
    problemKPIs: () => ['itsm', 'dashboard', 'problem-kpis'] as const,
    changeKPIs: () => ['itsm', 'dashboard', 'change-kpis'] as const,
    slaCompliance: () => ['itsm', 'dashboard', 'sla-compliance'] as const,
    incidentTrend: () => ['itsm', 'dashboard', 'incident-trend'] as const,
  },

  knowledgeDeflection: {
    all: ['itsm', 'knowledge-deflection'] as const,
    stats: () => ['itsm', 'knowledge-deflection', 'stats'] as const,
  },
} as const;
