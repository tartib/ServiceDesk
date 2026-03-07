/**
 * PostgreSQL Task Repository
 *
 * Used when DB_STRATEGY_PM = 'postgresql'.
 * Maps to pm_tasks table.
 */

import { PostgresRepository } from '../../../../shared/database/PostgresRepository';
import { getPool } from '../../../../shared/database/PostgresConnectionManager';

export class PgTaskRepository extends PostgresRepository<any> {
  constructor() {
    super({
      tableName: 'pm_tasks',
      columnMap: {
        'projectId': 'project_id',
        'organizationId': 'organization_id',
        'statusId': 'status_id',
        'status.id': 'status_id',
        'status.name': 'status_name',
        'status.category': 'status_category',
        'statusName': 'status_name',
        'statusCategory': 'status_category',
        'storyPoints': 'story_points',
        'originalEstimate': 'original_estimate',
        'remainingEstimate': 'remaining_estimate',
        'timeSpent': 'time_spent',
        'parentId': 'parent_id',
        'epicId': 'epic_id',
        'sprintId': 'sprint_id',
        'boardColumn': 'board_column',
        'columnOrder': 'column_order',
        'webLinks': 'web_links',
        'workflowHistory': 'workflow_history',
        'dueDate': 'due_date',
        'startDate': 'start_date',
        'completedAt': 'completed_at',
        'createdBy': 'created_by',
        'updatedBy': 'updated_by',
        'createdAt': 'created_at',
        'updatedAt': 'updated_at',
        'mongoId': 'mongo_id',
      },
    });
  }

  async findByProject(projectId: string) {
    return this.findAll({ projectId });
  }

  async findBySprint(sprintId: string) {
    return this.findAll({ sprintId });
  }

  async findByAssignee(userId: string) {
    return this.findAll({ assignee: userId });
  }

  async findByKey(key: string): Promise<any | null> {
    const pool = getPool();
    const { rows } = await pool.query(
      `SELECT * FROM ${this.tableName} WHERE key = $1 LIMIT 1`,
      [key]
    );
    return rows[0] ? this.mapRow(rows[0]) : null;
  }

  /**
   * Get next task number for a project.
   */
  async getNextNumber(projectId: string): Promise<number> {
    const pool = getPool();
    const { rows } = await pool.query(
      `SELECT COALESCE(MAX(number), 0) + 1 AS next FROM ${this.tableName} WHERE project_id = $1`,
      [projectId]
    );
    return rows[0]?.next || 1;
  }

  /**
   * Search tasks with filters, pagination, sorting.
   */
  async searchTasks(
    filters: Record<string, any>,
    page: number,
    limit: number,
  ) {
    const pool = getPool();
    const conditions: string[] = [];
    const params: any[] = [];
    let idx = 1;

    if (filters.projectId) {
      conditions.push(`project_id = $${idx++}`);
      params.push(filters.projectId);
    }
    if (filters.sprintId === null) {
      conditions.push(`sprint_id IS NULL`);
    } else if (filters.sprintId) {
      conditions.push(`sprint_id = $${idx++}`);
      params.push(filters.sprintId);
    }
    if (filters.assignee) {
      conditions.push(`assignee = $${idx++}`);
      params.push(filters.assignee);
    }
    if (filters.reporter) {
      conditions.push(`reporter = $${idx++}`);
      params.push(filters.reporter);
    }
    if (filters.type) {
      conditions.push(`type = $${idx++}`);
      params.push(filters.type);
    }
    if (filters.priority) {
      conditions.push(`priority = $${idx++}`);
      params.push(filters.priority);
    }
    if (filters.statusCategory) {
      conditions.push(`status_category = $${idx++}`);
      params.push(filters.statusCategory);
    }
    if (filters.statusId) {
      conditions.push(`status_id = $${idx++}`);
      params.push(filters.statusId);
    }
    if (filters.epicId) {
      conditions.push(`epic_id = $${idx++}`);
      params.push(filters.epicId);
    }
    if (filters.parentId) {
      conditions.push(`parent_id = $${idx++}`);
      params.push(filters.parentId);
    }
    if (filters.label) {
      conditions.push(`$${idx++} = ANY(labels)`);
      params.push(filters.label);
    }

    // Text search
    if (filters.q) {
      conditions.push(`(key ILIKE $${idx} OR title ILIKE $${idx})`);
      params.push(`%${filters.q}%`);
      idx++;
    }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    const offset = (page - 1) * limit;

    // Sort
    const sortCol = this.toColumn(filters.sort || 'createdAt');
    const sortDir = filters.sortDir === 'asc' ? 'ASC' : 'DESC';

    const [dataRes, countRes] = await Promise.all([
      pool.query(
        `SELECT * FROM ${this.tableName} ${where} ORDER BY "${sortCol}" ${sortDir} LIMIT $${idx} OFFSET $${idx + 1}`,
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
   * Get distinct labels for a project.
   */
  async getDistinctLabels(projectId: string): Promise<string[]> {
    const pool = getPool();
    const { rows } = await pool.query(
      `SELECT DISTINCT unnest(labels) AS label FROM ${this.tableName} WHERE project_id = $1 ORDER BY label`,
      [projectId]
    );
    return rows.map((r: any) => r.label).filter(Boolean);
  }

  /**
   * Count tasks by status category for a project.
   */
  async countByStatusCategory(projectId: string): Promise<Record<string, number>> {
    const pool = getPool();
    const { rows } = await pool.query(
      `SELECT status_category, COUNT(*)::int AS count FROM ${this.tableName} WHERE project_id = $1 GROUP BY status_category`,
      [projectId]
    );
    const result: Record<string, number> = {};
    for (const r of rows) {
      result[r.status_category] = r.count;
    }
    return result;
  }

  /**
   * Get subtask progress for a parent task.
   */
  async getSubtaskProgress(parentId: string) {
    const pool = getPool();
    const { rows } = await pool.query(
      `SELECT
         COUNT(*)::int AS total,
         COUNT(*) FILTER (WHERE status_category = 'done')::int AS completed,
         COUNT(*) FILTER (WHERE status_category = 'in_progress')::int AS "inProgress",
         COUNT(*) FILTER (WHERE status_category = 'todo')::int AS todo
       FROM ${this.tableName}
       WHERE parent_id = $1`,
      [parentId]
    );
    const r = rows[0] || { total: 0, completed: 0, inProgress: 0, todo: 0 };
    return {
      ...r,
      progressPercent: r.total > 0 ? Math.round((r.completed / r.total) * 100) : 0,
    };
  }

  /**
   * Push to a JSONB array column.
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
   * Bulk move tasks to/from a sprint.
   */
  async bulkSetSprint(taskIds: string[], sprintId: string | null) {
    if (taskIds.length === 0) return;
    const pool = getPool();
    await pool.query(
      `UPDATE ${this.tableName} SET sprint_id = $1, updated_at = NOW() WHERE id = ANY($2::uuid[])`,
      [sprintId, taskIds]
    );
  }
}
