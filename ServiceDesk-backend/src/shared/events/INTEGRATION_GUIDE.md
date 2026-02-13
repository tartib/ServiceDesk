# Event-Driven Architecture Integration Guide

## Quick Start

### 1. Initialize in Application Startup

Add to your `src/app.ts` or `src/server.ts`:

```typescript
import { setupEventDrivenArchitecture } from '@/shared/events/setupEventDrivenArchitecture';

// During app initialization
setupEventDrivenArchitecture();
```

### 2. Publishing Events from Services

```typescript
import { EventBus } from '@/shared/events';
import { FormSubmissionStatusChangedEvent } from '@/shared/events';

export class FormSubmissionService {
  async updateStatus(submissionId: string, newStatus: string, userId: string) {
    // Update the submission
    const submission = await FormSubmission.findBySubmissionId(submissionId);
    const oldStatus = submission.workflow_state.status;
    submission.workflow_state.status = newStatus;
    await submission.save();

    // Publish event
    const event = new FormSubmissionStatusChangedEvent(
      submissionId,
      oldStatus,
      newStatus,
      userId
    );
    await EventBus.getInstance().publish(event);

    return submission;
  }
}
```

### 3. Executing Queries

```typescript
import { GetFormSubmissionQuery, QueryBus } from '@/shared/patterns';

export class FormSubmissionController {
  async getSubmission(req: Request, res: Response) {
    const query = new GetFormSubmissionQuery(
      req.params.submissionId,
      true,  // includeTimeline
      true   // includeComments
    );

    const submission = await QueryBus.getInstance().execute(query);
    res.json(submission);
  }
}
```

### 4. Executing Commands

```typescript
import { CreateFormSubmissionCommand, CommandBus } from '@/shared/patterns';

export class FormSubmissionController {
  async createSubmission(req: Request, res: Response) {
    const command = new CreateFormSubmissionCommand(
      req.body.formTemplateId,
      req.user.id,
      req.body.data,
      req.body.attachments
    );

    const submission = await CommandBus.getInstance().execute(command);
    res.status(201).json(submission);
  }
}
```

## Creating Custom Event Listeners

### Step 1: Create the Listener Class

```typescript
import { EventListener, DomainEvent } from '@/shared/events';
import { FormSubmissionStatusChangedEvent } from '@/shared/events';

export class NotificationEventListener extends EventListener {
  getEventType(): string {
    return 'FormSubmissionStatusChanged';
  }

  async handle(event: DomainEvent): Promise<void> {
    const statusEvent = event as FormSubmissionStatusChangedEvent;

    // Send notification
    if (statusEvent.newStatus === 'approved') {
      await notificationService.sendApprovalNotification(
        statusEvent.aggregateId,
        statusEvent.changedBy
      );
    }
  }
}
```

### Step 2: Register in initializeEventListeners

```typescript
import { EventListenerRegistry } from '@/shared/events';
import { NotificationEventListener } from './listeners/NotificationEventListener';

export function initializeEventListeners(): void {
  const registry = EventListenerRegistry.getInstance();

  // ... existing listeners ...

  // Register custom listener
  registry.register(new NotificationEventListener());
}
```

## Creating Custom Query Handlers

### Step 1: Create the Query

```typescript
import { Query } from '@/shared/patterns';

export class GetFormSubmissionsByStatusQuery extends Query {
  constructor(
    public readonly formTemplateId: string,
    public readonly status: string,
    public readonly page: number = 1,
    public readonly limit: number = 10
  ) {
    super();
  }

  async execute(): Promise<unknown> {
    throw new Error('Use QueryBus.execute() instead');
  }
}
```

### Step 2: Create the Query Handler

```typescript
import { IQueryHandler } from '@/shared/patterns';

export class GetFormSubmissionsByStatusQueryHandler
  implements IQueryHandler<GetFormSubmissionsByStatusQuery> {
  async handle(
    query: GetFormSubmissionsByStatusQuery
  ): Promise<FormSubmission[]> {
    const skip = (query.page - 1) * query.limit;

    return FormSubmission.find({
      form_template_id: query.formTemplateId,
      'workflow_state.status': query.status,
    })
      .skip(skip)
      .limit(query.limit)
      .exec();
  }
}
```

### Step 3: Register the Query Handler

```typescript
import { QueryBus } from '@/shared/patterns';

const queryBus = QueryBus.getInstance();
queryBus.register(
  'GetFormSubmissionsByStatusQuery',
  new GetFormSubmissionsByStatusQueryHandler()
);
```

## Creating Custom Command Handlers

### Step 1: Create the Command

```typescript
import { Command } from '@/shared/patterns';

export class BulkApproveSubmissionsCommand extends Command {
  constructor(
    public readonly submissionIds: string[],
    public readonly approvedBy: string,
    public readonly comments?: string
  ) {
    super();
  }

  async execute(): Promise<unknown> {
    throw new Error('Use CommandBus.execute() instead');
  }
}
```

### Step 2: Create the Command Handler

```typescript
import { ICommandHandler } from '@/shared/patterns';
import { EventBus } from '@/shared/events';
import { FormSubmissionApprovedEvent } from '@/shared/events';

export class BulkApproveSubmissionsCommandHandler
  implements ICommandHandler<BulkApproveSubmissionsCommand> {
  async handle(command: BulkApproveSubmissionsCommand): Promise<number> {
    const eventBus = EventBus.getInstance();
    let approvedCount = 0;

    for (const submissionId of command.submissionIds) {
      const submission = await FormSubmission.findBySubmissionId(submissionId);

      if (submission && submission.workflow_state.status === 'pending_approval') {
        submission.workflow_state.status = 'approved';
        await submission.save();

        // Publish event
        const event = new FormSubmissionApprovedEvent(
          submissionId,
          command.approvedBy,
          command.comments
        );
        await eventBus.publish(event);

        approvedCount++;
      }
    }

    return approvedCount;
  }
}
```

### Step 3: Register the Command Handler

```typescript
import { CommandBus } from '@/shared/patterns';

const commandBus = CommandBus.getInstance();
commandBus.register(
  'BulkApproveSubmissionsCommand',
  new BulkApproveSubmissionsCommandHandler()
);
```

## Cross-Domain Event Flow Example

### Scenario: Form Approval triggers Task Creation

#### Step 1: Form Domain publishes event

```typescript
// In FormSubmissionService
const event = new FormSubmissionApprovedEvent(submissionId, userId);
await EventBus.getInstance().publish(event);
```

#### Step 2: Task Domain listens and reacts

```typescript
// In TaskEventListeners.ts
export class FormApprovalTaskCreationListener extends EventListener {
  getEventType(): string {
    return 'FormSubmissionApproved';
  }

  async handle(event: DomainEvent): Promise<void> {
    const approvalEvent = event as FormSubmissionApprovedEvent;

    // Create a task command
    const command = new CreateTaskCommand(
      `Follow up on form ${approvalEvent.aggregateId}`,
      'medium',
      approvalEvent.approvedBy
    );

    // Execute the command
    await CommandBus.getInstance().execute(command);
  }
}
```

#### Step 3: Task Domain publishes its own event

```typescript
// In CreateTaskCommandHandler
const task = await taskService.create(command);

const event = new TaskCreatedEvent(
  task.task_id,
  task.title,
  task.project_id,
  command.createdBy
);
await EventBus.getInstance().publish(event);
```

#### Step 4: Other domains can react

```typescript
// In AnalyticsEventListeners.ts
export class TaskCreationAnalyticsListener extends EventListener {
  getEventType(): string {
    return 'TaskCreated';
  }

  async handle(event: DomainEvent): Promise<void> {
    const taskEvent = event as TaskCreatedEvent;

    // Update analytics
    await analyticsService.recordTaskCreation(taskEvent);
  }
}
```

## Testing Event-Driven Code

### Testing Event Listeners

```typescript
import { EventListener } from '@/shared/events';
import { FormSubmissionStatusChangedEvent } from '@/shared/events';

describe('FormSubmissionStatusChangeListener', () => {
  it('should handle status change events', async () => {
    const listener = new FormSubmissionStatusChangeListener();
    const event = new FormSubmissionStatusChangedEvent(
      'sub_123',
      'draft',
      'submitted',
      'user_456'
    );

    await listener.handle(event);

    // Assert expected behavior
    expect(notificationService.notify).toHaveBeenCalled();
  });
});
```

### Testing Commands

```typescript
import { CommandBus } from '@/shared/patterns';
import { CreateFormSubmissionCommand } from '@/shared/patterns';

describe('CreateFormSubmissionCommand', () => {
  it('should create submission and publish event', async () => {
    const commandBus = CommandBus.getInstance();
    const command = new CreateFormSubmissionCommand(
      'form_123',
      'user_456',
      { field1: 'value1' }
    );

    const result = await commandBus.execute(command);

    expect(result).toBeDefined();
    expect(result.submission_id).toBeDefined();
  });
});
```

### Testing Queries

```typescript
import { QueryBus } from '@/shared/patterns';
import { GetFormSubmissionQuery } from '@/shared/patterns';

describe('GetFormSubmissionQuery', () => {
  it('should retrieve submission with timeline and comments', async () => {
    const queryBus = QueryBus.getInstance();
    const query = new GetFormSubmissionQuery('sub_123', true, true);

    const result = await queryBus.execute(query);

    expect(result).toBeDefined();
    expect(result.timeline).toBeDefined();
    expect(result.comments).toBeDefined();
  });
});
```

## Performance Considerations

1. **Event Listener Execution**: Listeners execute in parallel. Long-running operations should be handled asynchronously.

2. **Event History**: Event history is stored in memory with a limit of 1000 events. For production, consider implementing persistent event store.

3. **Error Handling**: Listener errors don't stop other listeners from executing. Always log errors for debugging.

4. **Query Performance**: Implement proper database indexes for frequently queried fields.

5. **Command Execution**: Commands should be idempotent to handle retries safely.

## Troubleshooting

### Events not being published

1. Ensure `setupEventDrivenArchitecture()` is called during app startup
2. Check that `EventBus.getInstance().publish(event)` is being called
3. Verify event type matches listener's `getEventType()`

### Listeners not executing

1. Ensure listener is registered in `initializeEventListeners()`
2. Check that event type matches exactly
3. Look for errors in listener logs

### Queries/Commands not executing

1. Ensure handler is registered with correct command/query type name
2. Verify handler implements `IQueryHandler` or `ICommandHandler`
3. Check that `QueryBus.getInstance().execute()` or `CommandBus.getInstance().execute()` is called

## Next Steps

- Implement persistent event store (Event Sourcing)
- Add event replay functionality
- Integrate with message queue (RabbitMQ/Kafka)
- Implement Saga pattern for distributed transactions
- Add event versioning and migration
