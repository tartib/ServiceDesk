/**
 * PostgreSQL SLA Instance Repository
 */

import { getPool } from '../../../../shared/database/PostgresConnectionManager';
import { ISlaInstanceEntity, SlaInstanceStatus } from '../../domain';

export class PgSlaInstanceRepository {
  async create(data: Partial<ISlaInstanceEntity>): Promise<ISlaInstanceEntity> {
    const pool = getPool();
    const res = await pool.query(
      `INSERT INTO sla_instances (tenant_id, ticket_id, ticket_type, policy_id, status, started_at)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [data.tenantId, data.ticketId, data.ticketType, data.policyId, data.status || SlaInstanceStatus.ACTIVE, data.startedAt || new Date()]
    );
    return this.mapRow(res.rows[0]);
  }

  async findById(id: string): Promise<ISlaInstanceEntity | null> {
    const pool = getPool();
    const res = await pool.query('SELECT * FROM sla_instances WHERE id = $1', [id]);
    return res.rows[0] ? this.mapRow(res.rows[0]) : null;
  }

  async findByTicket(tenantId: string, ticketId: string): Promise<ISlaInstanceEntity | null> {
    const pool = getPool();
    const res = await pool.query(
      `SELECT * FROM sla_instances WHERE tenant_id = $1 AND ticket_id = $2
       ORDER BY created_at DESC LIMIT 1`,
      [tenantId, ticketId]
    );
    return res.rows[0] ? this.mapRow(res.rows[0]) : null;
  }

  async findActiveByTicket(tenantId: string, ticketId: string): Promise<ISlaInstanceEntity | null> {
    const pool = getPool();
    const res = await pool.query(
      `SELECT * FROM sla_instances WHERE tenant_id = $1 AND ticket_id = $2 AND status = 'active'
       ORDER BY created_at DESC LIMIT 1`,
      [tenantId, ticketId]
    );
    return res.rows[0] ? this.mapRow(res.rows[0]) : null;
  }

  async findActive(tenantId: string, page = 1, limit = 50): Promise<{ data: ISlaInstanceEntity[]; total: number }> {
    const pool = getPool();
    const offset = (page - 1) * limit;
    const [dataRes, countRes] = await Promise.all([
      pool.query(
        `SELECT * FROM sla_instances WHERE tenant_id = $1 AND status = 'active'
         ORDER BY started_at DESC LIMIT $2 OFFSET $3`,
        [tenantId, limit, offset]
      ),
      pool.query(
        `SELECT COUNT(*)::int AS total FROM sla_instances WHERE tenant_id = $1 AND status = 'active'`,
        [tenantId]
      ),
    ]);
    return {
      data: dataRes.rows.map(this.mapRow),
      total: countRes.rows[0]?.total || 0,
    };
  }

  async update(id: string, data: Partial<ISlaInstanceEntity>): Promise<ISlaInstanceEntity | null> {
    const pool = getPool();
    const sets: string[] = [];
    const vals: unknown[] = [];
    let idx = 1;

    if (data.status !== undefined) { sets.push(`status = $${idx++}`); vals.push(data.status); }
    if (data.stoppedAt !== undefined) { sets.push(`stopped_at = $${idx++}`); vals.push(data.stoppedAt); }
    // Allow clearing stoppedAt
    if (data.stoppedAt === undefined && 'stoppedAt' in data) { sets.push(`stopped_at = NULL`); }

    if (sets.length === 0) return this.findById(id);

    vals.push(id);
    const res = await pool.query(
      `UPDATE sla_instances SET ${sets.join(', ')} WHERE id = $${idx} RETURNING *`,
      vals
    );
    return res.rows[0] ? this.mapRow(res.rows[0]) : null;
  }

  async countByStatus(tenantId: string): Promise<Record<string, number>> {
    const pool = getPool();
    const res = await pool.query(
      `SELECT status, COUNT(*)::int AS count FROM sla_instances WHERE tenant_id = $1 GROUP BY status`,
      [tenantId]
    );
    const result: Record<string, number> = {};
    for (const row of res.rows) {
      result[row.status] = row.count;
    }
    return result;
  }

  private mapRow(row: any): ISlaInstanceEntity {
    return {
      id: row.id,
      tenantId: row.tenant_id,
      ticketId: row.ticket_id,
      ticketType: row.ticket_type,
      policyId: row.policy_id,
      status: row.status,
      startedAt: row.started_at,
      stoppedAt: row.stopped_at,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }
}
