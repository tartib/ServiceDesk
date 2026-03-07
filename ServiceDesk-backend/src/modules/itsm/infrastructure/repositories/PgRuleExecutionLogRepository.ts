/**
 * PostgreSQL Rule Execution Log Repository
 *
 * Used when DB_STRATEGY_ITSM = 'postgresql'.
 * Maps to itsm_rule_execution_logs table.
 */

import { PostgresRepository } from '../../../../shared/database/PostgresRepository';
import { getPool } from '../../../../shared/database/PostgresConnectionManager';

export class PgRuleExecutionLogRepository extends PostgresRepository<any> {
  constructor() {
    super({
      tableName: 'itsm_rule_execution_logs',
      columnMap: {
        'ruleId': 'rule_id',
        'ruleName': 'rule_name',
        'triggerTicketId': 'trigger_ticket_id',
        'triggerType': 'trigger_type',
        'executionId': 'execution_id',
        'startedAt': 'started_at',
        'completedAt': 'completed_at',
        'durationMs': 'duration_ms',
        'conditionsEvaluated': 'conditions_evaluated',
        'conditionsResult': 'conditions_result',
        'actionsExecuted': 'actions_executed',
        'retryCount': 'retry_count',
        'maxRetries': 'max_retries',
      },
    });
  }

  /**
   * Find logs for a specific rule with pagination.
   */
  async findByRuleId(ruleId: string, filters: Record<string, any> = {}, page = 1, limit = 25) {
    const pool = getPool();
    const offset = (page - 1) * limit;
    const params: any[] = [ruleId];
    let idx = 2;
    const conditions: string[] = [`"rule_id"::text = $1`];

    if (filters.status) {
      conditions.push(`"status" = $${idx++}`);
      params.push(filters.status);
    }

    const where = `WHERE ${conditions.join(' AND ')}`;

    const [countRes, dataRes] = await Promise.all([
      pool.query(`SELECT COUNT(*)::int AS total FROM "itsm_rule_execution_logs" ${where}`, params),
      pool.query(
        `SELECT * FROM "itsm_rule_execution_logs" ${where}
         ORDER BY "started_at" DESC
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
   * Get recent executions.
   */
  async getRecent(limit = 10) {
    const pool = getPool();
    const result = await pool.query(
      `SELECT "rule_name", "status", "duration_ms", "started_at", "trigger_type"
       FROM "itsm_rule_execution_logs"
       ORDER BY "started_at" DESC
       LIMIT $1`,
      [limit],
    );
    return result.rows.map((r: any) => this.mapRow(r));
  }

  /**
   * Get execution statistics (replaces Mongo aggregate).
   */
  async getExecutionStats() {
    const pool = getPool();
    const result = await pool.query(
      `SELECT "status" AS "_id", COUNT(*)::int AS count, AVG("duration_ms")::real AS "avgDuration"
       FROM "itsm_rule_execution_logs"
       GROUP BY "status"`,
    );
    return result.rows;
  }
}
