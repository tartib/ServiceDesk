/**
 * PostgreSQL Project Repository
 *
 * Used when DB_STRATEGY_PM = 'postgresql'.
 * Maps to pm_projects table.
 */

import { PostgresRepository } from '../../../../shared/database/PostgresRepository';
import { getPool } from '../../../../shared/database/PostgresConnectionManager';

export class PgProjectRepository extends PostgresRepository<any> {
  constructor() {
    super({
      tableName: 'pm_projects',
      columnMap: {
        'organizationId': 'organization_id',
        'methodologyCode': 'methodology_code',
        'methodologyCustomizations': 'methodology_customizations',
        'issueTypes': 'issue_types',
        'settings.visibility': 'settings_visibility',
        'settings.allowExternal': 'settings_allow_external',
        'escalationReason': 'escalation_reason',
        'startDate': 'start_date',
        'targetEndDate': 'target_end_date',
        'actualEndDate': 'actual_end_date',
        'createdBy': 'created_by',
        'createdAt': 'created_at',
        'updatedAt': 'updated_at',
        'mongoId': 'mongo_id',
      },
    });
  }

  async findByOrganization(orgId: string) {
    return this.findAll({ organizationId: orgId });
  }

  async findByKey(orgId: string, key: string): Promise<any | null> {
    const pool = getPool();
    const { rows } = await pool.query(
      `SELECT * FROM ${this.tableName} WHERE organization_id = $1 AND key = $2 LIMIT 1`,
      [orgId, key]
    );
    return rows[0] ? this.mapRow(rows[0]) : null;
  }

  async findByOwner(userId: string) {
    return this.findAll({ createdBy: userId });
  }

  /**
   * Search projects with filters, membership check, pagination.
   */
  async searchProjects(
    filters: Record<string, any>,
    userId: string,
    organizationId: string | undefined,
    page: number,
    limit: number,
  ) {
    const pool = getPool();
    const conditions: string[] = [];
    const params: any[] = [];
    let idx = 1;

    // Organization or member-based visibility
    if (organizationId) {
      conditions.push(`(organization_id = $${idx} AND (members @> $${idx + 1}::jsonb OR settings_visibility = 'public'))`);
      params.push(organizationId, JSON.stringify([{ userId }]));
      idx += 2;
    } else {
      conditions.push(`(members @> $${idx}::jsonb OR created_by = $${idx + 1}::uuid OR settings_visibility = 'public')`);
      params.push(JSON.stringify([{ userId }]), userId);
      idx += 2;
    }

    if (filters.status) {
      conditions.push(`status = $${idx++}`);
      params.push(filters.status);
    }
    if (filters.methodology) {
      conditions.push(`methodology_code = $${idx++}`);
      params.push(filters.methodology);
    }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    const offset = (page - 1) * limit;

    const [dataRes, countRes] = await Promise.all([
      pool.query(
        `SELECT * FROM ${this.tableName} ${where} ORDER BY updated_at DESC LIMIT $${idx} OFFSET $${idx + 1}`,
        [...params, limit, offset]
      ),
      pool.query(
        `SELECT COUNT(*)::int AS total FROM ${this.tableName} ${where}`,
        params
      ),
    ]);

    const total = countRes.rows[0]?.total || 0;
    return {
      data: dataRes.rows.map((r: any) => this.mapRow(r)),
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Push an item into a JSONB array column.
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
   * Remove an item from a JSONB array by matching a key/value.
   */
  async removeFromJsonArray(id: string, column: string, matchKey: string, matchValue: string) {
    const pool = getPool();
    const col = this.toColumn(column);
    // Remove elements where matchKey = matchValue
    await pool.query(
      `UPDATE ${this.tableName}
       SET "${col}" = (
         SELECT COALESCE(jsonb_agg(elem), '[]'::jsonb)
         FROM jsonb_array_elements(COALESCE("${col}", '[]'::jsonb)) AS elem
         WHERE elem->>'${matchKey}' != $1
       ),
       updated_at = NOW()
       WHERE id = $2`,
      [matchValue, id]
    );
  }

  /**
   * Update a specific element in a JSONB array.
   */
  async updateJsonArrayElement(id: string, column: string, matchKey: string, matchValue: string, updates: Record<string, any>) {
    const pool = getPool();
    const col = this.toColumn(column);
    // Build SET clauses for the matching element
    const setEntries = Object.entries(updates).map(([k, v]) => `'${k}', '${v}'::jsonb`).join(', ');
    await pool.query(
      `UPDATE ${this.tableName}
       SET "${col}" = (
         SELECT jsonb_agg(
           CASE
             WHEN elem->>'${matchKey}' = $1 THEN elem || jsonb_build_object(${setEntries})
             ELSE elem
           END
         )
         FROM jsonb_array_elements(COALESCE("${col}", '[]'::jsonb)) AS elem
       ),
       updated_at = NOW()
       WHERE id = $2`,
      [matchValue, id]
    );
  }
}
