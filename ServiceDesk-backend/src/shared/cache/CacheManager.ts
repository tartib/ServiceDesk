import logger from '../../utils/logger';

// Redis client type definition
interface RedisClient {
  get(key: string): Promise<string | null>;
  setex(key: string, seconds: number, value: string): Promise<string>;
  del(...keys: string[]): Promise<number>;
  keys(pattern: string): Promise<string[]>;
  flushdb(): Promise<string>;
  exists(key: string): Promise<number>;
  ttl(key: string): Promise<number>;
  expire(key: string, seconds: number): Promise<number>;
  incrby(key: string, increment: number): Promise<number>;
  info(...args: unknown[]): Promise<string>;
  quit(): Promise<string>;
  on(event: string, callback: (arg?: unknown) => void): void;
}

/**
 * Cache Manager for Redis operations
 * Handles get, set, delete, and expiration
 */
export class CacheManager {
  private static instance: CacheManager;
  private redis: RedisClient | null = null;
  private defaultTTL = 3600; // 1 hour in seconds

  private constructor(redisUrl?: string) {
    this.initializeRedis(redisUrl).catch((error) => {
      logger.error('Failed to initialize Redis:', error);
    });
  }

  private async initializeRedis(redisUrl?: string): Promise<void> {
    try {
      // Dynamically import ioredis to avoid hard dependency
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { default: Redis } = await import('ioredis');
      this.redis = new Redis(redisUrl || process.env.REDIS_URL || 'redis://localhost:6379');

      if (this.redis) {
        this.redis.on('connect', () => {
          logger.info('Redis connected');
        });

        this.redis.on('error', (error: unknown) => {
          logger.error('Redis connection error:', error);
        });
      }
    } catch (error) {
      logger.warn('Redis not available, caching disabled:', error);
      this.redis = null;
    }
  }

  static getInstance(redisUrl?: string): CacheManager {
    if (!CacheManager.instance) {
      CacheManager.instance = new CacheManager(redisUrl);
    }
    return CacheManager.instance;
  }

  /**
   * Get value from cache
   */
  async get<T>(key: string): Promise<T | null> {
    if (!this.redis) return null;

    try {
      const value = await this.redis.get(key);
      if (!value) {
        return null;
      }

      return JSON.parse(value) as T;
    } catch (error) {
      logger.error(`Cache get error for key ${key}:`, error);
      return null;
    }
  }

  /**
   * Set value in cache with optional TTL
   */
  async set<T>(key: string, value: T, ttl?: number): Promise<void> {
    if (!this.redis) return;

    try {
      const serialized = JSON.stringify(value);
      const expirationTime = ttl || this.defaultTTL;

      await this.redis.setex(key, expirationTime, serialized);
      logger.debug(`Cache set: ${key} (TTL: ${expirationTime}s)`);
    } catch (error) {
      logger.error(`Cache set error for key ${key}:`, error);
    }
  }

  /**
   * Delete value from cache
   */
  async delete(key: string): Promise<void> {
    if (!this.redis) return;

    try {
      await this.redis.del(key);
      logger.debug(`Cache deleted: ${key}`);
    } catch (error) {
      logger.error(`Cache delete error for key ${key}:`, error);
    }
  }

  /**
   * Delete multiple keys matching a pattern
   */
  async deletePattern(pattern: string): Promise<number> {
    if (!this.redis) return 0;

    try {
      const keys = await this.redis.keys(pattern);
      if (keys.length === 0) {
        return 0;
      }

      const deleted = await this.redis.del(...keys);
      logger.debug(`Cache deleted ${deleted} keys matching pattern: ${pattern}`);
      return deleted;
    } catch (error) {
      logger.error(`Cache delete pattern error for pattern ${pattern}:`, error);
      return 0;
    }
  }

  /**
   * Clear all cache
   */
  async clear(): Promise<void> {
    if (!this.redis) return;

    try {
      await this.redis.flushdb();
      logger.info('Cache cleared');
    } catch (error) {
      logger.error('Cache clear error:', error);
    }
  }

  /**
   * Check if key exists
   */
  async exists(key: string): Promise<boolean> {
    if (!this.redis) return false;

    try {
      const result = await this.redis.exists(key);
      return result === 1;
    } catch (error) {
      logger.error(`Cache exists error for key ${key}:`, error);
      return false;
    }
  }

  /**
   * Get TTL for a key
   */
  async getTTL(key: string): Promise<number> {
    if (!this.redis) return -1;

    try {
      return await this.redis.ttl(key);
    } catch (error) {
      logger.error(`Cache getTTL error for key ${key}:`, error);
      return -1;
    }
  }

  /**
   * Set TTL for an existing key
   */
  async setTTL(key: string, ttl: number): Promise<boolean> {
    if (!this.redis) return false;

    try {
      const result = await this.redis.expire(key, ttl);
      return result === 1;
    } catch (error) {
      logger.error(`Cache setTTL error for key ${key}:`, error);
      return false;
    }
  }

  /**
   * Increment a counter
   */
  async increment(key: string, amount = 1): Promise<number> {
    if (!this.redis) return 0;

    try {
      return await this.redis.incrby(key, amount);
    } catch (error) {
      logger.error(`Cache increment error for key ${key}:`, error);
      return 0;
    }
  }

  /**
   * Get cache statistics
   */
  async getStats(): Promise<Record<string, unknown>> {
    if (!this.redis) return {};

    try {
      const info = await this.redis.info('stats');
      return { info };
    } catch (error) {
      logger.error('Cache getStats error:', error);
      return {};
    }
  }

  /**
   * Close Redis connection
   */
  async close(): Promise<void> {
    if (!this.redis) return;

    try {
      await this.redis.quit();
      logger.info('Redis connection closed');
    } catch (error) {
      logger.error('Redis close error:', error);
    }
  }
}
