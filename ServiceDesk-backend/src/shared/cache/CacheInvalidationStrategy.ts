import { CacheManager } from './CacheManager';
import logger from '../../utils/logger';

/**
 * Cache Invalidation Strategy
 * Manages cache invalidation patterns and dependencies
 */
export class CacheInvalidationStrategy {
  private static instance: CacheInvalidationStrategy;
  private cacheManager: CacheManager;
  private invalidationMap: Map<string, string[]> = new Map();

  private constructor() {
    this.cacheManager = CacheManager.getInstance();
  }

  static getInstance(): CacheInvalidationStrategy {
    if (!CacheInvalidationStrategy.instance) {
      CacheInvalidationStrategy.instance = new CacheInvalidationStrategy();
    }
    return CacheInvalidationStrategy.instance;
  }

  /**
   * Register cache dependencies
   * When a key is invalidated, all dependent keys are also invalidated
   */
  registerDependency(parentKey: string, dependentKey: string): void {
    if (!this.invalidationMap.has(parentKey)) {
      this.invalidationMap.set(parentKey, []);
    }

    const dependents = this.invalidationMap.get(parentKey)!;
    if (!dependents.includes(dependentKey)) {
      dependents.push(dependentKey);
    }

    logger.debug(`Cache dependency registered: ${parentKey} -> ${dependentKey}`);
  }

  /**
   * Invalidate a cache key and all dependent keys
   */
  async invalidate(key: string): Promise<void> {
    await this.cacheManager.delete(key);

    // Invalidate dependent keys
    const dependents = this.invalidationMap.get(key) || [];
    for (const dependentKey of dependents) {
      await this.invalidate(dependentKey);
    }

    logger.info(`Cache invalidated: ${key} and ${dependents.length} dependent keys`);
  }

  /**
   * Invalidate cache by pattern
   */
  async invalidatePattern(pattern: string): Promise<number> {
    const deleted = await this.cacheManager.deletePattern(pattern);
    logger.info(`Cache invalidated by pattern: ${pattern} (${deleted} keys deleted)`);
    return deleted;
  }

  /**
   * Invalidate all cache for a domain
   */
  async invalidateDomain(domain: string): Promise<number> {
    return this.invalidatePattern(`${domain}:*`);
  }

  /**
   * Invalidate cache for a specific entity
   */
  async invalidateEntity(domain: string, entityId: string): Promise<number> {
    return this.invalidatePattern(`${domain}:${entityId}:*`);
  }

  /**
   * Get all dependencies for a key
   */
  getDependencies(key: string): string[] {
    return this.invalidationMap.get(key) || [];
  }

  /**
   * Clear all invalidation mappings
   */
  clearMappings(): void {
    this.invalidationMap.clear();
    logger.info('Cache invalidation mappings cleared');
  }
}

/**
 * Common cache key patterns
 */
export const CacheKeys = {
  // Form cache keys
  formTemplate: (formId: string) => `form:template:${formId}`,
  formSubmission: (submissionId: string) => `form:submission:${submissionId}`,
  formSubmissions: (formId: string, status?: string) =>
    `form:submissions:${formId}${status ? `:${status}` : ''}`,
  formStats: (formId: string) => `form:stats:${formId}`,

  // Task cache keys
  task: (taskId: string) => `task:${taskId}`,
  tasks: (projectId: string, status?: string) =>
    `task:list:${projectId}${status ? `:${status}` : ''}`,
  taskStats: (projectId: string) => `task:stats:${projectId}`,

  // Incident cache keys
  incident: (incidentId: string) => `incident:${incidentId}`,
  incidents: (status?: string) => `incident:list${status ? `:${status}` : ''}`,
  incidentStats: () => 'incident:stats',

  // Project cache keys
  project: (projectId: string) => `project:${projectId}`,
  projects: (userId?: string) => `project:list${userId ? `:${userId}` : ''}`,
  projectMembers: (projectId: string) => `project:members:${projectId}`,

  // User cache keys
  user: (userId: string) => `user:${userId}`,
  userPermissions: (userId: string) => `user:permissions:${userId}`,

  // Analytics cache keys
  dashboard: (userId: string) => `dashboard:${userId}`,
  report: (reportId: string) => `report:${reportId}`,
  analytics: (domain: string) => `analytics:${domain}`,
};
