/**
 * PostgreSQL Team Repository
 *
 * Platform-level repository for the `teams` table.
 * Used when DB_STRATEGY_PLATFORM = 'postgresql'.
 */

import { PostgresRepository } from '../PostgresRepository';
import { getPool } from '../PostgresConnectionManager';

export interface PgTeam {
  _id: string;
  id: string;
  mongoId?: string;
  name: string;
  nameAr: string;
  description?: string;
  descriptionAr?: string;
  type: string;
  leaderId?: string;
  isActive: boolean;
  createdBy?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface PgTeamMember {
  teamId: string;
  userId: string;
  role: string;
  joinedAt: Date;
  addedBy?: string;
}

export class PgTeamRepository extends PostgresRepository<PgTeam> {
  constructor() {
    super({
      tableName: 'teams',
      columnMap: {
        '_id': 'id',
        'nameAr': 'name_ar',
        'descriptionAr': 'description_ar',
        'leaderId': 'leader_id',
        'isActive': 'is_active',
        'createdBy': 'created_by',
        'mongoId': 'mongo_id',
      },
    });
  }

  async findByType(type: string): Promise<PgTeam[]> {
    return this.findAll({ type });
  }

  async findActive(): Promise<PgTeam[]> {
    return this.findAll({ isActive: true });
  }

  /**
   * Add a member to a team.
   */
  async addMember(teamId: string, userId: string, role: string = 'member', addedBy?: string): Promise<void> {
    const sql = `
      INSERT INTO "team_members" ("team_id", "user_id", "role", "joined_at", "added_by")
      VALUES ($1, $2, $3, NOW(), $4)
      ON CONFLICT ("team_id", "user_id") DO UPDATE SET "role" = $3
    `;
    await getPool().query(sql, [teamId, userId, role, addedBy || null]);
  }

  /**
   * Remove a member from a team.
   */
  async removeMember(teamId: string, userId: string): Promise<void> {
    const sql = `DELETE FROM "team_members" WHERE "team_id" = $1 AND "user_id" = $2`;
    await getPool().query(sql, [teamId, userId]);
  }

  /**
   * Get all members of a team.
   */
  async getMembers(teamId: string): Promise<PgTeamMember[]> {
    const sql = `
      SELECT "team_id", "user_id", "role", "joined_at", "added_by"
      FROM "team_members"
      WHERE "team_id" = $1
      ORDER BY "joined_at" ASC
    `;
    const result = await getPool().query(sql, [teamId]);
    return result.rows.map((r: any) => ({
      teamId: r.team_id,
      userId: r.user_id,
      role: r.role,
      joinedAt: r.joined_at,
      addedBy: r.added_by,
    }));
  }

  /**
   * Find teams that a user belongs to.
   */
  async findByUserId(userId: string): Promise<PgTeam[]> {
    const sql = `
      SELECT t.* FROM "teams" t
      JOIN "team_members" tm ON tm."team_id" = t."id"
      WHERE tm."user_id" = $1
      ORDER BY t."name" ASC
    `;
    const result = await getPool().query(sql, [userId]);
    return result.rows.map((r: any) => this.mapRow(r));
  }
}
