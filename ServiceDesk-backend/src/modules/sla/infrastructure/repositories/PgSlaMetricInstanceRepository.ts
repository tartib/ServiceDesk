/**
 * PostgreSQL SLA Metric Instance Repository
 */

import { getPool } from '../../../../shared/database/PostgresConnectionManager';
import { ISlaMetricInstanceEntity, SlaMetricStatus } from '../../domain';

export class PgSlaMetricInstanceRepository {
  async create(data: Partial<ISlaMetricInstanceEntity>): Promise<ISlaMetricInstanceEntity> {
    const pool = getPool();
    const res = await pool.query(
      `INSERT INTO sla_metric_instances
       (instance_id, goal_id, metric_key, status, target_minutes,
        elapsed_business_seconds, remaining_business_seconds,
        started_at, paused_at, stopped_at, due_at, breached_at,
        last_state_change_at, calendar_id)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)
       RETURNING *`,
      [
        data.instanceId, data.goalId, data.metricKey,
        data.status || SlaMetricStatus.RUNNING,
        data.targetMinutes, data.elapsedBusinessSeconds ?? 0,
        data.remainingBusinessSeconds,
        data.startedAt || new Date(), data.pausedAt, data.stoppedAt,
        data.dueAt, data.breachedAt,
        data.lastStateChangeAt || new Date(), data.calendarId,
      ]
    );
    return this.mapRow(res.rows[0]);
  }

  async findById(id: string): Promise<ISlaMetricInstanceEntity | null> {
    const pool = getPool();
    const res = await pool.query('SELECT * FROM sla_metric_instances WHERE id = $1', [id]);
    return res.rows[0] ? this.mapRow(res.rows[0]) : null;
  }

  async findByInstanceId(instanceId: string): Promise<ISlaMetricInstanceEntity[]> {
    const pool = getPool();
    const res = await pool.query(
      'SELECT * FROM sla_metric_instances WHERE instance_id = $1 ORDER BY metric_key',
      [instanceId]
    );
    return res.rows.map(this.mapRow);
  }

  async findByMetricKey(instanceId: string, metricKey: string): Promise<ISlaMetricInstanceEntity | null> {
    const pool = getPool();
    const res = await pool.query(
      'SELECT * FROM sla_metric_instances WHERE instance_id = $1 AND metric_key = $2',
      [instanceId, metricKey]
    );
    return res.rows[0] ? this.mapRow(res.rows[0]) : null;
  }

  /**
   * Find running metrics that are near or past their due_at.
   * Used by the scheduler for breach detection.
   */
  async findRunningNearBreach(
    warningThresholdSeconds: number,
    limit = 500
  ): Promise<ISlaMetricInstanceEntity[]> {
    const pool = getPool();
    const res = await pool.query(
      `SELECT * FROM sla_metric_instances
       WHERE status = 'running'
         AND due_at IS NOT NULL
         AND due_at <= NOW() + ($1 || ' seconds')::INTERVAL
       ORDER BY due_at ASC
       LIMIT $2`,
      [warningThresholdSeconds, limit]
    );
    return res.rows.map(this.mapRow);
  }

  /**
   * Find running metrics that are past their due_at (breached).
   */
  async findBreached(limit = 500): Promise<ISlaMetricInstanceEntity[]> {
    const pool = getPool();
    const res = await pool.query(
      `SELECT * FROM sla_metric_instances
       WHERE status = 'running'
         AND due_at IS NOT NULL
         AND due_at <= NOW()
         AND breached_at IS NULL
       ORDER BY due_at ASC
       LIMIT $1`,
      [limit]
    );
    return res.rows.map(this.mapRow);
  }

  async update(id: string, data: Partial<ISlaMetricInstanceEntity>): Promise<ISlaMetricInstanceEntity | null> {
    const pool = getPool();
    const sets: string[] = [];
    const vals: unknown[] = [];
    let idx = 1;

    if (data.status !== undefined) { sets.push(`status = $${idx++}`); vals.push(data.status); }
    if (data.elapsedBusinessSeconds !== undefined) { sets.push(`elapsed_business_seconds = $${idx++}`); vals.push(data.elapsedBusinessSeconds); }
    if (data.remainingBusinessSeconds !== undefined) { sets.push(`remaining_business_seconds = $${idx++}`); vals.push(data.remainingBusinessSeconds); }
    if (data.startedAt !== undefined) { sets.push(`started_at = $${idx++}`); vals.push(data.startedAt); }
    if (data.dueAt !== undefined) { sets.push(`due_at = $${idx++}`); vals.push(data.dueAt); }
    if (data.lastStateChangeAt !== undefined) { sets.push(`last_state_change_at = $${idx++}`); vals.push(data.lastStateChangeAt); }

    // Handle nullable fields
    if ('pausedAt' in data) {
      if (data.pausedAt === undefined || data.pausedAt === null) {
        sets.push('paused_at = NULL');
      } else {
        sets.push(`paused_at = $${idx++}`); vals.push(data.pausedAt);
      }
    }
    if ('stoppedAt' in data) {
      if (data.stoppedAt === undefined || data.stoppedAt === null) {
        sets.push('stopped_at = NULL');
      } else {
        sets.push(`stopped_at = $${idx++}`); vals.push(data.stoppedAt);
      }
    }
    if ('breachedAt' in data) {
      if (data.breachedAt === undefined || data.breachedAt === null) {
        sets.push('breached_at = NULL');
      } else {
        sets.push(`breached_at = $${idx++}`); vals.push(data.breachedAt);
      }
    }

    if (sets.length === 0) return this.findById(id);

    vals.push(id);
    const res = await pool.query(
      `UPDATE sla_metric_instances SET ${sets.join(', ')} WHERE id = $${idx} RETURNING *`,
      vals
    );
    return res.rows[0] ? this.mapRow(res.rows[0]) : null;
  }

  private mapRow(row: any): ISlaMetricInstanceEntity {
    return {
      id: row.id,
      instanceId: row.instance_id,
      goalId: row.goal_id,
      metricKey: row.metric_key,
      status: row.status,
      targetMinutes: row.target_minutes,
      elapsedBusinessSeconds: Number(row.elapsed_business_seconds),
      remainingBusinessSeconds: row.remaining_business_seconds != null ? Number(row.remaining_business_seconds) : undefined,
      startedAt: row.started_at,
      pausedAt: row.paused_at,
      stoppedAt: row.stopped_at,
      dueAt: row.due_at,
      breachedAt: row.breached_at,
      lastStateChangeAt: row.last_state_change_at,
      calendarId: row.calendar_id,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }
}
