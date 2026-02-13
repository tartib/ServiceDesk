import logger from '../../utils/logger';

/**
 * Retry strategy for failed jobs
 */
export interface IRetryStrategy {
  getDelay(attempt: number): number;
  shouldRetry(attempt: number, maxRetries: number): boolean;
}

/**
 * Exponential backoff retry strategy
 */
export class ExponentialBackoffStrategy implements IRetryStrategy {
  constructor(
    private baseDelay: number = 1000,
    private maxDelay: number = 60000,
    private multiplier: number = 2
  ) {}

  getDelay(attempt: number): number {
    const delay = Math.min(this.baseDelay * Math.pow(this.multiplier, attempt), this.maxDelay);
    return delay + Math.random() * 1000; // Add jitter
  }

  shouldRetry(attempt: number, maxRetries: number): boolean {
    return attempt < maxRetries;
  }
}

/**
 * Linear backoff retry strategy
 */
export class LinearBackoffStrategy implements IRetryStrategy {
  constructor(
    private baseDelay: number = 1000,
    private increment: number = 1000,
    private maxDelay: number = 30000
  ) {}

  getDelay(attempt: number): number {
    return Math.min(this.baseDelay + this.increment * attempt, this.maxDelay);
  }

  shouldRetry(attempt: number, maxRetries: number): boolean {
    return attempt < maxRetries;
  }
}

/**
 * Immediate retry strategy (no delay)
 */
export class ImmediateRetryStrategy implements IRetryStrategy {
  getDelay(): number {
    return 0;
  }

  shouldRetry(attempt: number, maxRetries: number): boolean {
    return attempt < maxRetries;
  }
}

/**
 * Retry manager for handling job retries
 */
export class RetryManager {
  private static instance: RetryManager;
  private strategies: Map<string, IRetryStrategy> = new Map();
  private defaultStrategy: IRetryStrategy = new ExponentialBackoffStrategy();

  private constructor() {
    this.registerDefaultStrategies();
  }

  static getInstance(): RetryManager {
    if (!RetryManager.instance) {
      RetryManager.instance = new RetryManager();
    }
    return RetryManager.instance;
  }

  /**
   * Register default retry strategies
   */
  private registerDefaultStrategies(): void {
    this.strategies.set('exponential', new ExponentialBackoffStrategy());
    this.strategies.set('linear', new LinearBackoffStrategy());
    this.strategies.set('immediate', new ImmediateRetryStrategy());
  }

  /**
   * Register a custom retry strategy
   */
  registerStrategy(name: string, strategy: IRetryStrategy): void {
    this.strategies.set(name, strategy);
    logger.info(`Retry strategy registered: ${name}`);
  }

  /**
   * Get retry strategy
   */
  getStrategy(name: string): IRetryStrategy {
    return this.strategies.get(name) || this.defaultStrategy;
  }

  /**
   * Calculate retry delay
   */
  getRetryDelay(strategyName: string, attempt: number): number {
    const strategy = this.getStrategy(strategyName);
    return strategy.getDelay(attempt);
  }

  /**
   * Check if should retry
   */
  shouldRetry(strategyName: string, attempt: number, maxRetries: number): boolean {
    const strategy = this.getStrategy(strategyName);
    return strategy.shouldRetry(attempt, maxRetries);
  }
}
