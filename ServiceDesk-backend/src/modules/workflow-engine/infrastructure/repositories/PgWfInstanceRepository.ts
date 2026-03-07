/**
 * PostgreSQL Workflow Instance Repository
 */

import { PostgresRepository } from '../../../../shared/database/PostgresRepository';
import { getPool } from '../../../../shared/database/PostgresConnectionManager';
import type { IWFInstanceStore } from '../../engine/GenericWorkflowEngine';

const columnMap: Record<string, string> = {
  _id: 'id',
  definitionId: 'definition_id',
  definitionVersion: 'definition_version',
  organizationId: 'organization_id',
  entityType: 'entity_type',
  entityId: 'entity_id',
  currentState: 'current_state',
  previousState: 'previous_state',
  parallelBranches: 'parallel_branches',
  startedAt: 'started_at',
  completedAt: 'completed_at',
  cancelledAt: 'cancelled_at',
  startedBy: 'started_by',
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  mongoId: 'mongo_id',
};

export class PgWfInstanceRepository
  extends PostgresRepository<any>
  implements IWFInstanceStore
{
  constructor() {
    super({ tableName: 'wf_instances', columnMap });
  }

  /* ── IWFInstanceStore ───────────────────────── */

  async create(data: any): Promise<any> {
    return super.create(data);
  }

  async findById(id: string): Promise<any | null> {
    return super.findById(id);
  }

  async findByEntity(entityType: string, entityId: string): Promise<any | null> {
    return this.findOne({ entityType, entityId, status: 'active' });
  }

  async update(id: string, updates: any): Promise<any | null> {
    return this.updateById(id, updates);
  }

  /* ── Extended queries (used by workflowInstance.service) ── */

  async searchInstances(
    filters: {
      organizationId?: string;
      entityType?: string;
      status?: string;
      assigneeId?: string;
      definitionId?: string;
      currentState?: string;
    },
    page = 1,
    limit = 20,
  ) {
    const pool = getPool();
    const conditions: string[] = [];
    const params: any[] = [];
    let idx = 1;

    if (filters.organizationId) {
      conditions.push(`organization_id = $${idx++}`);
      params.push(filters.organizationId);
    }
    if (filters.entityType) {
      conditions.push(`entity_type = $${idx++}`);
      params.push(filters.entityType);
    }
    if (filters.status) {
      conditions.push(`status = $${idx++}`);
      params.push(filters.status);
    }
    if (filters.assigneeId) {
      conditions.push(`assignment->>'userId' = $${idx++}`);
      params.push(filters.assigneeId);
    }
    if (filters.definitionId) {
      conditions.push(`definition_id = $${idx++}`);
      params.push(filters.definitionId);
    }
    if (filters.currentState) {
      conditions.push(`current_state = $${idx++}`);
      params.push(filters.currentState);
    }

    const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    const offset = (page - 1) * limit;

    const countSql = `SELECT COUNT(*)::int AS total FROM "wf_instances" ${where}`;
    const dataSql = `SELECT * FROM "wf_instances" ${where} ORDER BY "updated_at" DESC LIMIT $${idx++} OFFSET $${idx++}`;

    const [countRes, dataRes] = await Promise.all([
      pool.query(countSql, params),
      pool.query(dataSql, [...params, limit, offset]),
    ]);

    return {
      data: dataRes.rows.map((r: any) => this.mapRow(r)),
      total: countRes.rows[0]?.total || 0,
      page,
      limit,
    };
  }

  async findByEntityId(entityType: string, entityId: string): Promise<any[]> {
    return this.findAll(
      { entityType, entityId },
      { sort: 'startedAt', order: 'desc' },
    );
  }

  async findActiveByDefinition(definitionId: string): Promise<any[]> {
    return this.findAll({ definitionId, status: 'active' });
  }

  async countByStatus(organizationId: string): Promise<Record<string, number>> {
    const pool = getPool();
    const sql = `
      SELECT status, COUNT(*)::int AS count
      FROM "wf_instances"
      WHERE organization_id = $1
      GROUP BY status
    `;
    const { rows } = await pool.query(sql, [organizationId]);
    const counts: Record<string, number> = {};
    for (const r of rows) counts[r.status] = r.count;
    return counts;
  }

  async getOverdueInstances(organizationId: string): Promise<any[]> {
    const pool = getPool();
    const sql = `
      SELECT * FROM "wf_instances"
      WHERE organization_id = $1
        AND status = 'active'
        AND (
          (sla->>'resolutionDue')::timestamptz < NOW() AND (sla->>'breached')::boolean = false
          OR EXISTS (
            SELECT 1 FROM jsonb_array_elements(timers) AS t
            WHERE (t->>'dueAt')::timestamptz < NOW() AND t->>'status' = 'pending'
          )
        )
    `;
    const { rows } = await pool.query(sql, [organizationId]);
    return rows.map((r: any) => this.mapRow(r));
  }
}
