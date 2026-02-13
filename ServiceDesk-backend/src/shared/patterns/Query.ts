/**
 * Base Query class for the Query Object Pattern
 * Used to encapsulate query logic and parameters
 */
export abstract class Query {
  abstract execute(): Promise<unknown>;
}

/**
 * Query Handler interface
 */
export interface IQueryHandler<T extends Query = Query, R = unknown> {
  handle(query: T): Promise<R>;
}

/**
 * Query Bus for executing queries
 */
export class QueryBus {
  private static instance: QueryBus;
  private handlers: Map<string, IQueryHandler> = new Map();

  private constructor() {}

  static getInstance(): QueryBus {
    if (!QueryBus.instance) {
      QueryBus.instance = new QueryBus();
    }
    return QueryBus.instance;
  }

  /**
   * Register a query handler
   */
  register<T extends Query>(
    queryType: string,
    handler: IQueryHandler<T>
  ): void {
    this.handlers.set(queryType, handler);
  }

  /**
   * Execute a query
   */
  async execute<T extends Query, R = unknown>(query: T): Promise<R> {
    const queryType = query.constructor.name;
    const handler = this.handlers.get(queryType);

    if (!handler) {
      throw new Error(`No handler registered for query: ${queryType}`);
    }

    return handler.handle(query) as Promise<R>;
  }
}
