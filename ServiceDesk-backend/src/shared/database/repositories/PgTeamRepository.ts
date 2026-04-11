/**
 * PostgreSQL Team Repository
 *
 * Platform-level repository for the `teams` table.
 * Used when DB_STRATEGY_PLATFORM = 'postgresql'.
 * Supports unified enterprise model: scope, visibility, organizationId, projectId, capacity.
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
  scope: string;
  visibility: string;
  organizationId?: string;
  projectId?: string;
  leaderId?: string;
  capacity?: Record<string, unknown>;
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

export interface PgTeamAuditLog {
  id: string;
  teamId: string;
  action: string;
  actorId: string;
  targetUserId?: string;
  beforeData?: Record<string, unknown>;
  afterData?: Record<string, unknown>;
  note?: string;
  createdAt: Date;
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
        'organizationId': 'organization_id',
        'projectId': 'project_id',
      },
    });
  }

  async findByType(type: string): Promise<PgTeam[]> {
    return this.findAll({ type });
  }

  async findActive(): Promise<PgTeam[]> {
    return this.findAll({ isActive: true });
  }

  async findByScope(scope: string): Promise<PgTeam[]> {
    return this.findAll({ scope });
  }

  async findByOrganization(organizationId: string): Promise<PgTeam[]> {
    return this.findAll({ organizationId });
  }

  async findByProject(projectId: string): Promise<PgTeam[]> {
    return this.findAll({ projectId });
  }

  /**
   * Add a member to a team (upserts role on conflict).
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
   * Update a single member's role.
   */
  async updateMemberRole(teamId: string, userId: string, role: string): Promise<void> {
    const sql = `UPDATE "team_members" SET "role" = $1 WHERE "team_id" = $2 AND "user_id" = $3`;
    await getPool().query(sql, [role, teamId, userId]);
  }

  /**
   * Transfer team lead: demote current leader, promote new leader, update teams.leader_id.
   */
  async transferLead(teamId: string, newLeaderId: string): Promise<void> {
    const pool = getPool();
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      await client.query(
        `UPDATE "team_members" SET "role" = 'member' WHERE "team_id" = $1 AND "role" = 'leader'`,
        [teamId]
      );
      await client.query(
        `UPDATE "team_members" SET "role" = 'leader' WHERE "team_id" = $1 AND "user_id" = $2`,
        [teamId, newLeaderId]
      );
      await client.query(
        `UPDATE "teams" SET "leader_id" = $1, "updated_at" = NOW() WHERE "id" = $2`,
        [newLeaderId, teamId]
      );
      await client.query('COMMIT');
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
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

/**
 * PostgreSQL Team Audit Log Repository
 */
export class PgTeamAuditLogRepository {
  async create(entry: Omit<PgTeamAuditLog, 'id' | 'createdAt'>): Promise<PgTeamAuditLog> {
    const sql = `
      INSERT INTO "team_audit_logs"
        ("team_id", "action", "actor_id", "target_user_id", "before_data", "after_data", "note")
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `;
    const result = await getPool().query(sql, [
      entry.teamId,
      entry.action,
      entry.actorId,
      entry.targetUserId || null,
      entry.beforeData ? JSON.stringify(entry.beforeData) : null,
      entry.afterData ? JSON.stringify(entry.afterData) : null,
      entry.note || null,
    ]);
    return this.mapRow(result.rows[0]);
  }

  async findByTeam(teamId: string, page = 1, limit = 20): Promise<{ rows: PgTeamAuditLog[]; total: number }> {
    const offset = (page - 1) * limit;
    const [dataResult, countResult] = await Promise.all([
      getPool().query(
        `SELECT * FROM "team_audit_logs" WHERE "team_id" = $1 ORDER BY "created_at" DESC LIMIT $2 OFFSET $3`,
        [teamId, limit, offset]
      ),
      getPool().query(
        `SELECT COUNT(*)::int AS total FROM "team_audit_logs" WHERE "team_id" = $1`,
        [teamId]
      ),
    ]);
    return {
      rows: dataResult.rows.map((r: any) => this.mapRow(r)),
      total: countResult.rows[0].total,
    };
  }

  private mapRow(r: any): PgTeamAuditLog {
    return {
      id: r.id,
      teamId: r.team_id,
      action: r.action,
      actorId: r.actor_id,
      targetUserId: r.target_user_id,
      beforeData: r.before_data,
      afterData: r.after_data,
      note: r.note,
      createdAt: r.created_at,
    };
  }
}
