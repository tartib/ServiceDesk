/**
 * PostgreSQL Service Catalog Repository
 *
 * Used when DB_STRATEGY_ITSM = 'postgresql'.
 * Maps to itsm_service_catalogs table.
 */

import { PostgresRepository } from '../../../../shared/database/PostgresRepository';
import { getPool } from '../../../../shared/database/PostgresConnectionManager';

export class PgServiceCatalogRepository extends PostgresRepository<any> {
  constructor() {
    super({
      tableName: 'itsm_service_catalogs',
      columnMap: {
        'serviceId': 'service_id',
        'nameAr': 'name_ar',
        'descriptionAr': 'description_ar',
        'shortDescription': 'short_description',
        'shortDescriptionAr': 'short_description_ar',
        'requestForm': 'request_form',
        'workflowId': 'workflow_id',
        'approvalRequired': 'approval_required',
        'fulfillmentType': 'fulfillment_type',
        'fulfillmentTeam': 'fulfillment_team',
        'autoAssignee': 'auto_assignee',
        'fulfillmentWorkflowId': 'fulfillment_workflow_id',
        'estimatedFulfillmentTime': 'estimated_fulfillment_time',
        'slaTemplateId': 'sla_template_id',
        'allowedRoles': 'allowed_roles',
        'allowedDepartments': 'allowed_departments',
        'createdBy': 'created_by',
        'updatedBy': 'updated_by',
        'mongoId': 'mongo_id',
        'isActive': 'is_active',
        // stats flattened
        'stats.totalRequests': 'stats_total_requests',
        'stats.completedRequests': 'stats_completed_requests',
        'stats.avgFulfillmentTime': 'stats_avg_fulfillment_time',
        'stats.satisfactionScore': 'stats_satisfaction_score',
        'stats.lastRequestedAt': 'stats_last_requested_at',
      },
    });
  }

  async findByCategory(category: string) {
    return this.findAll({ category });
  }

  async findActive() {
    return this.findAll({ status: 'active' });
  }

  async findByServiceId(serviceId: string) {
    return this.findOne({ serviceId });
  }

  /**
   * Text search across name, nameAr, description, tags.
   * PG equivalent of $regex + $or.
   */
  async search(q: string, filters: Record<string, any> = {}, page = 1, limit = 25) {
    const pool = getPool();
    const offset = (page - 1) * limit;
    const params: any[] = [];
    let idx = 1;

    const conditions: string[] = [];

    // Text search
    if (q) {
      conditions.push(`(
        "name" ILIKE $${idx} OR
        "name_ar" ILIKE $${idx} OR
        "description" ILIKE $${idx} OR
        $${idx + 1} = ANY("tags")
      )`);
      params.push(`%${q}%`, q);
      idx += 2;
    }

    if (filters.status) {
      conditions.push(`"status" = $${idx++}`);
      params.push(filters.status);
    }
    if (filters.category) {
      conditions.push(`"category" = $${idx++}`);
      params.push(filters.category);
    }
    if (filters.featured !== undefined) {
      conditions.push(`"featured" = $${idx++}`);
      params.push(filters.featured);
    }
    if (filters.visibility) {
      conditions.push(`"visibility" = $${idx++}`);
      params.push(filters.visibility);
    }

    const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const [countRes, dataRes] = await Promise.all([
      pool.query(`SELECT COUNT(*)::int AS total FROM "itsm_service_catalogs" ${where}`, params),
      pool.query(
        `SELECT * FROM "itsm_service_catalogs" ${where}
         ORDER BY "${this.toColumn(filters.sort || 'order')}" ${filters.sortDir === 'desc' ? 'DESC' : 'ASC'}
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
   * Visibility-filtered search (mirrors the Mongo $and/$or visibility logic).
   */
  async searchWithVisibility(
    q: string,
    filters: Record<string, any>,
    itsmRole: string,
    page = 1,
    limit = 25,
  ) {
    const pool = getPool();
    const offset = (page - 1) * limit;
    const params: any[] = [];
    let idx = 1;
    const conditions: string[] = [];

    if (filters.status) {
      conditions.push(`"status" = $${idx++}`);
      params.push(filters.status);
    }
    if (filters.category) {
      conditions.push(`"category" = $${idx++}`);
      params.push(filters.category);
    }
    if (filters.featured !== undefined) {
      conditions.push(`"featured" = $${idx++}`);
      params.push(filters.featured);
    }
    if (filters.visibility) {
      conditions.push(`"visibility" = $${idx++}`);
      params.push(filters.visibility);
    }

    if (q) {
      conditions.push(`(
        "name" ILIKE $${idx} OR
        "name_ar" ILIKE $${idx} OR
        "description" ILIKE $${idx} OR
        $${idx + 1} = ANY("tags")
      )`);
      params.push(`%${q}%`, q);
      idx += 2;
    }

    // Visibility filter for non-admins
    if (itsmRole !== 'manager' && itsmRole !== 'admin') {
      conditions.push(`(
        "visibility" = 'public' OR
        "visibility" = 'internal' OR
        ("visibility" = 'restricted' AND $${idx} = ANY("allowed_roles"))
      )`);
      params.push(itsmRole);
      idx++;
    }

    const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    const sortCol = this.toColumn(filters.sort || 'order');
    const sortDir = filters.sortDir === 'desc' ? 'DESC' : 'ASC';

    const [countRes, dataRes] = await Promise.all([
      pool.query(`SELECT COUNT(*)::int AS total FROM "itsm_service_catalogs" ${where}`, params),
      pool.query(
        `SELECT * FROM "itsm_service_catalogs" ${where}
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
   * Get category counts (replaces Mongo aggregate).
   */
  async getCategoryCounts(activeOnly = true) {
    const pool = getPool();
    const where = activeOnly ? `WHERE "status" = 'active'` : '';
    const result = await pool.query(
      `SELECT "category", COUNT(*)::int AS count
       FROM "itsm_service_catalogs" ${where}
       GROUP BY "category"`,
    );
    return result.rows;
  }

  /**
   * Increment stats (replaces Mongo $inc).
   */
  async incrementStats(id: string, field: string, value = 1): Promise<void> {
    const colMap: Record<string, string> = {
      'stats.totalRequests': 'stats_total_requests',
      'stats.completedRequests': 'stats_completed_requests',
      'totalRequests': 'stats_total_requests',
      'completedRequests': 'stats_completed_requests',
    };
    const col = colMap[field] || this.toColumn(field);
    await getPool().query(
      `UPDATE "itsm_service_catalogs" SET "${col}" = "${col}" + $1, "stats_last_requested_at" = NOW() WHERE "id" = $2`,
      [value, id],
    );
  }
}
