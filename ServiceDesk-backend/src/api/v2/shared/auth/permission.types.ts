/**
 * Authorization Types
 * 
 * RBAC + ABAC permission model
 */

// ============================================================
// PERMISSION DEFINITIONS
// ============================================================

export type Action = 
  | 'create'
  | 'read'
  | 'update'
  | 'delete'
  | 'transition'
  | 'assign'
  | 'manage';

export type Scope = 
  | 'own'           // Only resources owned/assigned to user
  | 'team'          // Resources within user's team
  | 'project'       // Resources within project
  | 'organization'  // All resources in organization
  | 'all';          // System-wide (super admin)

export interface Permission {
  resource: string;
  action: Action;
  scope: Scope;
  conditions?: PermissionCondition;
}

export interface PermissionCondition {
  statusIn?: string[];
  statusNotIn?: string[];
  typeIn?: string[];
  priorityIn?: string[];
  isOwner?: boolean;
  isAssignee?: boolean;
  isReporter?: boolean;
}

// ============================================================
// ROLE DEFINITIONS
// ============================================================

// Organization-level roles
export type OrganizationRole = 'owner' | 'admin' | 'member';

// Project-level roles (PM domain)
export type ProjectRole = 'lead' | 'manager' | 'contributor' | 'member' | 'viewer';

// OPS domain roles
export type OpsRole = 'supervisor' | 'operator';

// SD domain roles (ITIL-aligned)
export type ServiceDeskRole = 'service_owner' | 'analyst' | 'agent' | 'end_user';

// Combined role type
export type Role = OrganizationRole | ProjectRole | OpsRole | ServiceDeskRole;

// ============================================================
// ROLE HIERARCHY
// ============================================================

export const ROLE_HIERARCHY: Record<string, number> = {
  // Organization
  owner: 100,
  admin: 90,
  
  // Project
  lead: 80,
  manager: 70,
  contributor: 50,
  member: 50,
  viewer: 10,
  
  // OPS
  supervisor: 80,
  operator: 40,
  
  // Service Desk
  service_owner: 80,
  analyst: 60,
  agent: 40,
  end_user: 20,
};

// ============================================================
// PERMISSION POLICIES
// ============================================================

export interface PermissionPolicy {
  roles: Role[];
  permissions: Permission[];
}

// ============================================================
// RESOURCE TYPES
// ============================================================

export const RESOURCES = {
  // Core
  USER: 'user',
  ORGANIZATION: 'organization',
  TEAM: 'team',
  
  // OPS
  WORK_ORDER: 'work-order',
  SCHEDULE: 'schedule',
  PRODUCT: 'product',
  
  // PM
  PROJECT: 'project',
  WORK_ITEM: 'work-item',
  SPRINT: 'sprint',
  COMMENT: 'comment',
  
  // SD
  TICKET: 'ticket',
  ASSET: 'asset',
  CATALOG: 'catalog',
  SLA: 'sla',
} as const;

export type Resource = typeof RESOURCES[keyof typeof RESOURCES];

// ============================================================
// AUTHORIZATION CONTEXT
// ============================================================

export interface AuthContext {
  userId: string;
  organizationId?: string;
  projectId?: string;
  teamId?: string;
  roles: Role[];
  permissions?: Permission[];
}

export interface ResourceContext {
  resourceType: Resource;
  resourceId?: string;
  ownerId?: string;
  assigneeId?: string;
  reporterId?: string;
  projectId?: string;
  organizationId?: string;
  status?: string;
  type?: string;
}

// ============================================================
// AUTHORIZATION RESULT
// ============================================================

export interface AuthResult {
  allowed: boolean;
  reason?: string;
  matchedPermission?: Permission;
}
