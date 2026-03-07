/**
 * PostgreSQL Task Snapshot Repository
 * Analytics read model for denormalized task data
 */

import { PostgresRepository } from '../../../../shared/database/PostgresRepository';
import { getPool } from '../../../../shared/database/PostgresConnectionManager';

const columnMap: Record<string, string> = {
  _id: 'id',
  sourceId: 'source_id',
  sourceModule: 'source_module',
  organizationId: 'organization_id',
  projectId: 'project_id',
  statusCategory: 'status_category',
  assigneeId: 'assignee_id',
  reporterId: 'reporter_id',
  completedAt: 'completed_at',
  dueDate: 'due_date',
  startDate: 'start_date',
  durationHours: 'duration_hours',
  isOnTime: 'is_on_time',
  isOverdue: 'is_overdue',
  lastEventType: 'last_event_type',
  lastEventAt: 'last_event_at',
  createdAt: 'created_at',
  updatedAt: 'updated_at',
};

export class PgTaskSnapshotRepository extends PostgresRepository<any> {
  constructor() {
    super({ tableName: 'analytics_task_snapshots', columnMap });
  }

  /* ── Upsert (used by projectors) ────────────────────────── */

  async upsertBySource(
    sourceId: string,
    sourceModule: string,
    data: Record<string, any>,
  ): Promise<void> {
    const pool = getPool();
    const now = new Date();

    // Build the full record
    const record: Record<string, any> = {
      ...data,
      source_id: sourceId,
      source_module: sourceModule,
      updated_at: now,
    };

    // Convert camelCase keys to snake_case
    const sqlRecord: Record<string, any> = {};
    for (const [key, val] of Object.entries(record)) {
      const col = columnMap[key] || this.camelToSnake(key);
      sqlRecord[col] = val;
    }

    const keys = Object.keys(sqlRecord);
    const cols = keys.map(k => `"${k}"`).join(', ');
    const placeholders = keys.map((_, i) => `$${i + 1}`).join(', ');
    const values = keys.map(k => sqlRecord[k]);

    // ON CONFLICT on (source_id, source_module) — update all fields
    const updateClauses = keys
      .filter(k => k !== 'source_id' && k !== 'source_module')
      .map(k => `"${k}" = EXCLUDED."${k}"`)
      .join(', ');

    const sql = `
      INSERT INTO "analytics_task_snapshots" (${cols})
      VALUES (${placeholders})
      ON CONFLICT (source_id, source_module)
      DO UPDATE SET ${updateClauses}
    `;

    await pool.query(sql, values);
  }

  async updateBySource(
    sourceId: string,
    sourceModule: string,
    data: Record<string, any>,
  ): Promise<any | null> {
    const pool = getPool();
    const record: Record<string, any> = { ...data, updated_at: new Date() };

    const sqlRecord: Record<string, any> = {};
    for (const [key, val] of Object.entries(record)) {
      const col = columnMap[key] || this.camelToSnake(key);
      sqlRecord[col] = val;
    }

    const keys = Object.keys(sqlRecord);
    const setClauses = keys.map((k, i) => `"${k}" = $${i + 1}`).join(', ');
    const values = keys.map(k => sqlRecord[k]);

    const sql = `
      UPDATE "analytics_task_snapshots"
      SET ${setClauses}
      WHERE source_id = $${keys.length + 1} AND source_module = $${keys.length + 2}
      RETURNING *
    `;
    const { rows } = await pool.query(sql, [...values, sourceId, sourceModule]);
    return rows.length > 0 ? this.mapRow(rows[0]) : null;
  }

  async findBySource(sourceId: string, sourceModule: string): Promise<any | null> {
    return this.findOne({ sourceId, sourceModule });
  }

  /* ── Dashboard queries ──────────────────────────────────── */

  async countByFilter(filter: Record<string, any>): Promise<number> {
    return this.count(filter);
  }

  async countOnTime(dateFrom: Date, dateTo: Date): Promise<{ completed: number; onTime: number }> {
    const pool = getPool();
    const sql = `
      SELECT
        COUNT(*) FILTER (WHERE status_category = 'done' AND completed_at >= $1 AND completed_at <= $2 AND due_date IS NOT NULL)::int AS completed,
        COUNT(*) FILTER (WHERE status_category = 'done' AND completed_at >= $1 AND completed_at <= $2 AND is_on_time = true)::int AS on_time
      FROM "analytics_task_snapshots"
    `;
    const { rows } = await pool.query(sql, [dateFrom, dateTo]);
    return { completed: rows[0]?.completed || 0, onTime: rows[0]?.on_time || 0 };
  }

  async getDistribution(
    field: string,
    dateFrom?: Date,
    dateTo?: Date,
  ): Promise<Record<string, number>> {
    const pool = getPool();
    const col = columnMap[field] || this.camelToSnake(field);
    const conditions: string[] = [];
    const params: any[] = [];
    let idx = 1;

    if (dateFrom) {
      conditions.push(`created_at >= $${idx++}`);
      params.push(dateFrom);
    }
    if (dateTo) {
      conditions.push(`created_at <= $${idx++}`);
      params.push(dateTo);
    }

    const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    const sql = `
      SELECT "${col}" AS key, COUNT(*)::int AS count
      FROM "analytics_task_snapshots"
      ${where}
      GROUP BY "${col}"
    `;
    const { rows } = await pool.query(sql, params);
    const result: Record<string, number> = {};
    for (const r of rows) {
      if (r.key != null) result[r.key] = r.count;
    }
    return result;
  }

  async getAssigneeSnapshots(
    dateFrom?: Date,
    dateTo?: Date,
  ): Promise<any[]> {
    const pool = getPool();
    const conditions: string[] = ['assignee_id IS NOT NULL'];
    const params: any[] = [];
    let idx = 1;

    if (dateFrom) {
      conditions.push(`created_at >= $${idx++}`);
      params.push(dateFrom);
    }
    if (dateTo) {
      conditions.push(`created_at <= $${idx++}`);
      params.push(dateTo);
    }

    const sql = `
      SELECT assignee_id, status_category
      FROM "analytics_task_snapshots"
      WHERE ${conditions.join(' AND ')}
    `;
    const { rows } = await pool.query(sql, params);
    return rows.map((r: any) => ({
      assigneeId: r.assignee_id,
      statusCategory: r.status_category,
    }));
  }
}
