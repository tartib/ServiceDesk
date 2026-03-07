/**
 * PostgreSQL Connection Manager
 *
 * Manages a singleton connection pool to PostgreSQL.
 * Used by PostgresRepository when DB_STRATEGY_* = 'postgresql'.
 */

import { Pool, PoolClient } from 'pg';
import logger from '../../utils/logger';

let pool: Pool | null = null;

/**
 * Initialize the PostgreSQL connection pool.
 * Call once at server startup if any module uses postgresql strategy.
 */
export async function connectPostgres(connectionString: string): Promise<Pool> {
  if (pool) return pool;

  pool = new Pool({
    connectionString,
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 5000,
  });

  // Test the connection
  let client: PoolClient | undefined;
  try {
    client = await pool.connect();
    await client.query('SELECT NOW()');
    logger.info('[postgres] Connected to PostgreSQL');
  } catch (error) {
    logger.error('[postgres] Failed to connect to PostgreSQL', { error });
    throw error;
  } finally {
    if (client) client.release();
  }

  // Log pool errors
  pool.on('error', (err) => {
    logger.error('[postgres] Unexpected pool error', { error: err.message });
  });

  return pool;
}

/**
 * Get the active PostgreSQL pool.
 * Throws if not yet initialized.
 */
export function getPool(): Pool {
  if (!pool) {
    throw new Error('[postgres] Pool not initialized. Call connectPostgres() first.');
  }
  return pool;
}

/**
 * Gracefully close the PostgreSQL pool.
 */
export async function disconnectPostgres(): Promise<void> {
  if (pool) {
    await pool.end();
    pool = null;
    logger.info('[postgres] Disconnected from PostgreSQL');
  }
}

/**
 * Check if any module is configured to use PostgreSQL.
 */
export function isPostgresRequired(): boolean {
  const strategies = [
    process.env.DB_STRATEGY_ITSM,
    process.env.DB_STRATEGY_PM,
    process.env.DB_STRATEGY_FORMS,
    process.env.DB_STRATEGY_WORKFLOW,
    process.env.DB_STRATEGY_ANALYTICS,
    process.env.DB_STRATEGY_STORAGE,
    process.env.DB_STRATEGY_PLATFORM,
    process.env.DB_STRATEGY_SLA,
  ];
  return strategies.some((s) => s === 'postgresql');
}

/**
 * Ensure a table exists with the given schema.
 * Used by PostgresRepository on first access.
 */
export async function ensureTable(
  tableName: string,
  columns: Record<string, string>,
): Promise<void> {
  const p = getPool();

  const colDefs = Object.entries(columns)
    .map(([name, type]) => `"${name}" ${type}`)
    .join(', ');

  const sql = `CREATE TABLE IF NOT EXISTS "${tableName}" (${colDefs})`;

  try {
    await p.query(sql);
    logger.debug(`[postgres] Table "${tableName}" ensured`);
  } catch (error) {
    logger.error(`[postgres] Failed to ensure table "${tableName}"`, { error });
    throw error;
  }
}
