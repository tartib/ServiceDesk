/**
 * Feature Flag Service
 *
 * Singleton service that manages feature flags with:
 * - MongoDB persistence (primary)
 * - Redis cache (5-minute TTL)
 * - In-memory defaults fallback (when DB unavailable)
 */

import { FeatureFlag, FeatureFlagCategory, FeatureFlagContext, FeatureFlagUpdate } from './types';
import { defaultFlags } from './flags';
import logger from '../../utils/logger';

// Lazy-loaded to avoid circular dependencies at module load time
let FeatureFlagModel: any = null;
let redisClient: any = null;

const CACHE_KEY = 'feature_flags:all';
const CACHE_TTL = 300; // 5 minutes

function getModel() {
  if (!FeatureFlagModel) {
    FeatureFlagModel = require('../../models/FeatureFlag').default;
  }
  return FeatureFlagModel;
}

async function getRedis() {
  if (redisClient === null) {
    try {
      const { CacheManager } = require('../cache');
      redisClient = CacheManager.getInstance?.()?.getClient?.() || false;
    } catch {
      redisClient = false;
    }
  }
  return redisClient || null;
}

class FeatureFlagService {
  private static instance: FeatureFlagService;
  private memoryCache: Map<string, FeatureFlag> = new Map();
  private lastSync: number = 0;

  private constructor() {
    // Load defaults into memory cache
    for (const flag of defaultFlags) {
      this.memoryCache.set(flag.name, { ...flag });
    }
  }

  static getInstance(): FeatureFlagService {
    if (!FeatureFlagService.instance) {
      FeatureFlagService.instance = new FeatureFlagService();
    }
    return FeatureFlagService.instance;
  }

  /**
   * Initialize — seed default flags into DB if they don't exist
   */
  async initialize(): Promise<void> {
    try {
      const Model = getModel();
      const existing = await Model.find({}).lean();
      const existingNames = new Set(existing.map((f: any) => f.name));

      const toInsert = defaultFlags.filter((f) => !existingNames.has(f.name));
      if (toInsert.length > 0) {
        await Model.insertMany(toInsert, { ordered: false }).catch(() => {
          // Ignore duplicate key errors from race conditions
        });
        logger.info(`[feature-flags] seeded ${toInsert.length} new flags`);
      }

      // Sync from DB
      await this.syncFromDB();
      logger.info(`[feature-flags] initialized with ${this.memoryCache.size} flags`);
    } catch (error) {
      logger.warn('[feature-flags] DB unavailable, using defaults', { error });
    }
  }

  /**
   * Check if a feature flag is enabled for the given context
   */
  isEnabled(flagName: string, context?: FeatureFlagContext): boolean {
    const flag = this.memoryCache.get(flagName);

    // Unknown flags are disabled by default
    if (!flag) return false;
    if (!flag.enabled) return false;

    // Check role restriction
    if (flag.allowedRoles && flag.allowedRoles.length > 0 && context?.role) {
      if (!flag.allowedRoles.includes(context.role)) return false;
    }

    // Check org restriction
    if (flag.allowedOrgs && flag.allowedOrgs.length > 0 && context?.orgId) {
      if (!flag.allowedOrgs.includes(context.orgId)) return false;
    }

    // Check rollout percentage
    if (flag.rolloutPercentage < 100) {
      if (!context?.userId) return false;
      const hash = this.hashUserId(context.userId, flagName);
      if (hash >= flag.rolloutPercentage) return false;
    }

    return true;
  }

  /**
   * Get all flags
   */
  async getFlags(): Promise<FeatureFlag[]> {
    await this.ensureFresh();
    return Array.from(this.memoryCache.values());
  }

  /**
   * Get flags by category
   */
  async getFlagsByCategory(category: FeatureFlagCategory): Promise<FeatureFlag[]> {
    await this.ensureFresh();
    return Array.from(this.memoryCache.values()).filter((f) => f.category === category);
  }

  /**
   * Get a single flag by name
   */
  async getFlag(name: string): Promise<FeatureFlag | null> {
    await this.ensureFresh();
    return this.memoryCache.get(name) || null;
  }

  /**
   * Update a flag
   */
  async updateFlag(name: string, update: FeatureFlagUpdate, updatedBy?: string): Promise<FeatureFlag | null> {
    try {
      const Model = getModel();
      const updated = await Model.findOneAndUpdate(
        { name },
        { $set: { ...update, updatedBy } },
        { new: true, lean: true }
      );

      if (updated) {
        const flag = this.docToFlag(updated);
        this.memoryCache.set(name, flag);
        await this.invalidateCache();
        logger.info(`[feature-flags] updated flag: ${name}`, { update, updatedBy });
        return flag;
      }

      return null;
    } catch (error) {
      logger.error(`[feature-flags] failed to update flag: ${name}`, { error });
      throw error;
    }
  }

  /**
   * Create a new flag (runtime only — defaults come from flags.ts)
   */
  async createFlag(flag: FeatureFlag): Promise<FeatureFlag> {
    try {
      const Model = getModel();
      const doc = await Model.create(flag);
      const created = this.docToFlag(doc.toObject());
      this.memoryCache.set(flag.name, created);
      await this.invalidateCache();
      logger.info(`[feature-flags] created flag: ${flag.name}`);
      return created;
    } catch (error) {
      logger.error(`[feature-flags] failed to create flag: ${flag.name}`, { error });
      throw error;
    }
  }

  // ── Private helpers ─────────────────────────────────────────

  private async ensureFresh(): Promise<void> {
    const now = Date.now();
    // Re-sync from DB every 60 seconds at most
    if (now - this.lastSync > 60_000) {
      await this.syncFromDB();
    }
  }

  private async syncFromDB(): Promise<void> {
    try {
      // Try Redis cache first
      const redis = await getRedis();
      if (redis) {
        try {
          const cached = await redis.get(CACHE_KEY);
          if (cached) {
            const flags: FeatureFlag[] = JSON.parse(cached);
            for (const flag of flags) {
              this.memoryCache.set(flag.name, flag);
            }
            this.lastSync = Date.now();
            return;
          }
        } catch {
          // Redis error — fall through to DB
        }
      }

      // Fetch from DB
      const Model = getModel();
      const docs = await Model.find({}).lean();
      for (const doc of docs) {
        this.memoryCache.set(doc.name, this.docToFlag(doc));
      }

      // Write to Redis cache
      if (redis) {
        try {
          const data = JSON.stringify(Array.from(this.memoryCache.values()));
          await redis.set(CACHE_KEY, data, 'EX', CACHE_TTL);
        } catch {
          // Redis write failure — non-critical
        }
      }

      this.lastSync = Date.now();
    } catch {
      // DB unavailable — keep using memory cache (defaults)
      this.lastSync = Date.now();
    }
  }

  private async invalidateCache(): Promise<void> {
    try {
      const redis = await getRedis();
      if (redis) {
        await redis.del(CACHE_KEY);
      }
    } catch {
      // Non-critical
    }
    this.lastSync = 0; // Force re-sync on next read
  }

  private docToFlag(doc: any): FeatureFlag {
    return {
      name: doc.name,
      enabled: doc.enabled,
      description: doc.description,
      descriptionAr: doc.descriptionAr,
      rolloutPercentage: doc.rolloutPercentage,
      allowedRoles: doc.allowedRoles,
      allowedOrgs: doc.allowedOrgs,
      category: doc.category,
      updatedAt: doc.updatedAt,
      updatedBy: doc.updatedBy,
    };
  }

  /**
   * Deterministic hash for percentage-based rollouts.
   * Returns 0–99 based on userId + flagName.
   */
  private hashUserId(userId: string, flagName: string): number {
    const str = `${userId}:${flagName}`;
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash) % 100;
  }
}

export default FeatureFlagService;
