/**
 * PostgreSQL SLA Policy Repository
 *
 * Handles CRUD for sla_policies, sla_goals, and sla_escalation_rules.
 */

import { getPool } from '../../../../shared/database/PostgresConnectionManager';
import {
  ISlaPolicyEntity,
  ISlaGoalEntity,
  ISlaEscalationRuleEntity,
  ISlaMatchCondition,
} from '../../domain';

export class PgSlaPolicyRepository {
  // ── Policy CRUD ────────────────────────────────────────────

  async create(data: Partial<ISlaPolicyEntity>): Promise<ISlaPolicyEntity> {
    const pool = getPool();
    const res = await pool.query(
      `INSERT INTO sla_policies (tenant_id, code, name, name_ar, description, description_ar, entity_type, priority, match_conditions, is_active, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
       RETURNING *`,
      [
        data.tenantId, data.code, data.name, data.nameAr,
        data.description, data.descriptionAr, data.entityType,
        data.priority ?? 100, JSON.stringify(data.matchConditions || []),
        data.isActive ?? true, data.createdBy,
      ]
    );
    return this.mapRow(res.rows[0]);
  }

  async findById(id: string): Promise<ISlaPolicyEntity | null> {
    const pool = getPool();
    const res = await pool.query('SELECT * FROM sla_policies WHERE id = $1', [id]);
    return res.rows[0] ? this.mapRow(res.rows[0]) : null;
  }

  async findByCode(tenantId: string, code: string): Promise<ISlaPolicyEntity | null> {
    const pool = getPool();
    const res = await pool.query(
      'SELECT * FROM sla_policies WHERE tenant_id = $1 AND code = $2',
      [tenantId, code]
    );
    return res.rows[0] ? this.mapRow(res.rows[0]) : null;
  }

  async findActiveByEntityType(tenantId: string, entityType: string): Promise<ISlaPolicyEntity[]> {
    const pool = getPool();
    const res = await pool.query(
      `SELECT * FROM sla_policies
       WHERE tenant_id = $1 AND entity_type = $2 AND is_active = TRUE
       ORDER BY priority ASC`,
      [tenantId, entityType]
    );
    return res.rows.map(this.mapRow);
  }

  async search(
    tenantId: string,
    filters: { entityType?: string; isActive?: boolean; search?: string },
    page = 1,
    limit = 50
  ): Promise<{ data: ISlaPolicyEntity[]; total: number }> {
    const pool = getPool();
    const conditions: string[] = ['tenant_id = $1'];
    const vals: unknown[] = [tenantId];
    let idx = 2;

    if (filters.entityType) {
      conditions.push(`entity_type = $${idx++}`);
      vals.push(filters.entityType);
    }
    if (filters.isActive !== undefined) {
      conditions.push(`is_active = $${idx++}`);
      vals.push(filters.isActive);
    }
    if (filters.search) {
      conditions.push(`(name ILIKE $${idx} OR code ILIKE $${idx})`);
      vals.push(`%${filters.search}%`);
      idx++;
    }

    const where = conditions.join(' AND ');
    const offset = (page - 1) * limit;

    const [dataRes, countRes] = await Promise.all([
      pool.query(
        `SELECT * FROM sla_policies WHERE ${where} ORDER BY priority ASC LIMIT $${idx++} OFFSET $${idx++}`,
        [...vals, limit, offset]
      ),
      pool.query(`SELECT COUNT(*)::int AS total FROM sla_policies WHERE ${where}`, vals),
    ]);

    return {
      data: dataRes.rows.map(this.mapRow),
      total: countRes.rows[0]?.total || 0,
    };
  }

  async update(id: string, data: Partial<ISlaPolicyEntity>): Promise<ISlaPolicyEntity | null> {
    const pool = getPool();
    const sets: string[] = [];
    const vals: unknown[] = [];
    let idx = 1;

    if (data.name !== undefined) { sets.push(`name = $${idx++}`); vals.push(data.name); }
    if (data.nameAr !== undefined) { sets.push(`name_ar = $${idx++}`); vals.push(data.nameAr); }
    if (data.description !== undefined) { sets.push(`description = $${idx++}`); vals.push(data.description); }
    if (data.descriptionAr !== undefined) { sets.push(`description_ar = $${idx++}`); vals.push(data.descriptionAr); }
    if (data.entityType !== undefined) { sets.push(`entity_type = $${idx++}`); vals.push(data.entityType); }
    if (data.priority !== undefined) { sets.push(`priority = $${idx++}`); vals.push(data.priority); }
    if (data.matchConditions !== undefined) { sets.push(`match_conditions = $${idx++}`); vals.push(JSON.stringify(data.matchConditions)); }
    if (data.isActive !== undefined) { sets.push(`is_active = $${idx++}`); vals.push(data.isActive); }

    if (sets.length === 0) return this.findById(id);

    vals.push(id);
    const res = await pool.query(
      `UPDATE sla_policies SET ${sets.join(', ')} WHERE id = $${idx} RETURNING *`,
      vals
    );
    return res.rows[0] ? this.mapRow(res.rows[0]) : null;
  }

  async delete(id: string): Promise<boolean> {
    const pool = getPool();
    const res = await pool.query('DELETE FROM sla_policies WHERE id = $1', [id]);
    return (res.rowCount ?? 0) > 0;
  }

  async activate(id: string): Promise<ISlaPolicyEntity | null> {
    return this.update(id, { isActive: true });
  }

  async deactivate(id: string): Promise<ISlaPolicyEntity | null> {
    return this.update(id, { isActive: false });
  }

  // ── Goals ──────────────────────────────────────────────────

  async createGoal(data: Partial<ISlaGoalEntity>): Promise<ISlaGoalEntity> {
    const pool = getPool();
    const res = await pool.query(
      `INSERT INTO sla_goals (policy_id, metric_key, target_minutes, calendar_id, start_event, stop_event, pause_on_statuses, resume_on_statuses, breach_severity)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING *`,
      [
        data.policyId, data.metricKey, data.targetMinutes, data.calendarId,
        data.startEvent, data.stopEvent,
        JSON.stringify(data.pauseOnStatuses || []),
        JSON.stringify(data.resumeOnStatuses || []),
        data.breachSeverity || 'warning',
      ]
    );
    return this.mapGoalRow(res.rows[0]);
  }

  async findGoalsByPolicyId(policyId: string): Promise<ISlaGoalEntity[]> {
    const pool = getPool();
    const res = await pool.query(
      'SELECT * FROM sla_goals WHERE policy_id = $1 ORDER BY metric_key',
      [policyId]
    );
    return res.rows.map(this.mapGoalRow);
  }

  async findGoalById(id: string): Promise<ISlaGoalEntity | null> {
    const pool = getPool();
    const res = await pool.query('SELECT * FROM sla_goals WHERE id = $1', [id]);
    return res.rows[0] ? this.mapGoalRow(res.rows[0]) : null;
  }

  async updateGoal(id: string, data: Partial<ISlaGoalEntity>): Promise<ISlaGoalEntity | null> {
    const pool = getPool();
    const sets: string[] = [];
    const vals: unknown[] = [];
    let idx = 1;

    if (data.targetMinutes !== undefined) { sets.push(`target_minutes = $${idx++}`); vals.push(data.targetMinutes); }
    if (data.calendarId !== undefined) { sets.push(`calendar_id = $${idx++}`); vals.push(data.calendarId); }
    if (data.startEvent !== undefined) { sets.push(`start_event = $${idx++}`); vals.push(data.startEvent); }
    if (data.stopEvent !== undefined) { sets.push(`stop_event = $${idx++}`); vals.push(data.stopEvent); }
    if (data.pauseOnStatuses !== undefined) { sets.push(`pause_on_statuses = $${idx++}`); vals.push(JSON.stringify(data.pauseOnStatuses)); }
    if (data.resumeOnStatuses !== undefined) { sets.push(`resume_on_statuses = $${idx++}`); vals.push(JSON.stringify(data.resumeOnStatuses)); }
    if (data.breachSeverity !== undefined) { sets.push(`breach_severity = $${idx++}`); vals.push(data.breachSeverity); }

    if (sets.length === 0) return this.findGoalById(id);

    vals.push(id);
    const res = await pool.query(
      `UPDATE sla_goals SET ${sets.join(', ')} WHERE id = $${idx} RETURNING *`,
      vals
    );
    return res.rows[0] ? this.mapGoalRow(res.rows[0]) : null;
  }

  async deleteGoal(id: string): Promise<boolean> {
    const pool = getPool();
    const res = await pool.query('DELETE FROM sla_goals WHERE id = $1', [id]);
    return (res.rowCount ?? 0) > 0;
  }

  // ── Escalation Rules ───────────────────────────────────────

  async createEscalationRule(data: Partial<ISlaEscalationRuleEntity>): Promise<ISlaEscalationRuleEntity> {
    const pool = getPool();
    const res = await pool.query(
      `INSERT INTO sla_escalation_rules (goal_id, trigger_type, offset_minutes, action_type, action_config, is_active, sort_order)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [
        data.goalId, data.triggerType, data.offsetMinutes ?? 0,
        data.actionType, JSON.stringify(data.actionConfig || {}),
        data.isActive ?? true, data.sortOrder ?? 0,
      ]
    );
    return this.mapEscalationRow(res.rows[0]);
  }

  async findEscalationRulesByGoalId(goalId: string): Promise<ISlaEscalationRuleEntity[]> {
    const pool = getPool();
    const res = await pool.query(
      'SELECT * FROM sla_escalation_rules WHERE goal_id = $1 ORDER BY sort_order',
      [goalId]
    );
    return res.rows.map(this.mapEscalationRow);
  }

  async deleteEscalationRule(id: string): Promise<boolean> {
    const pool = getPool();
    const res = await pool.query('DELETE FROM sla_escalation_rules WHERE id = $1', [id]);
    return (res.rowCount ?? 0) > 0;
  }

  // ── Row mappers ────────────────────────────────────────────

  private mapRow(row: any): ISlaPolicyEntity {
    return {
      id: row.id,
      tenantId: row.tenant_id,
      code: row.code,
      name: row.name,
      nameAr: row.name_ar,
      description: row.description,
      descriptionAr: row.description_ar,
      entityType: row.entity_type,
      priority: row.priority,
      matchConditions: typeof row.match_conditions === 'string'
        ? JSON.parse(row.match_conditions)
        : (row.match_conditions || []),
      isActive: row.is_active,
      createdBy: row.created_by,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  private mapGoalRow(row: any): ISlaGoalEntity {
    return {
      id: row.id,
      policyId: row.policy_id,
      metricKey: row.metric_key,
      targetMinutes: row.target_minutes,
      calendarId: row.calendar_id,
      startEvent: row.start_event,
      stopEvent: row.stop_event,
      pauseOnStatuses: typeof row.pause_on_statuses === 'string'
        ? JSON.parse(row.pause_on_statuses)
        : (row.pause_on_statuses || []),
      resumeOnStatuses: typeof row.resume_on_statuses === 'string'
        ? JSON.parse(row.resume_on_statuses)
        : (row.resume_on_statuses || []),
      breachSeverity: row.breach_severity,
      createdAt: row.created_at,
    };
  }

  private mapEscalationRow(row: any): ISlaEscalationRuleEntity {
    return {
      id: row.id,
      goalId: row.goal_id,
      triggerType: row.trigger_type,
      offsetMinutes: row.offset_minutes,
      actionType: row.action_type,
      actionConfig: typeof row.action_config === 'string'
        ? JSON.parse(row.action_config)
        : (row.action_config || {}),
      isActive: row.is_active,
      sortOrder: row.sort_order,
      createdAt: row.created_at,
    };
  }
}
