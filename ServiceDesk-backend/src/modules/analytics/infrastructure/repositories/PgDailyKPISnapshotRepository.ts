/**
 * PostgreSQL Daily KPI Snapshot Repository
 * Analytics read model for pre-computed daily KPI rollups
 */

import { PostgresRepository } from '../../../../shared/database/PostgresRepository';
import { getPool } from '../../../../shared/database/PostgresConnectionManager';

const columnMap: Record<string, string> = {
  _id: 'id',
  organizationId: 'organization_id',
  sourceModule: 'source_module',
  totalTasks: 'total_tasks',
  createdTasks: 'created_tasks',
  completedTasks: 'completed_tasks',
  inProgressTasks: 'in_progress_tasks',
  overdueTasks: 'overdue_tasks',
  pendingTasks: 'pending_tasks',
  criticalTasks: 'critical_tasks',
  escalatedTasks: 'escalated_tasks',
  completionRate: 'completion_rate',
  onTimeCompletionRate: 'on_time_completion_rate',
  averageCompletionTimeHours: 'average_completion_time_hours',
  totalCompletionTimeHours: 'total_completion_time_hours',
  completedWithDurationCount: 'completed_with_duration_count',
  byType: 'by_type',
  byPriority: 'by_priority',
  byStatus: 'by_status',
  lastUpdatedAt: 'last_updated_at',
};

export class PgDailyKPISnapshotRepository extends PostgresRepository<any> {
  constructor() {
    super({ tableName: 'analytics_daily_kpi_snapshots', columnMap });
  }

  /* ── Upsert + Increment (used by KPIProjector) ─────────── */

  /**
   * Atomically increment counters for a given date/org/module.
   * Creates the row if it doesn't exist.
   */
  async incrementCounters(
    dateKey: string,
    organizationId: string | null,
    sourceModule: string,
    increments: Record<string, number>,
  ): Promise<void> {
    const pool = getPool();

    // Build SET clause for increments
    const setClauses: string[] = [];
    const params: any[] = [dateKey, organizationId, sourceModule];
    let idx = 4;

    // Map JS keys to SQL columns
    for (const [key, val] of Object.entries(increments)) {
      if (key.startsWith('byType.') || key.startsWith('byPriority.') || key.startsWith('byStatus.')) {
        // JSONB field increment — handle separately below
        continue;
      }
      const col = columnMap[key] || this.camelToSnake(key);
      setClauses.push(`"${col}" = COALESCE("${col}", 0) + $${idx++}`);
      params.push(val);
    }

    // Handle JSONB increments for byType, byPriority, byStatus
    const jsonbUpdates: string[] = [];
    for (const [key, val] of Object.entries(increments)) {
      let col: string | null = null;
      let jsonKey: string | null = null;

      if (key.startsWith('byType.')) {
        col = 'by_type';
        jsonKey = key.slice('byType.'.length);
      } else if (key.startsWith('byPriority.')) {
        col = 'by_priority';
        jsonKey = key.slice('byPriority.'.length);
      } else if (key.startsWith('byStatus.')) {
        col = 'by_status';
        jsonKey = key.slice('byStatus.'.length);
      }

      if (col && jsonKey) {
        // jsonb_set with numeric increment
        jsonbUpdates.push(
          `"${col}" = jsonb_set(COALESCE("${col}", '{}'), '{${jsonKey}}', (COALESCE(("${col}"->>'${jsonKey}')::int, 0) + $${idx++})::text::jsonb)`
        );
        params.push(val);
      }
    }

    const allSets = [...setClauses, ...jsonbUpdates];
    allSets.push(`"last_updated_at" = NOW()`);

    const updateClause = allSets.join(', ');

    // Build INSERT columns for initial values
    const sql = `
      INSERT INTO "analytics_daily_kpi_snapshots" (date, organization_id, source_module)
      VALUES ($1, $2, $3)
      ON CONFLICT (date, organization_id, source_module)
      DO UPDATE SET ${updateClause}
    `;

    await pool.query(sql, params);
  }

  /**
   * Find a specific snapshot by date/org/module.
   */
  async findSnapshot(
    dateKey: string,
    organizationId: string | null,
    sourceModule: string,
  ): Promise<any | null> {
    const pool = getPool();
    const sql = `
      SELECT * FROM "analytics_daily_kpi_snapshots"
      WHERE date = $1 AND organization_id IS NOT DISTINCT FROM $2 AND source_module = $3
      LIMIT 1
    `;
    const { rows } = await pool.query(sql, [dateKey, organizationId, sourceModule]);
    return rows.length > 0 ? this.mapRow(rows[0]) : null;
  }

  /**
   * Update a specific field on a snapshot by its ID.
   */
  async updateField(id: string, field: string, value: any): Promise<void> {
    const col = columnMap[field] || this.camelToSnake(field);
    const pool = getPool();
    await pool.query(
      `UPDATE "analytics_daily_kpi_snapshots" SET "${col}" = $1 WHERE id = $2`,
      [value, id],
    );
  }

  /* ── Dashboard queries ──────────────────────────────────── */

  async findByDateRange(
    startKey: string,
    endKey: string,
  ): Promise<any[]> {
    const pool = getPool();
    const sql = `
      SELECT * FROM "analytics_daily_kpi_snapshots"
      WHERE date >= $1 AND date <= $2
      ORDER BY date ASC
    `;
    const { rows } = await pool.query(sql, [startKey, endKey]);
    return rows.map((r: any) => this.mapRow(r));
  }
}
