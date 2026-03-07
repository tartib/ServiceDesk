/**
 * PostgreSQL Automation Rule Repository
 *
 * Used when DB_STRATEGY_ITSM = 'postgresql'.
 * Maps to itsm_automation_rules table.
 */

import { PostgresRepository } from '../../../../shared/database/PostgresRepository';
import { getPool } from '../../../../shared/database/PostgresConnectionManager';

export class PgAutomationRuleRepository extends PostgresRepository<any> {
  constructor() {
    super({
      tableName: 'itsm_automation_rules',
      columnMap: {
        'ruleId': 'rule_id',
        'nameAr': 'name_ar',
        'descriptionAr': 'description_ar',
        'organizationId': 'organization_id',
        'isValid': 'is_valid',
        'validationErrors': 'validation_errors',
        'createdBy': 'created_by',
        'updatedBy': 'updated_by',
        'mongoId': 'mongo_id',
        // stats flattened
        'stats.executionCount': 'stats_execution_count',
        'stats.successCount': 'stats_success_count',
        'stats.failureCount': 'stats_failure_count',
        'stats.lastExecutedAt': 'stats_last_executed_at',
        'stats.lastExecutionStatus': 'stats_last_execution_status',
        'stats.avgExecutionTimeMs': 'stats_avg_execution_time_ms',
      },
    });
  }

  async findByRuleId(ruleId: string) {
    return this.findOne({ ruleId });
  }

  async findByStatus(status: string) {
    return this.findAll({ status });
  }

  async findActiveRules() {
    return this.findAll({ status: 'active', isValid: true });
  }

  async deactivate(id: string) {
    return this.updateById(id, { status: 'inactive' } as any);
  }

  /**
   * Search rules with filters.
   */
  async searchRules(filters: Record<string, any>, page = 1, limit = 25) {
    const pool = getPool();
    const offset = (page - 1) * limit;
    const params: any[] = [];
    let idx = 1;
    const conditions: string[] = [];

    if (filters.status) {
      conditions.push(`"status" = $${idx++}`);
      params.push(filters.status);
    }
    if (filters.triggerType) {
      conditions.push(`"trigger"->>'type' = $${idx++}`);
      params.push(filters.triggerType);
    }
    if (filters.q) {
      conditions.push(`(
        "name" ILIKE $${idx} OR
        "description" ILIKE $${idx} OR
        "rule_id" ILIKE $${idx}
      )`);
      params.push(`%${filters.q}%`);
      idx++;
    }

    const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    const sortCol = this.toColumn(filters.sort || 'createdAt');
    const sortDir = filters.sortDir === 'asc' ? 'ASC' : 'DESC';

    const [countRes, dataRes] = await Promise.all([
      pool.query(`SELECT COUNT(*)::int AS total FROM "itsm_automation_rules" ${where}`, params),
      pool.query(
        `SELECT * FROM "itsm_automation_rules" ${where}
         ORDER BY "${sortCol}" ${sortDir}
         LIMIT $${idx} OFFSET $${idx + 1}`,
        [...params, limit, offset],
      ),
    ]);

    return {
      data: dataRes.rows.map((r: any) => this.mapRow(r)),
      total: countRes.rows[0]?.total || 0,
      page,
      limit,
      totalPages: Math.ceil((countRes.rows[0]?.total || 0) / limit),
    };
  }

  /**
   * Get automation statistics (replaces multiple Mongo aggregates).
   */
  async getStats() {
    const pool = getPool();
    const [totalRes, activeRes, statusRes, triggerRes] = await Promise.all([
      pool.query(`SELECT COUNT(*)::int AS total FROM "itsm_automation_rules"`),
      pool.query(`SELECT COUNT(*)::int AS total FROM "itsm_automation_rules" WHERE "status" = 'active'`),
      pool.query(`SELECT "status" AS "_id", COUNT(*)::int AS count FROM "itsm_automation_rules" GROUP BY "status"`),
      pool.query(`SELECT "trigger"->>'type' AS "_id", COUNT(*)::int AS count FROM "itsm_automation_rules" WHERE "status" = 'active' GROUP BY "trigger"->>'type' ORDER BY count DESC`),
    ]);

    return {
      totalRules: totalRes.rows[0]?.total || 0,
      activeRules: activeRes.rows[0]?.total || 0,
      byStatus: statusRes.rows,
      byTrigger: triggerRes.rows,
    };
  }

  /**
   * Push to JSONB array (history).
   */
  async pushToJsonArray(id: string, column: string, item: any) {
    const col = this.toColumn(column);
    await getPool().query(
      `UPDATE "itsm_automation_rules"
       SET "${col}" = "${col}" || $1::jsonb, "updated_at" = NOW()
       WHERE "id" = $2`,
      [JSON.stringify(item), id],
    );
  }

  /**
   * Increment version.
   */
  async incrementVersion(id: string) {
    await getPool().query(
      `UPDATE "itsm_automation_rules" SET "version" = "version" + 1, "updated_at" = NOW() WHERE "id" = $1`,
      [id],
    );
  }
}
