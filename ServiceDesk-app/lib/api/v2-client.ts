/**
 * API v2 Client - Domain-based API
 * 
 * Migration utility for frontend to use new v2 endpoints
 */

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

// ============================================================
// V2 API ENDPOINTS
// ============================================================

export const V2_ENDPOINTS = {
  // Core Domain
  core: {
    auth: {
      register: '/api/v2/core/auth/register',
      login: '/api/v2/core/auth/login',
      logout: '/api/v2/core/auth/logout',
      refresh: '/api/v2/core/auth/refresh',
      me: '/api/v2/core/auth/me',
      changePassword: '/api/v2/core/auth/change-password',
    },
    users: {
      list: '/api/v2/core/users',
      byId: (id: string) => `/api/v2/core/users/${id}`,
      search: '/api/v2/core/users/search',
      byRole: (role: string) => `/api/v2/core/users/role/${role}`,
    },
    organizations: {
      list: '/api/v2/core/organizations',
      create: '/api/v2/core/organizations',
      byId: (id: string) => `/api/v2/core/organizations/${id}`,
      switch: (id: string) => `/api/v2/core/organizations/${id}/switch`,
      members: (id: string) => `/api/v2/core/organizations/${id}/members`,
      removeMember: (orgId: string, memberId: string) => 
        `/api/v2/core/organizations/${orgId}/members/${memberId}`,
    },
    teams: {
      list: '/api/v2/core/teams',
      create: '/api/v2/core/teams',
      byId: (id: string) => `/api/v2/core/teams/${id}`,
      members: (id: string) => `/api/v2/core/teams/${id}/members`,
      removeMember: (teamId: string, memberId: string) =>
        `/api/v2/core/teams/${teamId}/members/${memberId}`,
    },
    notifications: {
      list: '/api/v2/core/notifications',
      unread: '/api/v2/core/notifications/unread',
      markRead: (id: string) => `/api/v2/core/notifications/${id}/read`,
      markAllRead: '/api/v2/core/notifications/read-all',
    },
  },

  // OPS Domain (Work Orders)
  ops: {
    workOrders: {
      list: '/api/v2/ops/work-orders',
      create: '/api/v2/ops/work-orders',
      today: '/api/v2/ops/work-orders/today',
      my: '/api/v2/ops/work-orders/my',
      byStatus: (status: string) => `/api/v2/ops/work-orders/status/${status}`,
      byProduct: (productId: string) => `/api/v2/ops/work-orders/product/${productId}`,
      byId: (id: string) => `/api/v2/ops/work-orders/${id}`,
      transition: (id: string) => `/api/v2/ops/work-orders/${id}/transition`,
      assign: (id: string) => `/api/v2/ops/work-orders/${id}/assign`,
    },
  },

  // PM Domain
  pm: {
    projects: {
      list: '/api/v2/pm/projects',
      create: '/api/v2/pm/projects',
      byId: (id: string) => `/api/v2/pm/projects/${id}`,
      archive: (id: string) => `/api/v2/pm/projects/${id}/archive`,
      members: (id: string) => `/api/v2/pm/projects/${id}/members`,
      invite: (id: string) => `/api/v2/pm/projects/${id}/members/invite`,
      updateRole: (projectId: string, memberId: string) =>
        `/api/v2/pm/projects/${projectId}/members/${memberId}/role`,
      removeMember: (projectId: string, memberId: string) =>
        `/api/v2/pm/projects/${projectId}/members/${memberId}`,
    },
    items: {
      list: (projectId: string) => `/api/v2/pm/projects/${projectId}/tasks`,
      board: (projectId: string) => `/api/v2/pm/projects/${projectId}/board`,
      backlog: (projectId: string) => `/api/v2/pm/projects/${projectId}/backlog`,
      create: (projectId: string) => `/api/v2/pm/projects/${projectId}/tasks`,
      byId: (id: string) => `/api/v2/pm/tasks/${id}`,
      transition: (id: string) => `/api/v2/pm/tasks/${id}/transition`,
      move: (id: string) => `/api/v2/pm/tasks/${id}/move`,
    },
    sprints: {
      list: (projectId: string) => `/api/v2/pm/projects/${projectId}/sprints`,
      create: (projectId: string) => `/api/v2/pm/projects/${projectId}/sprints`,
      byId: (id: string) => `/api/v2/pm/sprints/${id}`,
      start: (id: string) => `/api/v2/pm/sprints/${id}/start`,
      complete: (id: string) => `/api/v2/pm/sprints/${id}/complete`,
      insights: (id: string) => `/api/v2/pm/sprints/${id}/insights`,
    },
    comments: {
      list: (taskId: string) => `/api/v2/pm/tasks/${taskId}/comments`,
      create: (taskId: string) => `/api/v2/pm/tasks/${taskId}/comments`,
      update: (id: string) => `/api/v2/pm/comments/${id}`,
      delete: (id: string) => `/api/v2/pm/comments/${id}`,
      react: (id: string) => `/api/v2/pm/comments/${id}/reactions`,
    },
  },

  // SD Domain (Service Desk)
  sd: {
    tickets: {
      incidents: '/api/v2/sd/tickets/incidents',
      problems: '/api/v2/sd/tickets/problems',
      changes: '/api/v2/sd/tickets/changes',
    },
    assets: {
      list: '/api/v2/sd/assets',
      create: '/api/v2/sd/assets',
      lowStock: '/api/v2/sd/assets/low-stock',
      byId: (id: string) => `/api/v2/sd/assets/${id}`,
      restock: (id: string) => `/api/v2/sd/assets/${id}/restock`,
      adjust: (id: string) => `/api/v2/sd/assets/${id}/adjust`,
      history: (id: string) => `/api/v2/sd/assets/${id}/history`,
    },
    catalog: {
      list: '/api/v2/sd/catalog',
      create: '/api/v2/sd/catalog',
      byId: (id: string) => `/api/v2/sd/catalog/${id}`,
    },
  },

  // Analytics Domain
  analytics: {
    dashboards: '/api/v2/analytics/dashboards',
    reports: '/api/v2/analytics/reports',
    search: '/api/v2/analytics/search',
    activity: '/api/v2/analytics/activity',
  },
} as const;

// ============================================================
// MIGRATION MAPPING (v1 → v2)
// ============================================================

export const V1_TO_V2_MAP: Record<string, string> = {
  // Auth
  '/api/v1/auth/register': V2_ENDPOINTS.core.auth.register,
  '/api/v1/auth/login': V2_ENDPOINTS.core.auth.login,
  '/api/v1/auth/me': V2_ENDPOINTS.core.auth.me,
  '/api/v1/pm/auth/register': V2_ENDPOINTS.core.auth.register,
  '/api/v1/pm/auth/login': V2_ENDPOINTS.core.auth.login,
  '/api/v1/pm/auth/me': V2_ENDPOINTS.core.auth.me,

  // Users
  '/api/v1/users': V2_ENDPOINTS.core.users.list,

  // Teams
  '/api/v1/teams': V2_ENDPOINTS.core.teams.list,
  '/api/v1/pm/teams': V2_ENDPOINTS.core.teams.list,

  // Organizations
  '/api/v1/pm/organizations': V2_ENDPOINTS.core.organizations.list,

  // Tasks/Work Orders
  '/api/v1/tasks': V2_ENDPOINTS.ops.workOrders.list,
  '/api/v1/tasks/today': V2_ENDPOINTS.ops.workOrders.today,
  '/api/v1/prep-tasks': V2_ENDPOINTS.ops.workOrders.list,

  // Categories/Catalog
  '/api/v1/categories': V2_ENDPOINTS.sd.catalog.list,

  // Inventory/Assets
  '/api/v1/inventory': V2_ENDPOINTS.sd.assets.list,

  // Reports
  '/api/v1/reports': V2_ENDPOINTS.analytics.reports,
};

// ============================================================
// API CLIENT
// ============================================================

interface RequestOptions extends RequestInit {
  params?: Record<string, string | number | boolean | undefined>;
}

class ApiClient {
  private baseUrl: string;
  private token: string | null = null;
  private organizationId: string | null = null;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  setToken(token: string | null) {
    this.token = token;
  }

  setOrganizationId(orgId: string | null) {
    this.organizationId = orgId;
  }

  private buildUrl(endpoint: string, params?: Record<string, string | number | boolean | undefined>): string {
    const url = new URL(endpoint, this.baseUrl);
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          url.searchParams.append(key, String(value));
        }
      });
    }
    return url.toString();
  }

  private getHeaders(): HeadersInit {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };
    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }
    if (this.organizationId) {
      headers['X-Organization-ID'] = this.organizationId;
    }
    return headers;
  }

  async request<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
    const { params, ...fetchOptions } = options;
    const url = this.buildUrl(endpoint, params);

    const response = await fetch(url, {
      ...fetchOptions,
      headers: {
        ...this.getHeaders(),
        ...fetchOptions.headers,
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Request failed' }));
      throw new Error(error.message || error.error || 'Request failed');
    }

    return response.json();
  }

  async get<T>(endpoint: string, params?: Record<string, string | number | boolean | undefined>): Promise<T> {
    return this.request<T>(endpoint, { method: 'GET', params });
  }

  async post<T>(endpoint: string, data?: unknown): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async put<T>(endpoint: string, data?: unknown): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async patch<T>(endpoint: string, data?: unknown): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async delete<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'DELETE' });
  }
}

// Export singleton instance
export const apiClient = new ApiClient(API_BASE);

// ============================================================
// DOMAIN-SPECIFIC CLIENTS
// ============================================================

export const coreApi = {
  auth: {
    login: (email: string, password: string) =>
      apiClient.post(V2_ENDPOINTS.core.auth.login, { email, password }),
    register: (data: { email: string; password: string; firstName: string; lastName: string }) =>
      apiClient.post(V2_ENDPOINTS.core.auth.register, data),
    me: () => apiClient.get(V2_ENDPOINTS.core.auth.me),
    logout: () => apiClient.post(V2_ENDPOINTS.core.auth.logout),
  },
  users: {
    list: () => apiClient.get(V2_ENDPOINTS.core.users.list),
    getById: (id: string) => apiClient.get(V2_ENDPOINTS.core.users.byId(id)),
    search: (q: string) => apiClient.get(V2_ENDPOINTS.core.users.search, { q }),
  },
  organizations: {
    list: () => apiClient.get(V2_ENDPOINTS.core.organizations.list),
    getById: (id: string) => apiClient.get(V2_ENDPOINTS.core.organizations.byId(id)),
    switch: (id: string) => apiClient.post(V2_ENDPOINTS.core.organizations.switch(id)),
  },
  teams: {
    list: () => apiClient.get(V2_ENDPOINTS.core.teams.list),
    getById: (id: string) => apiClient.get(V2_ENDPOINTS.core.teams.byId(id)),
  },
};

export const opsApi = {
  workOrders: {
    list: () => apiClient.get(V2_ENDPOINTS.ops.workOrders.list),
    today: () => apiClient.get(V2_ENDPOINTS.ops.workOrders.today),
    my: () => apiClient.get(V2_ENDPOINTS.ops.workOrders.my),
    getById: (id: string) => apiClient.get(V2_ENDPOINTS.ops.workOrders.byId(id)),
    transition: (id: string, targetStatus: string, metadata?: Record<string, unknown>) =>
      apiClient.post(V2_ENDPOINTS.ops.workOrders.transition(id), { targetStatus, metadata }),
  },
};

export const pmApi = {
  projects: {
    list: () => apiClient.get(V2_ENDPOINTS.pm.projects.list),
    getById: (id: string) => apiClient.get(V2_ENDPOINTS.pm.projects.byId(id)),
    create: (data: { key: string; name: string; description?: string; methodology?: string }) =>
      apiClient.post(V2_ENDPOINTS.pm.projects.create, data),
  },
  items: {
    list: (projectId: string) => apiClient.get(V2_ENDPOINTS.pm.items.list(projectId)),
    board: (projectId: string) => apiClient.get(V2_ENDPOINTS.pm.items.board(projectId)),
    getById: (id: string) => apiClient.get(V2_ENDPOINTS.pm.items.byId(id)),
    transition: (id: string, statusId: string, comment?: string) =>
      apiClient.post(V2_ENDPOINTS.pm.items.transition(id), { statusId, comment }),
  },
  sprints: {
    list: (projectId: string) => apiClient.get(V2_ENDPOINTS.pm.sprints.list(projectId)),
    getById: (id: string) => apiClient.get(V2_ENDPOINTS.pm.sprints.byId(id)),
    start: (id: string) => apiClient.post(V2_ENDPOINTS.pm.sprints.start(id)),
    complete: (id: string, data?: { moveIncompleteToBacklog?: boolean }) =>
      apiClient.post(V2_ENDPOINTS.pm.sprints.complete(id), data),
  },
};

export const sdApi = {
  assets: {
    list: () => apiClient.get(V2_ENDPOINTS.sd.assets.list),
    lowStock: () => apiClient.get(V2_ENDPOINTS.sd.assets.lowStock),
    getById: (id: string) => apiClient.get(V2_ENDPOINTS.sd.assets.byId(id)),
    restock: (id: string, quantity: number) =>
      apiClient.patch(V2_ENDPOINTS.sd.assets.restock(id), { quantity }),
  },
  catalog: {
    list: () => apiClient.get(V2_ENDPOINTS.sd.catalog.list),
    getById: (id: string) => apiClient.get(V2_ENDPOINTS.sd.catalog.byId(id)),
  },
};

export default apiClient;
