/**
 * PostgreSQL Repository Implementation
 *
 * Generic implementation of IRepository using node-pg Pool.
 * Maps the same interface used by MongoRepository so modules can swap
 * database backends via DB_STRATEGY_* without changing business logic.
 *
 * Table schema convention:
 *   - Primary key column: "id" (UUID, auto-generated)
 *   - Timestamps: "createdAt", "updatedAt" (managed automatically)
 *   - Column names use camelCase (quoted identifiers)
 */

import { v4 as uuidv4 } from 'uuid';
import { IRepository, IQueryOptions, IQueryFilter, IPaginatedResult } from './IRepository';
import { getPool } from './PostgresConnectionManager';
import logger from '../../utils/logger';

export interface PgTableConfig {
  tableName: string;
  /** Optional explicit column mapping: JS property name → SQL column name */
  columnMap?: Record<string, string>;
  /** If true (default), auto-convert camelCase ↔ snake_case */
  autoSnakeCase?: boolean;
}

export class PostgresRepository<T> implements IRepository<T> {
  protected readonly tableName: string;
  protected readonly columnMap: Record<string, string>;
  protected readonly reverseColumnMap: Record<string, string>;
  protected readonly autoSnakeCase: boolean;

  constructor(config: PgTableConfig) {
    this.tableName = config.tableName;
    this.columnMap = config.columnMap || {};
    this.autoSnakeCase = config.autoSnakeCase !== false; // default true
    // Build reverse map (SQL col → JS prop)
    this.reverseColumnMap = {};
    for (const [jsProp, sqlCol] of Object.entries(this.columnMap)) {
      this.reverseColumnMap[sqlCol] = jsProp;
    }
  }

  // ── Helpers ─────────────────────────────────────────────────

  private get pool() {
    return getPool();
  }

  /**
   * Convert a MongoDB-style filter to SQL WHERE clause + params.
   * Supports: { key: value }, { key: { $ne, $gt, $gte, $lt, $lte, $in, $exists } }
   */
  private buildWhere(filter: IQueryFilter): { clause: string; params: any[] } {
    const conditions: string[] = [];
    const params: any[] = [];
    let idx = 1;

    for (const [key, value] of Object.entries(filter)) {
      const col = this.quoteCol(key);

      if (value === null || value === undefined) {
        conditions.push(`${col} IS NULL`);
        continue;
      }

      if (typeof value === 'object' && !Array.isArray(value) && !(value instanceof Date)) {
        // Operator object: { $gt: 5, $lt: 10 }
        for (const [op, opVal] of Object.entries(value)) {
          switch (op) {
            case '$eq':
              conditions.push(`${col} = $${idx++}`);
              params.push(opVal);
              break;
            case '$ne':
              conditions.push(`${col} != $${idx++}`);
              params.push(opVal);
              break;
            case '$gt':
              conditions.push(`${col} > $${idx++}`);
              params.push(opVal);
              break;
            case '$gte':
              conditions.push(`${col} >= $${idx++}`);
              params.push(opVal);
              break;
            case '$lt':
              conditions.push(`${col} < $${idx++}`);
              params.push(opVal);
              break;
            case '$lte':
              conditions.push(`${col} <= $${idx++}`);
              params.push(opVal);
              break;
            case '$in':
              if (Array.isArray(opVal) && opVal.length > 0) {
                conditions.push(`${col} = ANY($${idx++})`);
                params.push(opVal);
              }
              break;
            case '$nin':
              if (Array.isArray(opVal) && opVal.length > 0) {
                conditions.push(`${col} != ALL($${idx++})`);
                params.push(opVal);
              }
              break;
            case '$exists':
              conditions.push(opVal ? `${col} IS NOT NULL` : `${col} IS NULL`);
              break;
            default:
              logger.warn(`[PostgresRepository] Unsupported operator: ${op}`);
          }
        }
      } else {
        // Simple equality
        conditions.push(`${col} = $${idx++}`);
        params.push(value);
      }
    }

    const clause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    return { clause, params };
  }

  /** Convert a JS property name to the SQL column name */
  protected toColumn(key: string): string {
    // Check explicit mapping first
    if (this.columnMap[key]) return this.columnMap[key];
    // Handle nested keys like "status.category" → "status_category" or jsonb
    if (key.includes('.')) {
      const flat = key.replace(/\./g, '_');
      if (this.columnMap[flat]) return this.columnMap[flat];
      if (this.autoSnakeCase) return this.camelToSnake(flat);
      return flat;
    }
    if (this.autoSnakeCase) return this.camelToSnake(key);
    return key;
  }

  private quoteCol(key: string): string {
    const col = this.toColumn(key);
    return `"${col}"`;
  }

  /** Convert camelCase to snake_case */
  protected camelToSnake(str: string): string {
    return str.replace(/([A-Z])/g, '_$1').toLowerCase().replace(/^_/, '');
  }

  /** Convert snake_case to camelCase */
  protected snakeToCamel(str: string): string {
    return str.replace(/_([a-z])/g, (_, c) => c.toUpperCase());
  }

  private buildOrderBy(sort?: string, order?: 'asc' | 'desc'): string {
    const col = sort ? this.toColumn(sort) : 'created_at';
    const dir = (order || 'desc').toUpperCase();
    return `ORDER BY "${col}" ${dir}`;
  }

  private buildSelect(select?: string): string {
    if (!select) return '*';
    return select
      .split(/\s+/)
      .filter(Boolean)
      .map((f) => `"${this.toColumn(f)}"`)
      .join(', ');
  }

  protected mapRow(row: any): T {
    if (!row) return row;
    const mapped: any = {};
    for (const [sqlCol, value] of Object.entries(row)) {
      // Use reverse column map if available
      const jsProp = this.reverseColumnMap[sqlCol]
        || (this.autoSnakeCase ? this.snakeToCamel(sqlCol) : sqlCol);
      mapped[jsProp] = value;
    }
    // Map PostgreSQL 'id' to '_id' for Mongoose compatibility
    if (mapped.id && !mapped._id) {
      mapped._id = mapped.id;
    }
    return mapped as T;
  }

  private mapRows(rows: any[]): T[] {
    return rows.map((r) => this.mapRow(r));
  }

  // ── IRepository Implementation ──────────────────────────────

  async findById(id: string, options: Pick<IQueryOptions, 'populate' | 'select' | 'lean'> = {}): Promise<T | null> {
    const fields = this.buildSelect(options.select);
    const sql = `SELECT ${fields} FROM "${this.tableName}" WHERE "id" = $1 LIMIT 1`;
    const result = await this.pool.query(sql, [id]);
    return result.rows.length > 0 ? this.mapRow(result.rows[0]) : null;
  }

  async findOne(filter: IQueryFilter, options: Pick<IQueryOptions, 'populate' | 'select' | 'lean'> = {}): Promise<T | null> {
    const fields = this.buildSelect(options.select);
    const { clause, params } = this.buildWhere(filter);
    const sql = `SELECT ${fields} FROM "${this.tableName}" ${clause} LIMIT 1`;
    const result = await this.pool.query(sql, params);
    return result.rows.length > 0 ? this.mapRow(result.rows[0]) : null;
  }

  async findMany(filter: IQueryFilter, options: IQueryOptions = {}): Promise<IPaginatedResult<T>> {
    const { page = 1, limit = 20 } = options;
    const offset = (page - 1) * limit;
    const fields = this.buildSelect(options.select);
    const { clause, params } = this.buildWhere(filter);
    const orderBy = this.buildOrderBy(options.sort, options.order);

    const countSql = `SELECT COUNT(*)::int AS total FROM "${this.tableName}" ${clause}`;
    const dataSql = `SELECT ${fields} FROM "${this.tableName}" ${clause} ${orderBy} LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;

    const [countResult, dataResult] = await Promise.all([
      this.pool.query(countSql, params),
      this.pool.query(dataSql, [...params, limit, offset]),
    ]);

    const total = countResult.rows[0]?.total || 0;

    return {
      data: this.mapRows(dataResult.rows),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findAll(filter: IQueryFilter, options: Pick<IQueryOptions, 'sort' | 'order' | 'populate' | 'select' | 'lean'> = {}): Promise<T[]> {
    const fields = this.buildSelect(options.select);
    const { clause, params } = this.buildWhere(filter);
    const orderBy = this.buildOrderBy(options.sort, options.order);
    const sql = `SELECT ${fields} FROM "${this.tableName}" ${clause} ${orderBy}`;
    const result = await this.pool.query(sql, params);
    return this.mapRows(result.rows);
  }

  /** Convert a JS data object to SQL column-keyed object */
  protected toSqlRecord(data: any): Record<string, any> {
    const result: Record<string, any> = {};
    for (const [jsProp, value] of Object.entries(data)) {
      const sqlCol = this.toColumn(jsProp);
      result[sqlCol] = value;
    }
    return result;
  }

  async create(data: Partial<T>): Promise<T> {
    const record = { ...data } as any;
    if (!record.id && !record._id) {
      record.id = uuidv4();
    } else if (record._id) {
      record.id = record._id;
      delete record._id;
    }
    if (!record.createdAt) record.createdAt = new Date();
    if (!record.updatedAt) record.updatedAt = new Date();

    const sqlRecord = this.toSqlRecord(record);
    const keys = Object.keys(sqlRecord);
    const cols = keys.map((k) => `"${k}"`).join(', ');
    const placeholders = keys.map((_, i) => `$${i + 1}`).join(', ');
    const values = keys.map((k) => sqlRecord[k]);

    const sql = `INSERT INTO "${this.tableName}" (${cols}) VALUES (${placeholders}) RETURNING *`;
    const result = await this.pool.query(sql, values);
    return this.mapRow(result.rows[0]);
  }

  async createMany(data: Partial<T>[]): Promise<T[]> {
    const results: T[] = [];
    // Use a transaction for atomicity
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');
      for (const item of data) {
        const record = { ...item } as any;
        if (!record.id && !record._id) record.id = uuidv4();
        else if (record._id) { record.id = record._id; delete record._id; }
        if (!record.createdAt) record.createdAt = new Date();
        if (!record.updatedAt) record.updatedAt = new Date();

        const sqlRecord = this.toSqlRecord(record);
        const keys = Object.keys(sqlRecord);
        const cols = keys.map((k) => `"${k}"`).join(', ');
        const placeholders = keys.map((_, i) => `$${i + 1}`).join(', ');
        const values = keys.map((k) => sqlRecord[k]);

        const sql = `INSERT INTO "${this.tableName}" (${cols}) VALUES (${placeholders}) RETURNING *`;
        const result = await client.query(sql, values);
        results.push(this.mapRow(result.rows[0]));
      }
      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
    return results;
  }

  async updateById(id: string, data: Partial<T>): Promise<T | null> {
    const record = { ...data, updatedAt: new Date() } as any;
    delete record.id;
    delete record._id;

    const sqlRecord = this.toSqlRecord(record);
    const keys = Object.keys(sqlRecord);
    if (keys.length === 0) return this.findById(id);

    const setClauses = keys.map((k, i) => `"${k}" = $${i + 1}`).join(', ');
    const values = keys.map((k) => sqlRecord[k]);

    const sql = `UPDATE "${this.tableName}" SET ${setClauses} WHERE "id" = $${keys.length + 1} RETURNING *`;
    const result = await this.pool.query(sql, [...values, id]);
    return result.rows.length > 0 ? this.mapRow(result.rows[0]) : null;
  }

  async updateOne(filter: IQueryFilter, data: Partial<T>): Promise<T | null> {
    const record = { ...data, updatedAt: new Date() } as any;
    delete record.id;
    delete record._id;

    const sqlRecord = this.toSqlRecord(record);
    const keys = Object.keys(sqlRecord);
    if (keys.length === 0) return this.findOne(filter);

    const { clause, params: whereParams } = this.buildWhere(filter);
    let idx = whereParams.length + 1;

    const setClauses = keys.map((k) => `"${k}" = $${idx++}`).join(', ');
    const setValues = keys.map((k) => sqlRecord[k]);

    const subSql = `
      UPDATE "${this.tableName}" SET ${setClauses}
      WHERE "id" = (SELECT "id" FROM "${this.tableName}" ${clause} LIMIT 1)
      RETURNING *
    `;
    const result = await this.pool.query(subSql, [...whereParams, ...setValues]);
    return result.rows.length > 0 ? this.mapRow(result.rows[0]) : null;
  }

  async updateMany(filter: IQueryFilter, data: Partial<T>): Promise<number> {
    const record = { ...data, updatedAt: new Date() } as any;
    delete record.id;
    delete record._id;

    const sqlRecord = this.toSqlRecord(record);
    const keys = Object.keys(sqlRecord);
    if (keys.length === 0) return 0;

    const { clause, params: whereParams } = this.buildWhere(filter);
    let idx = whereParams.length + 1;

    const setClauses = keys.map((k) => `"${k}" = $${idx++}`).join(', ');
    const setValues = keys.map((k) => sqlRecord[k]);

    const sql = `UPDATE "${this.tableName}" SET ${setClauses} ${clause}`;
    const result = await this.pool.query(sql, [...whereParams, ...setValues]);
    return result.rowCount || 0;
  }

  async deleteById(id: string): Promise<boolean> {
    const sql = `DELETE FROM "${this.tableName}" WHERE "id" = $1`;
    const result = await this.pool.query(sql, [id]);
    return (result.rowCount || 0) > 0;
  }

  async deleteMany(filter: IQueryFilter): Promise<number> {
    const { clause, params } = this.buildWhere(filter);
    const sql = `DELETE FROM "${this.tableName}" ${clause}`;
    const result = await this.pool.query(sql, params);
    return result.rowCount || 0;
  }

  async count(filter: IQueryFilter = {}): Promise<number> {
    const { clause, params } = this.buildWhere(filter);
    const sql = `SELECT COUNT(*)::int AS total FROM "${this.tableName}" ${clause}`;
    const result = await this.pool.query(sql, params);
    return result.rows[0]?.total || 0;
  }

  async exists(filter: IQueryFilter): Promise<boolean> {
    const { clause, params } = this.buildWhere(filter);
    const sql = `SELECT 1 FROM "${this.tableName}" ${clause} LIMIT 1`;
    const result = await this.pool.query(sql, params);
    return result.rows.length > 0;
  }
}
