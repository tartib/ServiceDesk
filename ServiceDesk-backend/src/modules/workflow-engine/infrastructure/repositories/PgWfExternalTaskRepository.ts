/**
 * PostgreSQL Workflow External Task Repository
 */

import { PostgresRepository } from '../../../../shared/database/PostgresRepository';
import { getPool } from '../../../../shared/database/PostgresConnectionManager';
import type { IWFExternalTaskStore } from '../../engine/GenericWorkflowEngine';

const columnMap: Record<string, string> = {
  _id: 'id',
  instanceId: 'instance_id',
  definitionId: 'definition_id',
  organizationId: 'organization_id',
  stateCode: 'state_code',
  workerId: 'worker_id',
  lockExpiresAt: 'lock_expires_at',
  resultVariables: 'result_variables',
  retriesLeft: 'retries_left',
  errorMessage: 'error_message',
  errorDetails: 'error_details',
  errorHandling: 'error_handling',
  lockedAt: 'locked_at',
  completedAt: 'completed_at',
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  mongoId: 'mongo_id',
};

export class PgWfExternalTaskRepository
  extends PostgresRepository<any>
  implements IWFExternalTaskStore
{
  constructor() {
    super({ tableName: 'wf_external_tasks', columnMap });
  }

  /* ── IWFExternalTaskStore ───────────────────── */

  async create(task: any): Promise<any> {
    return super.create(task);
  }

  async findById(id: string): Promise<any | null> {
    return super.findById(id);
  }

  async findAvailableByTopic(topic: string, maxTasks: number): Promise<any[]> {
    const pool = getPool();
    const sql = `
      SELECT * FROM "wf_external_tasks"
      WHERE topic = $1 AND status = 'available'
      ORDER BY priority DESC, created_at ASC
      LIMIT $2
    `;
    const { rows } = await pool.query(sql, [topic, maxTasks]);
    return rows.map((r: any) => this.mapRow(r));
  }

  async lockTask(taskId: string, workerId: string, lockDuration: number): Promise<any | null> {
    const pool = getPool();
    const lockExpiresAt = new Date(Date.now() + lockDuration);
    const sql = `
      UPDATE "wf_external_tasks"
      SET status = 'locked',
          worker_id = $2,
          lock_expires_at = $3,
          locked_at = NOW(),
          updated_at = NOW()
      WHERE id = $1 AND status = 'available'
      RETURNING *
    `;
    const { rows } = await pool.query(sql, [taskId, workerId, lockExpiresAt]);
    return rows.length > 0 ? this.mapRow(rows[0]) : null;
  }

  async completeTask(taskId: string, resultVariables?: Record<string, any>): Promise<any | null> {
    const pool = getPool();
    const sql = `
      UPDATE "wf_external_tasks"
      SET status = 'completed',
          result_variables = $2,
          completed_at = NOW(),
          updated_at = NOW()
      WHERE id = $1
      RETURNING *
    `;
    const { rows } = await pool.query(sql, [taskId, resultVariables ? JSON.stringify(resultVariables) : null]);
    return rows.length > 0 ? this.mapRow(rows[0]) : null;
  }

  async failTask(taskId: string, errorMessage: string, errorDetails?: string): Promise<any | null> {
    const pool = getPool();
    // First get the task to check retries
    const task = await this.findById(taskId);
    if (!task) return null;

    const newRetriesLeft = (task.retriesLeft || 0) - 1;
    const newStatus = newRetriesLeft > 0 ? 'available' : 'failed';

    const sql = `
      UPDATE "wf_external_tasks"
      SET status = $2,
          error_message = $3,
          error_details = $4,
          retries_left = $5,
          worker_id = NULL,
          lock_expires_at = NULL,
          locked_at = NULL,
          updated_at = NOW()
      WHERE id = $1
      RETURNING *
    `;
    const { rows } = await pool.query(sql, [taskId, newStatus, errorMessage, errorDetails || null, newRetriesLeft]);
    return rows.length > 0 ? this.mapRow(rows[0]) : null;
  }

  async resetExpiredLocks(): Promise<number> {
    const pool = getPool();
    const sql = `
      UPDATE "wf_external_tasks"
      SET status = 'available',
          worker_id = NULL,
          lock_expires_at = NULL,
          locked_at = NULL,
          updated_at = NOW()
      WHERE status = 'locked' AND lock_expires_at <= NOW()
    `;
    const result = await pool.query(sql);
    return result.rowCount || 0;
  }

  async cancelByInstance(instanceId: string): Promise<number> {
    const pool = getPool();
    const sql = `
      UPDATE "wf_external_tasks"
      SET status = 'cancelled', updated_at = NOW()
      WHERE instance_id = $1 AND status IN ('available', 'locked')
    `;
    const result = await pool.query(sql, [instanceId]);
    return result.rowCount || 0;
  }

  /* ── Extended queries (used by externalTask.controller) ── */

  async searchTasks(
    filters: { topic?: string; status?: string; instanceId?: string },
    page = 1,
    limit = 20,
  ) {
    const pool = getPool();
    const conditions: string[] = [];
    const params: any[] = [];
    let idx = 1;

    if (filters.topic) {
      conditions.push(`topic = $${idx++}`);
      params.push(filters.topic);
    }
    if (filters.status) {
      conditions.push(`status = $${idx++}`);
      params.push(filters.status);
    }
    if (filters.instanceId) {
      conditions.push(`instance_id = $${idx++}`);
      params.push(filters.instanceId);
    }

    const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    const offset = (page - 1) * limit;

    const countSql = `SELECT COUNT(*)::int AS total FROM "wf_external_tasks" ${where}`;
    const dataSql = `SELECT * FROM "wf_external_tasks" ${where} ORDER BY created_at DESC LIMIT $${idx++} OFFSET $${idx++}`;

    const [countRes, dataRes] = await Promise.all([
      pool.query(countSql, params),
      pool.query(dataSql, [...params, limit, offset]),
    ]);

    return {
      data: dataRes.rows.map((r: any) => this.mapRow(r)),
      total: countRes.rows[0]?.total || 0,
      page,
      limit,
      pages: Math.ceil((countRes.rows[0]?.total || 0) / limit),
    };
  }

  async fetchAndLock(topic: string, workerId: string, lockDuration: number, maxTasks = 1): Promise<any[]> {
    const pool = getPool();
    const lockExpiresAt = new Date(Date.now() + lockDuration);
    const locked: any[] = [];

    for (let i = 0; i < maxTasks; i++) {
      const sql = `
        UPDATE "wf_external_tasks"
        SET status = 'locked',
            worker_id = $2,
            lock_expires_at = $3,
            locked_at = NOW(),
            updated_at = NOW()
        WHERE id = (
          SELECT id FROM "wf_external_tasks"
          WHERE topic = $1 AND status = 'available'
          ORDER BY priority DESC, created_at ASC
          LIMIT 1
          FOR UPDATE SKIP LOCKED
        )
        RETURNING *
      `;
      const { rows } = await pool.query(sql, [topic, workerId, lockExpiresAt]);
      if (rows.length === 0) break;
      locked.push(this.mapRow(rows[0]));
    }

    return locked;
  }
}
