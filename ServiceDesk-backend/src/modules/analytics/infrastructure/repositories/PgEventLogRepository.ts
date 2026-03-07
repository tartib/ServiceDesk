/**
 * PostgreSQL Event Log Repository
 * Analytics read model for raw domain event persistence
 */

import { PostgresRepository } from '../../../../shared/database/PostgresRepository';
import { getPool } from '../../../../shared/database/PostgresConnectionManager';

const columnMap: Record<string, string> = {
  _id: 'id',
  eventId: 'event_id',
  eventType: 'event_type',
  organizationId: 'organization_id',
  userId: 'user_id',
  processedAt: 'processed_at',
};

export class PgEventLogRepository extends PostgresRepository<any> {
  constructor() {
    super({ tableName: 'analytics_event_log', columnMap });
  }

  /* ── Upsert (used by EventLogProjector) ─────────────────── */

  /**
   * Idempotent insert — skips if eventId already exists.
   */
  async upsertByEventId(data: {
    eventId: string;
    eventType: string;
    domain: string;
    entity: string;
    action: string;
    organizationId?: string;
    userId?: string;
    payload: Record<string, any>;
    timestamp: Date;
  }): Promise<void> {
    const pool = getPool();
    const sql = `
      INSERT INTO "analytics_event_log"
        (event_id, event_type, domain, entity, action, organization_id, user_id, payload, "timestamp", processed_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW())
      ON CONFLICT (event_id) DO NOTHING
    `;
    await pool.query(sql, [
      data.eventId,
      data.eventType,
      data.domain,
      data.entity,
      data.action,
      data.organizationId || null,
      data.userId || null,
      JSON.stringify(data.payload),
      data.timestamp,
    ]);
  }

  /* ── Query methods (for future analytics endpoints) ─────── */

  async searchEvents(
    filters: {
      domain?: string;
      entity?: string;
      action?: string;
      organizationId?: string;
      userId?: string;
      fromDate?: Date;
      toDate?: Date;
    },
    page = 1,
    limit = 50,
  ) {
    const pool = getPool();
    const conditions: string[] = [];
    const params: any[] = [];
    let idx = 1;

    if (filters.domain) {
      conditions.push(`domain = $${idx++}`);
      params.push(filters.domain);
    }
    if (filters.entity) {
      conditions.push(`entity = $${idx++}`);
      params.push(filters.entity);
    }
    if (filters.action) {
      conditions.push(`action = $${idx++}`);
      params.push(filters.action);
    }
    if (filters.organizationId) {
      conditions.push(`organization_id = $${idx++}`);
      params.push(filters.organizationId);
    }
    if (filters.userId) {
      conditions.push(`user_id = $${idx++}`);
      params.push(filters.userId);
    }
    if (filters.fromDate) {
      conditions.push(`"timestamp" >= $${idx++}`);
      params.push(filters.fromDate);
    }
    if (filters.toDate) {
      conditions.push(`"timestamp" <= $${idx++}`);
      params.push(filters.toDate);
    }

    const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    const offset = (page - 1) * limit;

    const countSql = `SELECT COUNT(*)::int AS total FROM "analytics_event_log" ${where}`;
    const dataSql = `SELECT * FROM "analytics_event_log" ${where} ORDER BY "timestamp" DESC LIMIT $${idx++} OFFSET $${idx++}`;

    const [countRes, dataRes] = await Promise.all([
      pool.query(countSql, params),
      pool.query(dataSql, [...params, limit, offset]),
    ]);

    return {
      events: dataRes.rows.map((r: any) => this.mapRow(r)),
      total: countRes.rows[0]?.total || 0,
      page,
      limit,
    };
  }
}
