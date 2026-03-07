/**
 * Internal API Registry
 *
 * Central registry where modules register their public facades.
 * Other modules retrieve facades by interface key — never importing internals directly.
 *
 * Usage:
 *   // In module bootstrap:
 *   InternalApiRegistry.register('itsm', new ItsmApiImpl());
 *
 *   // In consumer:
 *   const itsm = InternalApiRegistry.get<IItsmApi>('itsm');
 */

import { IInternalApi } from './types';
import logger from '../../utils/logger';

class InternalApiRegistry {
  private static apis: Map<string, IInternalApi> = new Map();

  /**
   * Register a module's public API facade
   */
  static register<T extends IInternalApi>(key: string, api: T): void {
    if (InternalApiRegistry.apis.has(key)) {
      logger.warn(`[internal-api] overwriting existing API for key: ${key}`);
    }
    InternalApiRegistry.apis.set(key, api);
    logger.info(`[internal-api] registered: ${key}`);
  }

  /**
   * Retrieve a module's public API facade
   */
  static get<T extends IInternalApi>(key: string): T {
    const api = InternalApiRegistry.apis.get(key);
    if (!api) {
      throw new Error(`[internal-api] no API registered for key: ${key}. Ensure the module is initialized.`);
    }
    return api as T;
  }

  /**
   * Check if a module API is registered
   */
  static has(key: string): boolean {
    return InternalApiRegistry.apis.has(key);
  }

  /**
   * Get all registered API keys
   */
  static keys(): string[] {
    return Array.from(InternalApiRegistry.apis.keys());
  }

  /**
   * Clear all registrations (useful for testing)
   */
  static clear(): void {
    InternalApiRegistry.apis.clear();
  }
}

export default InternalApiRegistry;
