/**
 * PostgreSQL Configuration Item Repository
 *
 * Used when DB_STRATEGY_ITSM = 'postgresql'.
 * Maps to itsm_configuration_items table.
 */

import { PostgresRepository } from '../../../../shared/database/PostgresRepository';
import { getPool } from '../../../../shared/database/PostgresConnectionManager';

export class PgConfigurationItemRepository extends PostgresRepository<any> {
  constructor() {
    super({
      tableName: 'itsm_configuration_items',
      columnMap: {
        'ciId': 'ci_id',
        'nameAr': 'name_ar',
        'descriptionAr': 'description_ar',
        'ciType': 'ci_type',
        'organizationId': 'organization_id',
        'ownerId': 'owner_id',
        'ownerName': 'owner_name',
        'technicalOwnerId': 'technical_owner_id',
        'technicalOwnerName': 'technical_owner_name',
        'supportGroupId': 'support_group_id',
        'serialNumber': 'serial_number',
        'assetTag': 'asset_tag',
        'ciModel': 'ci_model',
        'ipAddress': 'ip_address',
        'macAddress': 'mac_address',
        'osVersion': 'os_version',
        'licenseKey': 'license_key',
        'licenseExpiry': 'license_expiry',
        'installDate': 'install_date',
        'lastScanDate': 'last_scan_date',
        'purchaseDate': 'purchase_date',
        'purchaseCost': 'purchase_cost',
        'warrantyExpiry': 'warranty_expiry',
        'maintenanceExpiry': 'maintenance_expiry',
        'maintenanceCost': 'maintenance_cost',
        'parentId': 'parent_id',
        'relatedCIs': 'related_cis',
        'relatedCis': 'related_cis',
        'dependentServices': 'dependent_services',
        'dependentUsers': 'dependent_users',
        'monitoringEnabled': 'monitoring_enabled',
        'monitoringConfig': 'monitoring_config',
        'discoveredAt': 'discovered_at',
        'lastUpdatedAt': 'last_updated_at',
        'lastUpdatedBy': 'last_updated_by',
        'createdBy': 'created_by',
        'discoverySource': 'discovery_source',
        'discoveryId': 'discovery_id',
        'mongoId': 'mongo_id',
      },
    });
  }

  async findByCiId(ciId: string) {
    return this.findOne({ ciId });
  }

  async findByType(ciType: string) {
    return this.findAll({ ciType });
  }

  async findByStatus(status: string) {
    return this.findAll({ status });
  }

  async retire(id: string) {
    return this.updateById(id, { status: 'retired' } as any);
  }

  /**
   * Search with filters (replaces Mongo find + $regex + $or).
   */
  async searchItems(filters: Record<string, any>, page = 1, limit = 25) {
    const pool = getPool();
    const offset = (page - 1) * limit;
    const params: any[] = [];
    let idx = 1;
    const conditions: string[] = [];

    if (filters.ciType) {
      conditions.push(`"ci_type" = $${idx++}`);
      params.push(filters.ciType);
    }
    if (filters.status) {
      conditions.push(`"status" = $${idx++}`);
      params.push(filters.status);
    }
    if (filters.criticality) {
      conditions.push(`"criticality" = $${idx++}`);
      params.push(filters.criticality);
    }
    if (filters.category) {
      conditions.push(`"category" = $${idx++}`);
      params.push(filters.category);
    }
    if (filters.ownerId) {
      conditions.push(`"owner_id"::text = $${idx++}`);
      params.push(filters.ownerId);
    }
    if (filters.department) {
      conditions.push(`"department" = $${idx++}`);
      params.push(filters.department);
    }
    if (filters.location) {
      conditions.push(`"location" = $${idx++}`);
      params.push(filters.location);
    }

    if (filters.q) {
      conditions.push(`(
        "name" ILIKE $${idx} OR
        "description" ILIKE $${idx} OR
        "ci_id" ILIKE $${idx} OR
        "serial_number" ILIKE $${idx} OR
        "hostname" ILIKE $${idx} OR
        "ip_address" ILIKE $${idx}
      )`);
      params.push(`%${filters.q}%`);
      idx++;
    }

    const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    const sortCol = this.toColumn(filters.sort || 'name');
    const sortDir = filters.sortDir === 'desc' ? 'DESC' : 'ASC';

    const [countRes, dataRes] = await Promise.all([
      pool.query(`SELECT COUNT(*)::int AS total FROM "itsm_configuration_items" ${where}`, params),
      pool.query(
        `SELECT * FROM "itsm_configuration_items" ${where}
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
   * Get type counts (replaces Mongo aggregate).
   */
  async getTypeCounts(excludeRetired = true) {
    const pool = getPool();
    const where = excludeRetired ? `WHERE "status" != 'retired'` : '';
    const result = await pool.query(
      `SELECT "ci_type" AS "_id", COUNT(*)::int AS count
       FROM "itsm_configuration_items" ${where}
       GROUP BY "ci_type"
       ORDER BY count DESC`,
    );
    return result.rows;
  }

  /**
   * Get CMDB statistics (replaces multiple Mongo aggregates).
   */
  async getStats() {
    const pool = getPool();
    const [totalRes, statusRes, typeRes, critRes, recentRes] = await Promise.all([
      pool.query(`SELECT COUNT(*)::int AS total FROM "itsm_configuration_items" WHERE "status" != 'retired'`),
      pool.query(`SELECT "status" AS "_id", COUNT(*)::int AS count FROM "itsm_configuration_items" GROUP BY "status"`),
      pool.query(`SELECT "ci_type" AS "_id", COUNT(*)::int AS count FROM "itsm_configuration_items" WHERE "status" != 'retired' GROUP BY "ci_type" ORDER BY count DESC LIMIT 10`),
      pool.query(`SELECT "criticality" AS "_id", COUNT(*)::int AS count FROM "itsm_configuration_items" WHERE "status" != 'retired' GROUP BY "criticality"`),
      pool.query(`SELECT "ci_id", "name", "ci_type", "status", "last_updated_at" FROM "itsm_configuration_items" WHERE "status" != 'retired' ORDER BY "last_updated_at" DESC LIMIT 5`),
    ]);

    return {
      totalItems: totalRes.rows[0]?.total || 0,
      byStatus: statusRes.rows,
      byType: typeRes.rows,
      byCriticality: critRes.rows,
      recentlyUpdated: recentRes.rows.map((r: any) => this.mapRow(r)),
    };
  }

  /**
   * Push to JSONB array (history, relatedCIs).
   */
  async pushToJsonArray(id: string, column: string, item: any) {
    const col = this.toColumn(column);
    await getPool().query(
      `UPDATE "itsm_configuration_items"
       SET "${col}" = "${col}" || $1::jsonb, "updated_at" = NOW()
       WHERE "id" = $2`,
      [JSON.stringify(item), id],
    );
  }
}
