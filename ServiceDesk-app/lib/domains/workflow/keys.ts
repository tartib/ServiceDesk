/**
 * Workflow Engine Domain — React Query Key Factories
 */

export const workflowKeys = {
  all: ['workflow'] as const,

  definitions: {
    all: ['workflow', 'definitions'] as const,
    list: (filters?: Record<string, unknown>) => ['workflow', 'definitions', 'list', filters] as const,
    detail: (id: string) => ['workflow', 'definitions', id] as const,
    versions: (id: string) => ['workflow', 'definitions', id, 'versions'] as const,
  },

  instances: {
    all: ['workflow', 'instances'] as const,
    list: (filters?: Record<string, unknown>) => ['workflow', 'instances', 'list', filters] as const,
    detail: (id: string) => ['workflow', 'instances', id] as const,
    events: (id: string) => ['workflow', 'instances', id, 'events'] as const,
  },

  externalTasks: {
    all: ['workflow', 'external-tasks'] as const,
    list: (filters?: Record<string, unknown>) => ['workflow', 'external-tasks', 'list', filters] as const,
    detail: (id: string) => ['workflow', 'external-tasks', id] as const,
  },
} as const;
