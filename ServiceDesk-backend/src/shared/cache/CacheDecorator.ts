import { CacheManager } from './CacheManager';
import { CacheInvalidationStrategy, CacheKeys } from './CacheInvalidationStrategy';
import logger from '../../utils/logger';

/**
 * Cache decorator for methods
 * Automatically caches method results
 */
export function Cacheable(
  keyGenerator: (...args: unknown[]) => string,
  ttl?: number
) {
  return function (
    target: unknown,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: unknown[]) {
      const cacheKey = keyGenerator(...args);
      const cacheManager = CacheManager.getInstance();

      // Try to get from cache
      const cached = await cacheManager.get(cacheKey);
      if (cached !== null) {
        logger.debug(`Cache hit: ${cacheKey}`);
        return cached;
      }

      // Execute method
      const result = await originalMethod.apply(this, args);

      // Store in cache
      await cacheManager.set(result, cacheKey, ttl);
      logger.debug(`Cache miss, stored: ${cacheKey}`);

      return result;
    };

    return descriptor;
  };
}

/**
 * Cache invalidation decorator
 * Invalidates cache after method execution
 */
export function CacheInvalidate(
  patterns: string | string[]
) {
  return function (
    target: unknown,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: unknown[]) {
      const result = await originalMethod.apply(this, args);

      const invalidationStrategy = CacheInvalidationStrategy.getInstance();
      const patternList = Array.isArray(patterns) ? patterns : [patterns];

      for (const pattern of patternList) {
        await invalidationStrategy.invalidatePattern(pattern);
      }

      logger.debug(`Cache invalidated for patterns: ${patternList.join(', ')}`);

      return result;
    };

    return descriptor;
  };
}

/**
 * Helper function to create cache key generators
 */
export const createCacheKeyGenerator = {
  /**
   * Single parameter key generator
   */
  single: (prefix: string) => (param: unknown) => `${prefix}:${param}`,

  /**
   * Multiple parameters key generator
   */
  multiple: (prefix: string) => (...params: unknown[]) =>
    `${prefix}:${params.join(':')}`,

  /**
   * Object property key generator
   */
  object: (prefix: string, ...properties: string[]) =>
    (obj: Record<string, unknown>) => {
      const values = properties.map(prop => obj[prop]).join(':');
      return `${prefix}:${values}`;
    },

  /**
   * Custom key generator
   */
  custom: (fn: (...args: unknown[]) => string) => fn,
};

/**
 * Example cache key generators using CacheKeys
 */
export const CacheKeyGenerators = {
  formTemplate: (formId: string) => CacheKeys.formTemplate(formId),
  formSubmission: (submissionId: string) => CacheKeys.formSubmission(submissionId),
  formSubmissions: (formId: string, status?: string) =>
    CacheKeys.formSubmissions(formId, status),
  task: (taskId: string) => CacheKeys.task(taskId),
  tasks: (projectId: string, status?: string) => CacheKeys.tasks(projectId, status),
  incident: (incidentId: string) => CacheKeys.incident(incidentId),
  project: (projectId: string) => CacheKeys.project(projectId),
  user: (userId: string) => CacheKeys.user(userId),
};
