/**
 * PostgreSQL CI Relationship Repository
 *
 * Used when DB_STRATEGY_ITSM = 'postgresql'.
 * Maps to itsm_ci_relationships table.
 */

import { PostgresRepository } from '../../../../shared/database/PostgresRepository';
import { getPool } from '../../../../shared/database/PostgresConnectionManager';

export class PgCIRelationshipRepository extends PostgresRepository<any> {
  constructor() {
    super({
      tableName: 'itsm_ci_relationships',
      columnMap: {
        'sourceId': 'source_id',
        'targetId': 'target_id',
        'relationshipType': 'relationship_type',
        'isAutomatic': 'is_automatic',
        'discoveryRule': 'discovery_rule',
        'createdBy': 'created_by',
      },
    });
  }

  /**
   * Find all relationships for a given CI (as source or target).
   */
  async findByCiId(ciId: string) {
    const pool = getPool();
    const sql = `
      SELECT * FROM "itsm_ci_relationships"
      WHERE "source_id"::text = $1 OR "target_id"::text = $1
    `;
    const result = await pool.query(sql, [ciId]);
    return result.rows.map((r: any) => this.mapRow(r));
  }

  /**
   * Check if a relationship already exists between two CIs.
   */
  async existsBetween(sourceId: string, targetId: string): Promise<boolean> {
    const pool = getPool();
    const result = await pool.query(
      `SELECT 1 FROM "itsm_ci_relationships" WHERE "source_id"::text = $1 AND "target_id"::text = $2 LIMIT 1`,
      [sourceId, targetId],
    );
    return result.rows.length > 0;
  }

  /**
   * Delete by ID and return the deleted relationship (for cleanup of relatedCIs on both CIs).
   */
  async deleteAndReturn(id: string) {
    const pool = getPool();
    const result = await pool.query(
      `DELETE FROM "itsm_ci_relationships" WHERE "id"::text = $1 RETURNING *`,
      [id],
    );
    return result.rows.length > 0 ? this.mapRow(result.rows[0]) : null;
  }

  /**
   * Count total relationships.
   */
  async countAll(): Promise<number> {
    const pool = getPool();
    const result = await pool.query(`SELECT COUNT(*)::int AS total FROM "itsm_ci_relationships"`);
    return result.rows[0]?.total || 0;
  }
}
