/**
 * PostgreSQL User Repository
 *
 * Platform-level repository for the `users` table.
 * Used when DB_STRATEGY_PLATFORM = 'postgresql'.
 */

import { PostgresRepository } from '../PostgresRepository';
import { getPool } from '../PostgresConnectionManager';

export interface PgUser {
  _id: string;
  id: string;
  mongoId?: string;
  name: string;
  email: string;
  password: string;
  role: string;
  itsmRole: string;
  profileFirstName?: string;
  profileLastName?: string;
  profileAvatar?: string;
  profileBio?: string;
  profileTitle?: string;
  phone?: string;
  department?: string;
  isActive: boolean;
  fcmToken?: string;
  createdAt: Date;
  updatedAt: Date;
}

export class PgUserRepository extends PostgresRepository<PgUser> {
  constructor() {
    super({
      tableName: 'users',
      columnMap: {
        '_id': 'id',
        'itsmRole': 'itsm_role',
        'profileFirstName': 'profile_first_name',
        'profileLastName': 'profile_last_name',
        'profileAvatar': 'profile_avatar',
        'profileBio': 'profile_bio',
        'profileTitle': 'profile_title',
        'isActive': 'is_active',
        'fcmToken': 'fcm_token',
        'mongoId': 'mongo_id',
      },
    });
  }

  async findByEmail(email: string): Promise<PgUser | null> {
    return this.findOne({ email });
  }

  async findByRole(role: string): Promise<PgUser[]> {
    return this.findAll({ role });
  }

  async findActiveUsers(): Promise<PgUser[]> {
    return this.findAll({ isActive: true });
  }

  async deactivate(id: string): Promise<PgUser | null> {
    return this.updateById(id, { isActive: false } as any);
  }

  /**
   * Find users belonging to a specific team (via team_members join table).
   */
  async findByTeam(teamId: string): Promise<PgUser[]> {
    const sql = `
      SELECT u.* FROM "users" u
      JOIN "team_members" tm ON tm."user_id" = u."id"
      WHERE tm."team_id" = $1
      ORDER BY u."name" ASC
    `;
    const result = await getPool().query(sql, [teamId]);
    return result.rows.map((r: any) => this.mapRow(r));
  }

  /**
   * Find users belonging to a specific organization (via user_organizations join table).
   */
  async findByOrganization(organizationId: string): Promise<PgUser[]> {
    const sql = `
      SELECT u.* FROM "users" u
      JOIN "user_organizations" uo ON uo."user_id" = u."id"
      WHERE uo."organization_id" = $1
      ORDER BY u."name" ASC
    `;
    const result = await getPool().query(sql, [organizationId]);
    return result.rows.map((r: any) => this.mapRow(r));
  }
}
