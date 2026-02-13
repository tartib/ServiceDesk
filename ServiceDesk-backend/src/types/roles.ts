/**
 * Unified Role System
 * Single source of truth for all user roles across the application
 */

export enum SystemRole {
  PREP = 'prep',
  SUPERVISOR = 'supervisor',
  MANAGER = 'manager',
  BACKEND_DEVELOPER = 'backend_developer',
  FRONTEND_DEVELOPER = 'frontend_developer',
  MOBILE_DEVELOPER = 'mobile_developer',
  FULLSTACK_DEVELOPER = 'fullstack_developer',
  SECURITY_ENGINEER = 'security_engineer',
  SRE = 'sre',
  PRODUCT_OWNER = 'product_owner',
  PROJECT_MANAGER = 'project_manager',
  UI_UX = 'ui_ux',
  NETWORK_ENGINEER = 'network_engineer',
  SYSTEM_ENGINEER = 'system_engineer',
  BUSINESS_ANALYST = 'business_analyst',
  QA = 'qa',
}

export enum PerformanceRole {
  ADMIN = 'admin',
  MANAGER = 'manager',
  EMPLOYEE = 'employee',
}

/**
 * Role mapping between system roles and performance roles
 * This allows the performance module to work with system roles
 */
export const roleMapping: Record<SystemRole, PerformanceRole> = {
  [SystemRole.PREP]: PerformanceRole.EMPLOYEE,
  [SystemRole.SUPERVISOR]: PerformanceRole.MANAGER,
  [SystemRole.MANAGER]: PerformanceRole.ADMIN,
  [SystemRole.BACKEND_DEVELOPER]: PerformanceRole.EMPLOYEE,
  [SystemRole.FRONTEND_DEVELOPER]: PerformanceRole.EMPLOYEE,
  [SystemRole.MOBILE_DEVELOPER]: PerformanceRole.EMPLOYEE,
  [SystemRole.FULLSTACK_DEVELOPER]: PerformanceRole.EMPLOYEE,
  [SystemRole.SECURITY_ENGINEER]: PerformanceRole.EMPLOYEE,
  [SystemRole.SRE]: PerformanceRole.EMPLOYEE,
  [SystemRole.PRODUCT_OWNER]: PerformanceRole.MANAGER,
  [SystemRole.PROJECT_MANAGER]: PerformanceRole.MANAGER,
  [SystemRole.UI_UX]: PerformanceRole.EMPLOYEE,
  [SystemRole.NETWORK_ENGINEER]: PerformanceRole.EMPLOYEE,
  [SystemRole.SYSTEM_ENGINEER]: PerformanceRole.EMPLOYEE,
  [SystemRole.BUSINESS_ANALYST]: PerformanceRole.EMPLOYEE,
  [SystemRole.QA]: PerformanceRole.EMPLOYEE,
};

/**
 * Get performance role from system role
 */
export function getPerformanceRole(systemRole: SystemRole): PerformanceRole {
  return roleMapping[systemRole] || PerformanceRole.EMPLOYEE;
}

/**
 * Check if user has performance permission
 */
export function hasPerformancePermission(
  systemRole: SystemRole,
  requiredRole: PerformanceRole
): boolean {
  const userPerformanceRole = getPerformanceRole(systemRole);
  
  const roleHierarchy: Record<PerformanceRole, number> = {
    [PerformanceRole.EMPLOYEE]: 1,
    [PerformanceRole.MANAGER]: 2,
    [PerformanceRole.ADMIN]: 3,
  };

  return roleHierarchy[userPerformanceRole] >= roleHierarchy[requiredRole];
}

export type UserRole = SystemRole | PerformanceRole;
