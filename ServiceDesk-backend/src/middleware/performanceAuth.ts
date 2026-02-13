import { Request, Response, NextFunction } from 'express';
import { SystemRole, PerformanceRole, hasPerformancePermission } from '../types/roles';

export const requireRole = (...roles: PerformanceRole[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized - No user found',
      });
    }

    const userRole = (req.user as any).role as SystemRole;
    const hasRequiredRole = roles.some(role => hasPerformancePermission(userRole, role));

    if (!hasRequiredRole) {
      return res.status(403).json({
        success: false,
        error: `Forbidden - Required roles: ${roles.join(', ')}`,
      });
    }

    next();
  };
};

export const requireAuth = (req: Request, res: Response, next: NextFunction) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      error: 'Unauthorized - Authentication required',
    });
  }

  next();
};

export const canViewEmployee = (req: Request, res: Response, next: NextFunction) => {
  const { id } = req.params;
  const userId = req.user?.id;
  const userRole = req.user?.role as SystemRole | undefined;

  if (!userRole) {
    return res.status(403).json({
      success: false,
      error: 'Forbidden - Cannot view this employee',
    });
  }

  // Admin (manager role) can view all employees
  if (hasPerformancePermission(userRole, PerformanceRole.ADMIN)) {
    return next();
  }

  // Manager (supervisor role) can view their own data
  if (hasPerformancePermission(userRole, PerformanceRole.MANAGER) && id === userId) {
    return next();
  }

  // Employee (prep role) can view their own data
  if (id === userId) {
    return next();
  }

  return res.status(403).json({
    success: false,
    error: 'Forbidden - Cannot view this employee',
  });
};

export const canRecordPerformance = (req: Request, res: Response, next: NextFunction) => {
  const userRole = req.user?.role as SystemRole | undefined;

  if (!userRole) {
    return res.status(403).json({
      success: false,
      error: 'Forbidden - Not authenticated',
    });
  }

  // Admin and Manager roles can record performance
  if (
    hasPerformancePermission(userRole, PerformanceRole.ADMIN) ||
    hasPerformancePermission(userRole, PerformanceRole.MANAGER)
  ) {
    return next();
  }

  return res.status(403).json({
    success: false,
    error: 'Forbidden - Only admins and managers can record performance',
  });
};

export const canManageKPIs = (req: Request, res: Response, next: NextFunction) => {
  const userRole = req.user?.role as SystemRole | undefined;

  if (!userRole) {
    return res.status(403).json({
      success: false,
      error: 'Forbidden - Not authenticated',
    });
  }

  // Only Admin role can manage KPIs
  if (hasPerformancePermission(userRole, PerformanceRole.ADMIN)) {
    return next();
  }

  return res.status(403).json({
    success: false,
    error: 'Forbidden - Only admins can manage KPIs',
  });
};

export const canExportReports = (req: Request, res: Response, next: NextFunction) => {
  const userRole = req.user?.role as SystemRole | undefined;

  if (!userRole) {
    return res.status(403).json({
      success: false,
      error: 'Forbidden - Not authenticated',
    });
  }

  // Admin and Manager roles can export reports
  if (
    hasPerformancePermission(userRole, PerformanceRole.ADMIN) ||
    hasPerformancePermission(userRole, PerformanceRole.MANAGER)
  ) {
    return next();
  }

  return res.status(403).json({
    success: false,
    error: 'Forbidden - Only admins and managers can export reports',
  });
};
