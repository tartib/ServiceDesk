import logger from '../../utils/logger';

/**
 * Job interface for queue operations
 */
export interface IJob {
  id?: string;
  type: string;
  data: Record<string, unknown>;
  priority?: number;
  retries?: number;
  maxRetries?: number;
  delay?: number;
  createdAt?: Date;
  processedAt?: Date;
  failedAt?: Date;
  error?: string;
}

/**
 * Job handler interface
 */
export interface IJobHandler {
  handle(job: IJob): Promise<void>;
}

/**
 * Job Queue for managing async jobs
 * Supports RabbitMQ or in-memory queue
 */
export class JobQueue {
  private static instance: JobQueue;
  private handlers: Map<string, IJobHandler> = new Map();
  private queue: IJob[] = [];
  private processing = false;
  private maxConcurrent = 5;
  private activeJobs = 0;

  private constructor() {}

  static getInstance(): JobQueue {
    if (!JobQueue.instance) {
      JobQueue.instance = new JobQueue();
    }
    return JobQueue.instance;
  }

  /**
   * Register a job handler
   */
  registerHandler(jobType: string, handler: IJobHandler): void {
    this.handlers.set(jobType, handler);
    logger.info(`Job handler registered for type: ${jobType}`);
  }

  /**
   * Enqueue a job
   */
  async enqueue(job: IJob): Promise<string> {
    const jobId = job.id || `job_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const enqueuedJob: IJob = {
      ...job,
      id: jobId,
      createdAt: new Date(),
      retries: 0,
      maxRetries: job.maxRetries || 3,
      priority: job.priority || 0,
    };

    this.queue.push(enqueuedJob);
    logger.info(`Job enqueued: ${jobId} (type: ${job.type})`);

    // Start processing if not already running
    if (!this.processing) {
      this.processQueue();
    }

    return jobId;
  }

  /**
   * Process jobs from queue
   */
  private async processQueue(): Promise<void> {
    if (this.processing) return;

    this.processing = true;

    while (this.queue.length > 0 && this.activeJobs < this.maxConcurrent) {
      // Sort by priority (higher first) and then by creation time
      this.queue.sort((a, b) => {
        if ((b.priority || 0) !== (a.priority || 0)) {
          return (b.priority || 0) - (a.priority || 0);
        }
        return (a.createdAt?.getTime() || 0) - (b.createdAt?.getTime() || 0);
      });

      const job = this.queue.shift();
      if (!job) break;

      this.activeJobs++;
      this.processJob(job).finally(() => {
        this.activeJobs--;
      });
    }

    this.processing = false;
  }

  /**
   * Process a single job
   */
  private async processJob(job: IJob): Promise<void> {
    const handler = this.handlers.get(job.type);

    if (!handler) {
      logger.error(`No handler found for job type: ${job.type}`);
      return;
    }

    try {
      logger.info(`Processing job: ${job.id} (type: ${job.type})`);
      await handler.handle(job);
      logger.info(`Job completed: ${job.id}`);
    } catch (error) {
      job.retries = (job.retries || 0) + 1;

      if (job.retries! < (job.maxRetries || 3)) {
        logger.warn(`Job failed, retrying: ${job.id} (attempt ${job.retries}/${job.maxRetries})`, error);
        // Re-enqueue with exponential backoff
        const delayMs = Math.pow(2, job.retries!) * 1000;
        setTimeout(() => {
          this.queue.push(job);
          this.processQueue();
        }, delayMs);
      } else {
        job.failedAt = new Date();
        job.error = error instanceof Error ? error.message : String(error);
        logger.error(`Job failed permanently: ${job.id}`, error);
      }
    }
  }

  /**
   * Get job by ID
   */
  getJob(jobId: string): IJob | undefined {
    return this.queue.find(job => job.id === jobId);
  }

  /**
   * Get queue statistics
   */
  getStats(): Record<string, unknown> {
    return {
      queueLength: this.queue.length,
      activeJobs: this.activeJobs,
      maxConcurrent: this.maxConcurrent,
      registeredHandlers: this.handlers.size,
    };
  }

  /**
   * Clear queue
   */
  clear(): void {
    this.queue = [];
    logger.info('Job queue cleared');
  }

  /**
   * Get all jobs
   */
  getAllJobs(): IJob[] {
    return [...this.queue];
  }
}
