/**
 * PM Domain — React Query Key Factories
 */

export const pmKeys = {
  all: ['pm'] as const,

  projects: {
    all: ['pm', 'projects'] as const,
    list: (filters?: Record<string, unknown>) => ['pm', 'projects', 'list', filters] as const,
    detail: (id: string) => ['pm', 'projects', id] as const,
    labels: (id: string) => ['pm', 'projects', id, 'labels'] as const,
    members: (id: string) => ['pm', 'projects', id, 'members'] as const,
  },

  tasks: {
    all: ['pm', 'tasks'] as const,
    list: (projectId: string, filters?: Record<string, unknown>) =>
      ['pm', 'tasks', 'list', projectId, filters] as const,
    detail: (id: string) => ['pm', 'tasks', id] as const,
    board: (projectId: string) => ['pm', 'tasks', 'board', projectId] as const,
    backlog: (projectId: string) => ['pm', 'tasks', 'backlog', projectId] as const,
    myTasks: (filters?: Record<string, unknown>) => ['pm', 'tasks', 'my', filters] as const,
  },

  sprints: {
    all: ['pm', 'sprints'] as const,
    list: (projectId: string) => ['pm', 'sprints', 'list', projectId] as const,
    detail: (id: string) => ['pm', 'sprints', id] as const,
    insights: (id: string) => ['pm', 'sprints', id, 'insights'] as const,
  },

  comments: {
    all: ['pm', 'comments'] as const,
    list: (taskId: string) => ['pm', 'comments', 'list', taskId] as const,
  },

  categories: {
    all: ['pm', 'categories'] as const,
    list: () => ['pm', 'categories', 'list'] as const,
    detail: (id: string) => ['pm', 'categories', id] as const,
  },

  map: {
    view: (projectId: string, filters?: Record<string, unknown>) =>
      ['pm', 'map', 'view', projectId, filters] as const,
  },
} as const;
