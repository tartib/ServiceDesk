/**
 * PostgreSQL Workflow Event Repository
 */

import { PostgresRepository } from '../../../../shared/database/PostgresRepository';
import { getPool } from '../../../../shared/database/PostgresConnectionManager';
import type { IWFEventStore } from '../../engine/GenericWorkflowEngine';

const columnMap: Record<string, string> = {
  _id: 'id',
  instanceId: 'instance_id',
  definitionId: 'definition_id',
  organizationId: 'organization_id',
  entityType: 'entity_type',
  entityId: 'entity_id',
  fromState: 'from_state',
  toState: 'to_state',
  transitionId: 'transition_id',
  actorId: 'actor_id',
  actorType: 'actor_type',
  actorName: 'actor_name',
  mongoId: 'mongo_id',
};

export class PgWfEventRepository
  extends PostgresRepository<any>
  implements IWFEventStore
{
  constructor() {
    super({ tableName: 'wf_events', columnMap });
  }

  /* ── IWFEventStore ──────────────────────────── */

  async record(event: any): Promise<void> {
    await this.create(event);
  }

  async getByInstance(instanceId: string, limit?: number): Promise<any[]> {
    const pool = getPool();
    const sql = limit
      ? `SELECT * FROM "wf_events" WHERE instance_id = $1 ORDER BY "timestamp" DESC LIMIT $2`
      : `SELECT * FROM "wf_events" WHERE instance_id = $1 ORDER BY "timestamp" DESC`;
    const params = limit ? [instanceId, limit] : [instanceId];
    const { rows } = await pool.query(sql, params);
    return rows.map((r: any) => this.mapRow(r));
  }

  /* ── Extended queries (used by workflowEvent.service) ── */

  async getByEntity(entityType: string, entityId: string, limit?: number): Promise<any[]> {
    const pool = getPool();
    const sql = limit
      ? `SELECT * FROM "wf_events" WHERE entity_type = $1 AND entity_id = $2 ORDER BY "timestamp" DESC LIMIT $3`
      : `SELECT * FROM "wf_events" WHERE entity_type = $1 AND entity_id = $2 ORDER BY "timestamp" DESC`;
    const params = limit ? [entityType, entityId, limit] : [entityType, entityId];
    const { rows } = await pool.query(sql, params);
    return rows.map((r: any) => this.mapRow(r));
  }

  async searchByDefinition(
    definitionId: string,
    params?: {
      type?: string;
      actorId?: string;
      fromDate?: Date;
      toDate?: Date;
      page?: number;
      limit?: number;
    },
  ) {
    const pool = getPool();
    const conditions: string[] = ['definition_id = $1'];
    const qp: any[] = [definitionId];
    let idx = 2;

    if (params?.type) {
      conditions.push(`type = $${idx++}`);
      qp.push(params.type);
    }
    if (params?.actorId) {
      conditions.push(`actor_id = $${idx++}`);
      qp.push(params.actorId);
    }
    if (params?.fromDate) {
      conditions.push(`"timestamp" >= $${idx++}`);
      qp.push(params.fromDate);
    }
    if (params?.toDate) {
      conditions.push(`"timestamp" <= $${idx++}`);
      qp.push(params.toDate);
    }

    const where = `WHERE ${conditions.join(' AND ')}`;
    const page = params?.page || 1;
    const limit = params?.limit || 50;
    const offset = (page - 1) * limit;

    const countSql = `SELECT COUNT(*)::int AS total FROM "wf_events" ${where}`;
    const dataSql = `SELECT * FROM "wf_events" ${where} ORDER BY "timestamp" DESC LIMIT $${idx++} OFFSET $${idx++}`;

    const [countRes, dataRes] = await Promise.all([
      pool.query(countSql, qp),
      pool.query(dataSql, [...qp, limit, offset]),
    ]);

    return {
      events: dataRes.rows.map((r: any) => this.mapRow(r)),
      total: countRes.rows[0]?.total || 0,
    };
  }

  async searchByOrganization(
    organizationId: string,
    params?: {
      type?: string;
      entityType?: string;
      fromDate?: Date;
      toDate?: Date;
      page?: number;
      limit?: number;
    },
  ) {
    const pool = getPool();
    const conditions: string[] = ['organization_id = $1'];
    const qp: any[] = [organizationId];
    let idx = 2;

    if (params?.type) {
      conditions.push(`type = $${idx++}`);
      qp.push(params.type);
    }
    if (params?.entityType) {
      conditions.push(`entity_type = $${idx++}`);
      qp.push(params.entityType);
    }
    if (params?.fromDate) {
      conditions.push(`"timestamp" >= $${idx++}`);
      qp.push(params.fromDate);
    }
    if (params?.toDate) {
      conditions.push(`"timestamp" <= $${idx++}`);
      qp.push(params.toDate);
    }

    const where = `WHERE ${conditions.join(' AND ')}`;
    const page = params?.page || 1;
    const limit = params?.limit || 50;
    const offset = (page - 1) * limit;

    const countSql = `SELECT COUNT(*)::int AS total FROM "wf_events" ${where}`;
    const dataSql = `SELECT * FROM "wf_events" ${where} ORDER BY "timestamp" DESC LIMIT $${idx++} OFFSET $${idx++}`;

    const [countRes, dataRes] = await Promise.all([
      pool.query(countSql, qp),
      pool.query(dataSql, [...qp, limit, offset]),
    ]);

    return {
      events: dataRes.rows.map((r: any) => this.mapRow(r)),
      total: countRes.rows[0]?.total || 0,
    };
  }

  async countByType(instanceId: string): Promise<Record<string, number>> {
    const pool = getPool();
    const sql = `
      SELECT type, COUNT(*)::int AS count
      FROM "wf_events"
      WHERE instance_id = $1
      GROUP BY type
    `;
    const { rows } = await pool.query(sql, [instanceId]);
    const counts: Record<string, number> = {};
    for (const r of rows) counts[r.type] = r.count;
    return counts;
  }
}
