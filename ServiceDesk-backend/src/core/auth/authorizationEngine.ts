/**
 * Authorization Engine
 * 
 * Evaluates RBAC + ABAC permissions against the unified policy model.
 * Supports role-based, team-based, organization-based, and asset-based checks.
 */

import {
  Permission,
  PermissionPolicy,
  AuthContext,
  ResourceContext,
  AuthResult,
  Action,
  Scope,
  Role,
  ROLE_HIERARCHY,
} from '../../shared/auth/permission.types';
import { allPolicies } from '../../shared/auth/permission.policies';

/**
 * Get all permissions granted to a set of roles
 */
function getPermissionsForRoles(roles: Role[], policies: PermissionPolicy[]): Permission[] {
  const permissions: Permission[] = [];
  for (const policy of policies) {
    if (policy.roles.some((r) => roles.includes(r))) {
      permissions.push(...policy.permissions);
    }
  }
  return permissions;
}

/**
 * Check if a scope is satisfied given auth + resource contexts
 */
function isScopeSatisfied(
  scope: Scope,
  auth: AuthContext,
  resource: ResourceContext
): boolean {
  switch (scope) {
    case 'all':
      return true;

    case 'organization':
      // User must belong to the same organization as the resource
      if (!auth.organizationId) return false;
      if (!resource.organizationId) return true; // resource has no org constraint
      return auth.organizationId === resource.organizationId;

    case 'team':
      // User must be in one of the teams associated with the resource
      const userTeams = auth.teamIds || (auth.teamId ? [auth.teamId] : []);
      if (userTeams.length === 0) return false;
      if (resource.teamId) {
        return userTeams.includes(resource.teamId);
      }
      // If resource has no team, fall back to org check
      if (!auth.organizationId) return false;
      if (!resource.organizationId) return true;
      return auth.organizationId === resource.organizationId;

    case 'project':
      // User must be in the same project
      if (!auth.projectId) return false;
      if (!resource.projectId) return true;
      return auth.projectId === resource.projectId;

    case 'own':
      // For create actions, the user will become the owner — allow it
      if (resource.action === 'create') return true;
      // If no ownership fields are set (e.g. list endpoint), allow —
      // the controller is responsible for filtering to own resources.
      if (!resource.ownerId && !resource.assigneeId && !resource.reporterId) return true;
      // User must be the owner, assignee, or reporter
      return (
        auth.userId === resource.ownerId ||
        auth.userId === resource.assigneeId ||
        auth.userId === resource.reporterId
      );

    default:
      return false;
  }
}

/**
 * Check if permission conditions are satisfied
 */
function areConditionsSatisfied(
  permission: Permission,
  auth: AuthContext,
  resource: ResourceContext
): boolean {
  const conditions = permission.conditions;
  if (!conditions) return true;

  // For ownership conditions on list endpoints (no specific resource loaded),
  // skip the check — the controller handles query scoping.
  if (conditions.isOwner && resource.ownerId !== undefined && auth.userId !== resource.ownerId) {
    return false;
  }

  if (conditions.isAssignee && resource.assigneeId !== undefined && auth.userId !== resource.assigneeId) {
    return false;
  }

  if (conditions.isReporter && resource.reporterId !== undefined && auth.userId !== resource.reporterId) {
    return false;
  }

  if (conditions.statusIn && resource.status) {
    if (!conditions.statusIn.includes(resource.status)) {
      return false;
    }
  }

  if (conditions.statusNotIn && resource.status) {
    if (conditions.statusNotIn.includes(resource.status)) {
      return false;
    }
  }

  if (conditions.typeIn && resource.type) {
    if (!conditions.typeIn.includes(resource.type)) {
      return false;
    }
  }

  return true;
}

/**
 * Main evaluation function.
 * Checks if the given auth context is allowed to perform an action on a resource.
 */
export function evaluate(
  auth: AuthContext,
  resource: ResourceContext,
  policies?: PermissionPolicy[]
): AuthResult {
  const effectivePolicies = policies || allPolicies;
  const userPermissions = getPermissionsForRoles(auth.roles, effectivePolicies);

  // Also include any directly-assigned permissions
  if (auth.permissions) {
    userPermissions.push(...auth.permissions);
  }

  // Find matching permissions for the requested resource + action
  for (const perm of userPermissions) {
    // Resource must match
    if (perm.resource !== resource.resourceType) continue;

    // Action must match ('manage' grants all actions)
    const resourceAction = resource.action;
    if (perm.action !== 'manage' && perm.action !== resourceAction) continue;

    // Scope must be satisfied
    if (!isScopeSatisfied(perm.scope, auth, resource)) continue;

    // Conditions must be satisfied
    if (!areConditionsSatisfied(perm, auth, resource)) continue;

    return {
      allowed: true,
      matchedPermission: perm,
    };
  }

  return {
    allowed: false,
    reason: `No permission found for role(s) [${auth.roles.join(', ')}] to ${resource.action || 'unknown'} ${resource.resourceType}`,
  };
}

/**
 * Check if a role meets a minimum hierarchy level
 */
export function hasMinimumRole(userRoles: Role[], minimumRole: Role): boolean {
  const minLevel = ROLE_HIERARCHY[minimumRole] || 0;
  return userRoles.some((r) => (ROLE_HIERARCHY[r] || 0) >= minLevel);
}

/**
 * Build AuthContext from express req.user
 */
export function buildAuthContext(user: {
  id: string;
  itsmRole: string;
  organizationId?: string;
  teamIds?: string[];
  organizations?: Array<{ organizationId: string; role: string }>;
}): AuthContext {
  const roles: Role[] = [];

  // Add ITSM role (mapped to ServiceDeskRole)
  const itsmToSdRole: Record<string, Role> = {
    admin: 'service_owner',
    manager: 'service_owner',
    cab_member: 'analyst',
    team_lead: 'analyst',
    technician: 'agent',
    end_user: 'end_user',
  };
  const sdRole = itsmToSdRole[user.itsmRole] || 'end_user';
  roles.push(sdRole);

  // Add organization role if available
  if (user.organizationId && user.organizations) {
    const orgMembership = user.organizations.find(
      (o) => o.organizationId === user.organizationId
    );
    if (orgMembership) {
      roles.push(orgMembership.role as Role);
    }
  }

  return {
    userId: user.id,
    organizationId: user.organizationId,
    teamIds: user.teamIds || [],
    teamId: user.teamIds?.[0],
    roles,
  };
}

export default { evaluate, hasMinimumRole, buildAuthContext };
