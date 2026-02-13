export type PerformanceRole = 'admin' | 'manager' | 'employee';

export const canViewPerformance = (userRole: PerformanceRole, targetUserId: string, currentUserId: string): boolean => {
  if (userRole === 'admin') return true;
  if (userRole === 'manager') return true;
  if (userRole === 'employee' && targetUserId === currentUserId) return true;
  return false;
};

export const canRecordPerformance = (userRole: PerformanceRole): boolean => {
  return userRole === 'admin' || userRole === 'manager';
};

export const canManageKPIs = (userRole: PerformanceRole): boolean => {
  return userRole === 'admin';
};

export const canViewLeaderboard = (userRole: PerformanceRole): boolean => {
  return userRole === 'admin' || userRole === 'manager' || userRole === 'employee';
};

export const canExportReports = (userRole: PerformanceRole): boolean => {
  return userRole === 'admin' || userRole === 'manager';
};

export const canViewAlerts = (userRole: PerformanceRole, alertEmployeeId: string, currentUserId: string): boolean => {
  if (userRole === 'admin') return true;
  if (userRole === 'manager') return true;
  if (userRole === 'employee' && alertEmployeeId === currentUserId) return true;
  return false;
};

export const canAcknowledgeAlert = (userRole: PerformanceRole, alertEmployeeId: string, currentUserId: string): boolean => {
  if (userRole === 'admin') return true;
  if (userRole === 'employee' && alertEmployeeId === currentUserId) return true;
  return false;
};

export const getRoleHierarchy = (role: PerformanceRole): number => {
  const hierarchy: Record<PerformanceRole, number> = {
    admin: 3,
    manager: 2,
    employee: 1,
  };
  return hierarchy[role];
};

export const hasHigherOrEqualRole = (userRole: PerformanceRole, requiredRole: PerformanceRole): boolean => {
  return getRoleHierarchy(userRole) >= getRoleHierarchy(requiredRole);
};
