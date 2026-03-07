/**
 * Integration Adapter Registry
 *
 * Central registry for all integration adapters.
 * Adapters register themselves on startup; the router and controllers
 * look up adapters by id or category.
 */

import { IntegrationAdapter, AdapterCategory, AdapterStatus } from './types';
import logger from '../utils/logger';

class AdapterRegistry {
  private adapters: Map<string, IntegrationAdapter> = new Map();

  /**
   * Register an adapter. Skips if adapter.enabled === false.
   */
  register(adapter: IntegrationAdapter): void {
    if (this.adapters.has(adapter.id)) {
      logger.warn(`Integration adapter '${adapter.id}' already registered, skipping`);
      return;
    }
    this.adapters.set(adapter.id, adapter);
    logger.debug(`Integration adapter registered: ${adapter.id} (${adapter.category}, enabled=${adapter.enabled})`);
  }

  /**
   * Get adapter by id.
   */
  get(id: string): IntegrationAdapter | undefined {
    return this.adapters.get(id);
  }

  /**
   * Get all registered adapters.
   */
  getAll(): IntegrationAdapter[] {
    return Array.from(this.adapters.values());
  }

  /**
   * Get adapters filtered by category.
   */
  getByCategory(category: AdapterCategory): IntegrationAdapter[] {
    return this.getAll().filter((a) => a.category === category);
  }

  /**
   * Get only enabled adapters.
   */
  getEnabled(): IntegrationAdapter[] {
    return this.getAll().filter((a) => a.enabled);
  }

  /**
   * Initialize all enabled adapters.
   */
  async initializeAll(): Promise<void> {
    const enabled = this.getEnabled();
    logger.info(`Initializing ${enabled.length} integration adapter(s)...`);

    const results = await Promise.allSettled(
      enabled.map(async (adapter) => {
        try {
          await adapter.initialize();
          logger.info(`✅ Integration adapter initialized: ${adapter.id}`);
        } catch (err) {
          logger.error(`❌ Failed to initialize adapter '${adapter.id}'`, { error: err });
          throw err;
        }
      })
    );

    const failed = results.filter((r) => r.status === 'rejected').length;
    if (failed > 0) {
      logger.warn(`${failed} integration adapter(s) failed to initialize`);
    }
  }

  /**
   * Shut down all adapters gracefully.
   */
  async shutdownAll(): Promise<void> {
    const adapters = this.getAll();
    await Promise.allSettled(
      adapters.map(async (adapter) => {
        try {
          await adapter.shutdown();
        } catch (err) {
          logger.error(`Error shutting down adapter '${adapter.id}'`, { error: err });
        }
      })
    );
    logger.info('All integration adapters shut down');
  }

  /**
   * Health check: returns status of every registered adapter.
   */
  healthCheck(): Array<{
    id: string;
    name: string;
    category: AdapterCategory;
    enabled: boolean;
    status: AdapterStatus;
  }> {
    return this.getAll().map((a) => ({
      id: a.id,
      name: a.name,
      category: a.category,
      enabled: a.enabled,
      status: a.enabled ? a.getStatus() : 'disconnected',
    }));
  }
}

export const adapterRegistry = new AdapterRegistry();
export default adapterRegistry;
