import { Request, Response, NextFunction } from 'express';
import { trackCacheHit, trackCacheMiss } from './observability';

/**
 * In-Memory Caching Strategy
 * Caches frequently accessed data with TTL support
 */

interface CacheEntry<T> {
  data: T;
  expiresAt: number;
}

class CacheManager {
  private cache: Map<string, CacheEntry<unknown>> = new Map();
  private readonly defaultTTL = 5 * 60 * 1000; // 5 minutes

  /**
   * Get cached value
   */
  get<T>(key: string): T | null {
    const entry = this.cache.get(key);

    if (!entry) {
      trackCacheMiss();
      return null;
    }

    // Check if expired
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      trackCacheMiss();
      return null;
    }

    trackCacheHit();
    return entry.data as T;
  }

  /**
   * Set cache value
   */
  set<T>(key: string, data: T, ttl: number = this.defaultTTL): void {
    this.cache.set(key, {
      data,
      expiresAt: Date.now() + ttl,
    });
  }

  /**
   * Delete cache entry
   */
  delete(key: string): void {
    this.cache.delete(key);
  }

  /**
   * Clear all cache
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Get cache size
   */
  size(): number {
    return this.cache.size;
  }

  /**
   * Clean expired entries
   */
  cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expiresAt) {
        this.cache.delete(key);
      }
    }
  }
}

export const cacheManager = new CacheManager();

/**
 * HTTP Response Caching Middleware
 * Caches GET requests based on URL
 */
export const httpCachingMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  // Only cache GET requests
  if (req.method !== 'GET') {
    return next();
  }

  const cacheKey = `http:${req.originalUrl}`;
  const cachedResponse = cacheManager.get<string>(cacheKey);

  if (cachedResponse) {
    res.setHeader('X-Cache', 'HIT');
    res.send(cachedResponse);
    return;
  }

  // Store original send function
  const originalSend = res.send;

  // Override send to cache response
  res.send = function (data: string | Record<string, unknown>): Response {
    const stringData = typeof data === 'string' ? data : JSON.stringify(data);

    // Only cache successful responses
    if (res.statusCode === 200) {
      cacheManager.set(cacheKey, stringData, 5 * 60 * 1000); // 5 minutes
      res.setHeader('X-Cache', 'MISS');
    }

    return originalSend.call(this, data);
  };

  next();
};

/**
 * Cache invalidation helper
 */
export const invalidateCache = (pattern: string): void => {
  const keys = Array.from((cacheManager as unknown as { cache: Map<string, CacheEntry<unknown>> }).cache.keys());
  keys.forEach((key: string) => {
    if (key.includes(pattern)) {
      cacheManager.delete(key);
    }
  });
};

/**
 * Cache statistics
 */
export const getCacheStats = (): Record<string, unknown> => {
  return {
    size: cacheManager.size(),
    timestamp: new Date().toISOString(),
  };
};
