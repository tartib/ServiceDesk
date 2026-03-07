/**
 * PostgreSQL Organization Repository
 *
 * Platform-level repository for the `organizations` table.
 * Used when DB_STRATEGY_PLATFORM = 'postgresql'.
 */

import { PostgresRepository } from '../PostgresRepository';
import { getPool } from '../PostgresConnectionManager';

export interface PgOrganization {
  _id: string;
  id: string;
  mongoId?: string;
  name: string;
  slug: string;
  description?: string;
  logo?: string;
  defaultMethodology: string;
  timezone: string;
  dateFormat: string;
  workingDays: number[];
  workingHoursStart: string;
  workingHoursEnd: string;
  subscriptionPlan: string;
  subscriptionValidUntil?: Date;
  maxProjects: number;
  maxUsers: number;
  maxStorage: number;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface PgUserOrganization {
  userId: string;
  organizationId: string;
  role: string;
  joinedAt: Date;
}

export class PgOrganizationRepository extends PostgresRepository<PgOrganization> {
  constructor() {
    super({
      tableName: 'organizations',
      columnMap: {
        '_id': 'id',
        'mongoId': 'mongo_id',
        'defaultMethodology': 'default_methodology',
        'dateFormat': 'date_format',
        'workingDays': 'working_days',
        'workingHoursStart': 'working_hours_start',
        'workingHoursEnd': 'working_hours_end',
        'subscriptionPlan': 'subscription_plan',
        'subscriptionValidUntil': 'subscription_valid_until',
        'maxProjects': 'max_projects',
        'maxUsers': 'max_users',
        'maxStorage': 'max_storage',
        'createdBy': 'created_by',
      },
    });
  }

  async findBySlug(slug: string): Promise<PgOrganization | null> {
    return this.findOne({ slug });
  }

  /**
   * Add a user to an organization.
   */
  async addMember(organizationId: string, userId: string, role: string = 'member'): Promise<void> {
    const sql = `
      INSERT INTO "user_organizations" ("user_id", "organization_id", "role", "joined_at")
      VALUES ($1, $2, $3, NOW())
      ON CONFLICT ("user_id", "organization_id") DO UPDATE SET "role" = $3
    `;
    await getPool().query(sql, [userId, organizationId, role]);
  }

  /**
   * Remove a user from an organization.
   */
  async removeMember(organizationId: string, userId: string): Promise<void> {
    const sql = `DELETE FROM "user_organizations" WHERE "organization_id" = $1 AND "user_id" = $2`;
    await getPool().query(sql, [organizationId, userId]);
  }

  /**
   * Get all members of an organization.
   */
  async getMembers(organizationId: string): Promise<PgUserOrganization[]> {
    const sql = `
      SELECT "user_id", "organization_id", "role", "joined_at"
      FROM "user_organizations"
      WHERE "organization_id" = $1
      ORDER BY "joined_at" ASC
    `;
    const result = await getPool().query(sql, [organizationId]);
    return result.rows.map((r: any) => ({
      userId: r.user_id,
      organizationId: r.organization_id,
      role: r.role,
      joinedAt: r.joined_at,
    }));
  }

  /**
   * Find organizations that a user belongs to.
   */
  async findByUserId(userId: string): Promise<PgOrganization[]> {
    const sql = `
      SELECT o.* FROM "organizations" o
      JOIN "user_organizations" uo ON uo."organization_id" = o."id"
      WHERE uo."user_id" = $1
      ORDER BY o."name" ASC
    `;
    const result = await getPool().query(sql, [userId]);
    return result.rows.map((r: any) => this.mapRow(r));
  }
}
