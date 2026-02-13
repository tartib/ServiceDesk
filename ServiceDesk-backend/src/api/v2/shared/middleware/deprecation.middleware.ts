/**
 * Deprecation Middleware
 * 
 * Adds deprecation headers to v1 routes and logs usage for monitoring
 */

/// <reference path="../../../../types/express.d.ts" />
import { Request, Response, NextFunction } from 'express';
import logger from '../../../../utils/logger';

interface DeprecationConfig {
  sunsetDate: string;           // ISO date when v1 will be removed
  successorPath: string;        // The v2 replacement path
  logUsage?: boolean;           // Whether to log deprecated API usage
}

// Mapping of deprecated paths to their v2 replacements
export const deprecationMap: Record<string, DeprecationConfig> = {
  // Auth routes
  '/api/v1/auth': {
    sunsetDate: '2025-06-01',
    successorPath: '/api/v2/core/auth',
  },
  '/api/v1/pm/auth': {
    sunsetDate: '2025-06-01',
    successorPath: '/api/v2/core/auth',
  },
  
  // User routes
  '/api/v1/users': {
    sunsetDate: '2025-06-01',
    successorPath: '/api/v2/core/users',
  },
  
  // Team routes
  '/api/v1/teams': {
    sunsetDate: '2025-06-01',
    successorPath: '/api/v2/core/teams',
  },
  '/api/v1/pm/teams': {
    sunsetDate: '2025-06-01',
    successorPath: '/api/v2/core/teams',
  },
  
  // OPS routes (tasks → work-orders)
  '/api/v1/tasks': {
    sunsetDate: '2025-06-01',
    successorPath: '/api/v2/ops/work-orders',
  },
  '/api/v1/prep-tasks': {
    sunsetDate: '2025-06-01',
    successorPath: '/api/v2/ops/work-orders',
  },
  
  // PM routes
  '/api/v1/pm/organizations': {
    sunsetDate: '2025-06-01',
    successorPath: '/api/v2/core/organizations',
  },
  '/api/v1/pm/projects': {
    sunsetDate: '2025-06-01',
    successorPath: '/api/v2/pm/projects',
  },
  '/api/v1/pm/sprints': {
    sunsetDate: '2025-06-01',
    successorPath: '/api/v2/pm/sprints',
  },
  '/api/v1/pm/boards': {
    sunsetDate: '2025-06-01',
    successorPath: '/api/v2/pm/boards',
  },
  '/api/v1/pm/tasks': {
    sunsetDate: '2025-06-01',
    successorPath: '/api/v2/pm/tasks',
  },
  
  // SD routes
  '/api/v1/categories': {
    sunsetDate: '2025-06-01',
    successorPath: '/api/v2/sd/catalog',
  },
  '/api/v1/inventory': {
    sunsetDate: '2025-06-01',
    successorPath: '/api/v2/sd/assets',
  },
  '/api/v1/assets': {
    sunsetDate: '2025-06-01',
    successorPath: '/api/v2/sd/assets',
  },
  '/api/v1/service-requests': {
    sunsetDate: '2025-06-01',
    successorPath: '/api/v2/sd/requests',
  },
  '/api/v1/incidents': {
    sunsetDate: '2025-06-01',
    successorPath: '/api/v2/sd/incidents',
  },
  '/api/v1/problems': {
    sunsetDate: '2025-06-01',
    successorPath: '/api/v2/sd/problems',
  },
  '/api/v1/changes': {
    sunsetDate: '2025-06-01',
    successorPath: '/api/v2/sd/changes',
  },
  
  // Knowledge base
  '/api/v1/knowledge': {
    sunsetDate: '2025-06-01',
    successorPath: '/api/v2/sd/knowledge',
  },
  
  // Forms routes
  '/api/v1/forms': {
    sunsetDate: '2025-06-01',
    successorPath: '/api/v2/forms',
  },
  
  // File Storage routes
  '/api/v1/files': {
    sunsetDate: '2025-06-01',
    successorPath: '/api/v2/storage/files',
  },
  '/api/v1/folders': {
    sunsetDate: '2025-06-01',
    successorPath: '/api/v2/storage/folders',
  },
  
  // Reports
  '/api/v1/reports': {
    sunsetDate: '2025-06-01',
    successorPath: '/api/v2/analytics/reports',
  },
  
  // Additional routes
  '/api/v1/alerts': {
    sunsetDate: '2025-06-01',
    successorPath: '/api/v2/sd/alerts',
  },
  '/api/v1/kpi': {
    sunsetDate: '2025-06-01',
    successorPath: '/api/v2/analytics/kpi',
  },
  '/api/v1/performance': {
    sunsetDate: '2025-06-01',
    successorPath: '/api/v2/analytics/performance',
  },
  '/api/v1/leaderboard': {
    sunsetDate: '2025-06-01',
    successorPath: '/api/v2/analytics/leaderboard',
  },
  '/api/v1/rating': {
    sunsetDate: '2025-06-01',
    successorPath: '/api/v2/sd/ratings',
  },
  '/api/v1/employee': {
    sunsetDate: '2025-06-01',
    successorPath: '/api/v2/core/employees',
  },
};

/**
 * Creates deprecation middleware for a specific base path
 */
export function createDeprecationMiddleware(basePath: string) {
  const config = deprecationMap[basePath];
  
  return (req: Request, res: Response, next: NextFunction) => {
    if (config) {
      // Add deprecation headers per RFC 8594
      res.setHeader('Deprecation', 'true');
      res.setHeader('Sunset', config.sunsetDate);
      res.setHeader(
        'Link',
        `<${config.successorPath}>; rel="successor-version"`
      );
      
      // Log deprecated usage
      logger.warn('Deprecated API usage', {
        deprecatedPath: req.originalUrl,
        method: req.method,
        successorPath: config.successorPath,
        sunsetDate: config.sunsetDate,
        userAgent: req.headers['user-agent'],
        userId: req.user?.id,
      });
    }
    
    next();
  };
}

/**
 * Global deprecation middleware that checks all v1 routes
 */
export function globalDeprecationMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
) {
  // Find matching deprecated path
  const matchingPath = Object.keys(deprecationMap).find(path =>
    req.originalUrl.startsWith(path)
  );
  
  if (matchingPath) {
    const config = deprecationMap[matchingPath];
    
    // Add deprecation headers
    res.setHeader('Deprecation', 'true');
    res.setHeader('Sunset', config.sunsetDate);
    res.setHeader(
      'Link',
      `<${config.successorPath}>; rel="successor-version"`
    );
  }
  
  next();
}

export default globalDeprecationMiddleware;
