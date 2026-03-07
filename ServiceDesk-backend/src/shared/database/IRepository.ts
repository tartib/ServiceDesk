/**
 * Generic Repository Interface
 *
 * Abstracts database access so modules can later swap implementations
 * (e.g., MongoDB → PostgreSQL) without changing business logic.
 */

export interface IQueryOptions {
  page?: number;
  limit?: number;
  sort?: string;
  order?: 'asc' | 'desc';
  populate?: string | string[];
  select?: string;
  lean?: boolean;
}

export interface IQueryFilter {
  [key: string]: any;
}

export interface IPaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface IRepository<T> {
  /**
   * Find a single document by ID
   */
  findById(id: string, options?: Pick<IQueryOptions, 'populate' | 'select' | 'lean'>): Promise<T | null>;

  /**
   * Find a single document matching a filter
   */
  findOne(filter: IQueryFilter, options?: Pick<IQueryOptions, 'populate' | 'select' | 'lean'>): Promise<T | null>;

  /**
   * Find multiple documents with filtering, pagination, and sorting
   */
  findMany(filter: IQueryFilter, options?: IQueryOptions): Promise<IPaginatedResult<T>>;

  /**
   * Find all documents matching a filter (no pagination)
   */
  findAll(filter: IQueryFilter, options?: Pick<IQueryOptions, 'sort' | 'order' | 'populate' | 'select' | 'lean'>): Promise<T[]>;

  /**
   * Create a new document
   */
  create(data: Partial<T>): Promise<T>;

  /**
   * Create multiple documents
   */
  createMany(data: Partial<T>[]): Promise<T[]>;

  /**
   * Update a document by ID
   */
  updateById(id: string, data: Partial<T>): Promise<T | null>;

  /**
   * Update a single document matching a filter
   */
  updateOne(filter: IQueryFilter, data: Partial<T>): Promise<T | null>;

  /**
   * Update multiple documents matching a filter
   */
  updateMany(filter: IQueryFilter, data: Partial<T>): Promise<number>;

  /**
   * Delete a document by ID
   */
  deleteById(id: string): Promise<boolean>;

  /**
   * Delete multiple documents matching a filter
   */
  deleteMany(filter: IQueryFilter): Promise<number>;

  /**
   * Count documents matching a filter
   */
  count(filter?: IQueryFilter): Promise<number>;

  /**
   * Check if a document exists matching a filter
   */
  exists(filter: IQueryFilter): Promise<boolean>;
}
