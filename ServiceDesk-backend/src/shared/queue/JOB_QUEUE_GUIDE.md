# Job Queue & Retry Strategy Guide

## Overview

The job queue infrastructure provides async job processing with automatic retry logic, priority handling, and multiple retry strategies.

## Quick Start

### 1. Register a Job Handler

```typescript
import { JobQueue, type IJobHandler, type IJob } from '@/shared/queue';

class SendEmailJobHandler implements IJobHandler {
  async handle(job: IJob): Promise<void> {
    const { email, subject, body } = job.data;
    await emailService.send(email, subject, body);
  }
}

const jobQueue = JobQueue.getInstance();
jobQueue.registerHandler('send_email', new SendEmailJobHandler());
```

### 2. Enqueue a Job

```typescript
const jobId = await jobQueue.enqueue({
  type: 'send_email',
  data: {
    email: 'user@example.com',
    subject: 'Welcome',
    body: 'Welcome to ServiceDesk'
  },
  priority: 1,
  maxRetries: 3
});

console.log(`Job enqueued: ${jobId}`);
```

### 3. Monitor Job Processing

```typescript
// Get job status
const job = jobQueue.getJob(jobId);
console.log(job);

// Get queue statistics
const stats = jobQueue.getStats();
console.log(stats);
// { queueLength: 5, activeJobs: 2, maxConcurrent: 5, registeredHandlers: 3 }
```

## Job Types

### Form Submission Jobs

```typescript
// Process form submission
await jobQueue.enqueue({
  type: 'process_form_submission',
  data: {
    submissionId: 'sub_123',
    formId: 'form_456'
  },
  priority: 2
});

// Send form notification
await jobQueue.enqueue({
  type: 'send_form_notification',
  data: {
    submissionId: 'sub_123',
    recipientId: 'user_789'
  },
  priority: 1
});
```

### Task Jobs

```typescript
// Create task from form
await jobQueue.enqueue({
  type: 'create_task_from_form',
  data: {
    formSubmissionId: 'sub_123',
    projectId: 'proj_456'
  },
  priority: 2
});

// Update task status
await jobQueue.enqueue({
  type: 'update_task_status',
  data: {
    taskId: 'task_123',
    newStatus: 'completed'
  },
  priority: 1
});
```

### Notification Jobs

```typescript
// Send email notification
await jobQueue.enqueue({
  type: 'send_email',
  data: {
    email: 'user@example.com',
    subject: 'Task assigned',
    body: 'You have been assigned a new task'
  },
  priority: 1
});

// Send push notification
await jobQueue.enqueue({
  type: 'send_push_notification',
  data: {
    userId: 'user_123',
    title: 'New task',
    message: 'You have a new task assigned'
  },
  priority: 1
});
```

### Analytics Jobs

```typescript
// Generate report
await jobQueue.enqueue({
  type: 'generate_report',
  data: {
    reportId: 'report_123',
    type: 'monthly',
    month: 'January'
  },
  priority: 0,
  maxRetries: 5
});

// Update analytics
await jobQueue.enqueue({
  type: 'update_analytics',
  data: {
    domain: 'forms',
    period: 'daily'
  },
  priority: 0
});
```

## Retry Strategies

### Exponential Backoff (Default)

```typescript
import { RetryManager, ExponentialBackoffStrategy } from '@/shared/queue';

const retryManager = RetryManager.getInstance();

// Delays: 1s, 2s, 4s, 8s, 16s, 32s, 60s (max)
const strategy = new ExponentialBackoffStrategy(
  1000,  // baseDelay
  60000, // maxDelay
  2      // multiplier
);

retryManager.registerStrategy('exponential', strategy);
```

### Linear Backoff

```typescript
import { LinearBackoffStrategy } from '@/shared/queue';

// Delays: 1s, 2s, 3s, 4s, 5s, 30s (max)
const strategy = new LinearBackoffStrategy(
  1000,  // baseDelay
  1000,  // increment
  30000  // maxDelay
);

retryManager.registerStrategy('linear', strategy);
```

### Immediate Retry

```typescript
import { ImmediateRetryStrategy } from '@/shared/queue';

// No delay between retries
const strategy = new ImmediateRetryStrategy();

retryManager.registerStrategy('immediate', strategy);
```

## Job Handler Examples

### Email Handler

```typescript
class SendEmailJobHandler implements IJobHandler {
  async handle(job: IJob): Promise<void> {
    const { email, subject, body } = job.data as {
      email: string;
      subject: string;
      body: string;
    };

    try {
      await emailService.send(email, subject, body);
      logger.info(`Email sent to ${email}`);
    } catch (error) {
      logger.error(`Failed to send email to ${email}:`, error);
      throw error; // Trigger retry
    }
  }
}
```

### Form Processing Handler

```typescript
class ProcessFormSubmissionHandler implements IJobHandler {
  async handle(job: IJob): Promise<void> {
    const { submissionId, formId } = job.data as {
      submissionId: string;
      formId: string;
    };

    const submission = await FormSubmission.findBySubmissionId(submissionId);
    if (!submission) {
      throw new Error(`Submission ${submissionId} not found`);
    }

    // Process submission
    await formService.processSubmission(submission);

    // Publish event
    const event = new FormSubmissionProcessedEvent(submissionId, formId);
    await EventBus.getInstance().publish(event);

    logger.info(`Form submission ${submissionId} processed`);
  }
}
```

### Report Generation Handler

```typescript
class GenerateReportHandler implements IJobHandler {
  async handle(job: IJob): Promise<void> {
    const { reportId, type, month } = job.data as {
      reportId: string;
      type: string;
      month: string;
    };

    logger.info(`Generating ${type} report for ${month}`);

    const data = await analyticsService.getMonthlyData(month);
    const report = await reportService.generate(reportId, data);

    // Cache the report
    await cacheManager.set(
      CacheKeys.report(reportId),
      report,
      86400 // 24 hours
    );

    logger.info(`Report ${reportId} generated`);
  }
}
```

## Job Priority

Jobs are processed by priority (higher first):

```typescript
// High priority - processed first
await jobQueue.enqueue({
  type: 'send_email',
  data: { /* ... */ },
  priority: 10
});

// Normal priority
await jobQueue.enqueue({
  type: 'update_analytics',
  data: { /* ... */ },
  priority: 5
});

// Low priority - processed last
await jobQueue.enqueue({
  type: 'cleanup_old_data',
  data: { /* ... */ },
  priority: 0
});
```

## Job Delay

Schedule jobs to run after a delay:

```typescript
// Run after 5 minutes
await jobQueue.enqueue({
  type: 'send_reminder_email',
  data: { userId: 'user_123' },
  delay: 5 * 60 * 1000
});
```

## Error Handling

Jobs automatically retry on failure:

```typescript
class MyJobHandler implements IJobHandler {
  async handle(job: IJob): Promise<void> {
    try {
      // Do work
      await someAsyncOperation();
    } catch (error) {
      // Log error
      logger.error(`Job ${job.id} failed:`, error);

      // Throw to trigger retry
      throw new Error(`Job failed: ${error}`);
    }
  }
}
```

## Queue Statistics

```typescript
const jobQueue = JobQueue.getInstance();

const stats = jobQueue.getStats();
console.log(stats);
// {
//   queueLength: 10,
//   activeJobs: 3,
//   maxConcurrent: 5,
//   registeredHandlers: 8
// }
```

## Best Practices

1. **Use Appropriate Priorities**: Critical jobs should have higher priority
2. **Set Max Retries**: Prevent infinite retry loops
3. **Log Job Progress**: Log job start, completion, and failures
4. **Handle Errors Gracefully**: Catch and log errors before retrying
5. **Use Job Delays**: Schedule non-urgent jobs for later
6. **Monitor Queue**: Check queue statistics regularly
7. **Clean Up**: Clear completed jobs periodically

## Configuration

```typescript
// Set max concurrent jobs
const jobQueue = JobQueue.getInstance();
// Default: 5 concurrent jobs

// Register all handlers
jobQueue.registerHandler('send_email', new SendEmailJobHandler());
jobQueue.registerHandler('process_form', new ProcessFormHandler());
jobQueue.registerHandler('generate_report', new GenerateReportHandler());
```

## Integration with Event-Driven Architecture

Jobs can be triggered by domain events:

```typescript
// In FormEventListeners.ts
export class FormApprovalJobTriggerListener extends EventListener {
  getEventType(): string {
    return 'FormSubmissionApproved';
  }

  async handle(event: DomainEvent): Promise<void> {
    const approvalEvent = event as FormSubmissionApprovedEvent;

    // Enqueue notification job
    await JobQueue.getInstance().enqueue({
      type: 'send_approval_notification',
      data: {
        submissionId: approvalEvent.aggregateId,
        approvedBy: approvalEvent.approvedBy
      },
      priority: 2
    });
  }
}
```

## Monitoring & Debugging

```typescript
// Get all jobs in queue
const allJobs = jobQueue.getAllJobs();

// Find specific job
const job = jobQueue.getJob(jobId);
if (job?.failedAt) {
  console.log(`Job failed: ${job.error}`);
}

// Clear queue (use with caution)
jobQueue.clear();
```
