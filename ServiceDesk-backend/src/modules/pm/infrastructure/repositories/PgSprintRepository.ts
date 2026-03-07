/**
 * PostgreSQL Sprint Repository
 *
 * Used when DB_STRATEGY_PM = 'postgresql'.
 * Maps to pm_sprints table.
 */

import { PostgresRepository } from '../../../../shared/database/PostgresRepository';
import { getPool } from '../../../../shared/database/PostgresConnectionManager';

export class PgSprintRepository extends PostgresRepository<any> {
  constructor() {
    super({
      tableName: 'pm_sprints',
      columnMap: {
        'projectId': 'project_id',
        'organizationId': 'organization_id',
        'startDate': 'start_date',
        'endDate': 'end_date',
        'capacity.planned': 'capacity_planned',
        'capacity.committed': 'capacity_committed',
        'capacity.available': 'capacity_available',
        'capacityPlanned': 'capacity_planned',
        'capacityCommitted': 'capacity_committed',
        'capacityAvailable': 'capacity_available',
        'teamCapacity': 'team_capacity',
        'estimationMethod': 'estimation_method',
        'velocity.planned': 'velocity_planned',
        'velocity.completed': 'velocity_completed',
        'velocity.average': 'velocity_average',
        'velocityPlanned': 'velocity_planned',
        'velocityCompleted': 'velocity_completed',
        'velocityAverage': 'velocity_average',
        'settings.requireGoal': 'settings_require_goal',
        'settings.requireEstimates': 'settings_require_estimates',
        'settings.enforceCapacity': 'settings_enforce_capacity',
        'auditLog': 'audit_log',
        'overCapacityWarning': 'over_capacity_warning',
        'createdBy': 'created_by',
        'createdAt': 'created_at',
        'updatedAt': 'updated_at',
        'mongoId': 'mongo_id',
      },
    });
  }

  /**
   * Get next sprint number for a project.
   */
  async getNextNumber(projectId: string): Promise<number> {
    const pool = getPool();
    const { rows } = await pool.query(
      `SELECT COALESCE(MAX(number), 0) + 1 AS next FROM ${this.tableName} WHERE project_id = $1`,
      [projectId]
    );
    return rows[0]?.next || 1;
  }

  async findByProject(projectId: string, statusFilter?: string | string[]) {
    const pool = getPool();
    const conditions: string[] = [`project_id = $1`];
    const params: any[] = [projectId];
    let idx = 2;

    if (statusFilter) {
      if (Array.isArray(statusFilter)) {
        conditions.push(`status = ANY($${idx++})`);
        params.push(statusFilter);
      } else {
        conditions.push(`status = $${idx++}`);
        params.push(statusFilter);
      }
    }

    const { rows } = await pool.query(
      `SELECT * FROM ${this.tableName} WHERE ${conditions.join(' AND ')} ORDER BY number DESC`,
      params
    );
    return rows.map((r: any) => this.mapRow(r));
  }

  async findActiveSprint(projectId: string): Promise<any | null> {
    const pool = getPool();
    const { rows } = await pool.query(
      `SELECT * FROM ${this.tableName} WHERE project_id = $1 AND status = 'active' ORDER BY number DESC LIMIT 1`,
      [projectId]
    );
    return rows[0] ? this.mapRow(rows[0]) : null;
  }

  /**
   * Push to a JSONB array column (e.g., auditLog).
   */
  async pushToJsonArray(id: string, column: string, item: any) {
    const pool = getPool();
    const col = this.toColumn(column);
    await pool.query(
      `UPDATE ${this.tableName} SET "${col}" = COALESCE("${col}", '[]'::jsonb) || $1::jsonb, updated_at = NOW() WHERE id = $2`,
      [JSON.stringify([item]), id]
    );
  }

  /**
   * Update velocity stats.
   */
  async updateVelocity(id: string, velocity: { planned?: number; completed?: number; average?: number }) {
    const pool = getPool();
    const sets: string[] = [];
    const params: any[] = [];
    let idx = 1;

    if (velocity.planned !== undefined) {
      sets.push(`velocity_planned = $${idx++}`);
      params.push(velocity.planned);
    }
    if (velocity.completed !== undefined) {
      sets.push(`velocity_completed = $${idx++}`);
      params.push(velocity.completed);
    }
    if (velocity.average !== undefined) {
      sets.push(`velocity_average = $${idx++}`);
      params.push(velocity.average);
    }

    if (sets.length === 0) return;

    sets.push('updated_at = NOW()');
    params.push(id);
    await pool.query(
      `UPDATE ${this.tableName} SET ${sets.join(', ')} WHERE id = $${idx}`,
      params
    );
  }
}
