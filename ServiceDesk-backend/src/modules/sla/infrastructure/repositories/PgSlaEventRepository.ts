/**
 * PostgreSQL SLA Event Repository (Audit Trail)
 */

import { getPool } from '../../../../shared/database/PostgresConnectionManager';
import { ISlaEventEntity } from '../../domain';

export class PgSlaEventRepository {
  async append(data: Partial<ISlaEventEntity>): Promise<ISlaEventEntity> {
    const pool = getPool();
    const res = await pool.query(
      `INSERT INTO sla_events (tenant_id, instance_id, metric_instance_id, ticket_id, event_type, event_source, payload, occurred_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [
        data.tenantId, data.instanceId, data.metricInstanceId,
        data.ticketId, data.eventType, data.eventSource || 'system',
        JSON.stringify(data.payload || {}), data.occurredAt || new Date(),
      ]
    );
    return this.mapRow(res.rows[0]);
  }

  async findByTicket(ticketId: string, limit = 100): Promise<ISlaEventEntity[]> {
    const pool = getPool();
    const res = await pool.query(
      `SELECT * FROM sla_events WHERE ticket_id = $1 ORDER BY occurred_at DESC LIMIT $2`,
      [ticketId, limit]
    );
    return res.rows.map(this.mapRow);
  }

  async findByInstance(instanceId: string): Promise<ISlaEventEntity[]> {
    const pool = getPool();
    const res = await pool.query(
      `SELECT * FROM sla_events WHERE instance_id = $1 ORDER BY occurred_at ASC`,
      [instanceId]
    );
    return res.rows.map(this.mapRow);
  }

  async findByMetricInstance(metricInstanceId: string): Promise<ISlaEventEntity[]> {
    const pool = getPool();
    const res = await pool.query(
      `SELECT * FROM sla_events WHERE metric_instance_id = $1 ORDER BY occurred_at ASC`,
      [metricInstanceId]
    );
    return res.rows.map(this.mapRow);
  }

  async findByTenantAndType(
    tenantId: string,
    eventType: string,
    page = 1,
    limit = 50
  ): Promise<{ data: ISlaEventEntity[]; total: number }> {
    const pool = getPool();
    const offset = (page - 1) * limit;
    const [dataRes, countRes] = await Promise.all([
      pool.query(
        `SELECT * FROM sla_events WHERE tenant_id = $1 AND event_type = $2
         ORDER BY occurred_at DESC LIMIT $3 OFFSET $4`,
        [tenantId, eventType, limit, offset]
      ),
      pool.query(
        `SELECT COUNT(*)::int AS total FROM sla_events WHERE tenant_id = $1 AND event_type = $2`,
        [tenantId, eventType]
      ),
    ]);
    return {
      data: dataRes.rows.map(this.mapRow),
      total: countRes.rows[0]?.total || 0,
    };
  }

  private mapRow(row: any): ISlaEventEntity {
    return {
      id: row.id,
      tenantId: row.tenant_id,
      instanceId: row.instance_id,
      metricInstanceId: row.metric_instance_id,
      ticketId: row.ticket_id,
      eventType: row.event_type,
      eventSource: row.event_source,
      payload: typeof row.payload === 'string' ? JSON.parse(row.payload) : (row.payload || {}),
      occurredAt: row.occurred_at,
    };
  }
}
