# Event-Driven Architecture Guide

## Overview

This guide explains how to use the event-driven architecture implemented in the ServiceDesk backend.

## Components

### 1. Domain Events

Domain events represent something that happened in your domain. They are immutable and contain all the information about what occurred.

Example:

```typescript
import { FormSubmissionStatusChangedEvent } from '@/shared/events';

const event = new FormSubmissionStatusChangedEvent(
  submissionId,
  'draft',
  'submitted',
  userId
);

await eventBus.publish(event);
```

### 2. Event Bus

The Event Bus is the central hub for publishing and subscribing to events.

Publishing Events:

```typescript
import { EventBus } from '@/shared/events';

const eventBus = EventBus.getInstance();
await eventBus.publish(event);
```

Subscribing to Events:

```typescript
eventBus.subscribe('FormSubmissionStatusChanged', async (event) => {
  console.log('Form submission status changed:', event);
});
```

### 3. Event Listeners

Event listeners handle specific domain events. They are automatically registered during application startup.

Creating a Custom Listener:

```typescript
import { EventListener, DomainEvent } from '@/shared/events';

export class MyCustomListener extends EventListener {
  getEventType(): string {
    return 'FormSubmissionStatusChanged';
  }

  async handle(event: DomainEvent): Promise<void> {
    // Handle the event
    console.log('Event received:', event);
  }
}
```

Registering the Listener:

```typescript
import { EventListenerRegistry } from '@/shared/events';

const registry = EventListenerRegistry.getInstance();
registry.register(new MyCustomListener());
```

### 4. Query Object Pattern

Queries encapsulate read operations and their parameters.

Creating a Query:

```typescript
import { GetFormSubmissionQuery, QueryBus } from '@/shared/patterns';

const query = new GetFormSubmissionQuery(submissionId, true, true);
const result = await QueryBus.getInstance().execute(query);
```

Creating a Query Handler:

```typescript
import { Query, IQueryHandler } from '@/shared/patterns';

export class GetFormSubmissionQueryHandler implements IQueryHandler<GetFormSubmissionQuery> {
  async handle(query: GetFormSubmissionQuery): Promise<FormSubmission> {
    return FormSubmission.findBySubmissionId(query.submissionId);
  }
}
```

Registering the Handler:

```typescript
const queryBus = QueryBus.getInstance();
queryBus.register('GetFormSubmissionQuery', new GetFormSubmissionQueryHandler());
```

### 5. CQRS Pattern

Commands encapsulate write operations and trigger domain events.

Creating a Command:

```typescript
import { CreateFormSubmissionCommand, CommandBus } from '@/shared/patterns';

const command = new CreateFormSubmissionCommand(
  formTemplateId,
  userId,
  formData
);

const result = await CommandBus.getInstance().execute(command);
```

Creating a Command Handler:

```typescript
import { Command, ICommandHandler } from '@/shared/patterns';

export class CreateFormSubmissionCommandHandler implements ICommandHandler<CreateFormSubmissionCommand> {
  async handle(command: CreateFormSubmissionCommand): Promise<FormSubmission> {
    const submission = new FormSubmission({
      form_template_id: command.formTemplateId,
      submitted_by: { user_id: command.submittedBy },
      data: command.data,
    });

    await submission.save();

    // Publish domain event
    const event = new FormSubmissionCreatedEvent(
      submission.submission_id,
      command.formTemplateId,
      command.submittedBy
    );
    await EventBus.getInstance().publish(event);

    return submission;
  }
}
```

Registering the Handler:

```typescript
const commandBus = CommandBus.getInstance();
commandBus.register('CreateFormSubmissionCommand', new CreateFormSubmissionCommandHandler());
```

## Cross-Domain Communication

Events enable seamless communication between different domains without tight coupling.

Example: Form Submission triggers Task Creation

1. Form submission is approved (event published)
2. Task listener receives the event
3. Task listener creates a new task
4. Task creation event is published
5. Other domains can react to the task creation

```typescript
// In FormEventListeners.ts
export class FormSubmissionApprovalListener extends EventListener {
  getEventType(): string {
    return 'FormSubmissionApproved';
  }

  async handle(event: DomainEvent): Promise<void> {
    // Create a task based on the form submission
    const taskCommand = new CreateTaskCommand(
      event.aggregateId,
      'Follow up on approval',
      userId
    );
    await CommandBus.getInstance().execute(taskCommand);
  }
}
```

## Event History

The Event Bus maintains a history of all published events for auditing and replay purposes.

```typescript
const eventBus = EventBus.getInstance();

// Get last 100 events
const recentEvents = eventBus.getHistory(100);

// Get events for a specific aggregate
const submissionEvents = eventBus.getEventsByAggregateId(submissionId);

// Get events of a specific type
const statusChangeEvents = eventBus.getEventsByType('FormSubmissionStatusChanged');
```

## Best Practices

1. **Keep Events Immutable**: Don't modify event data after creation
2. **Include All Relevant Data**: Events should contain all information needed by listeners
3. **Use Meaningful Names**: Event names should clearly describe what happened
4. **Handle Errors Gracefully**: Listeners should not throw exceptions that stop other listeners
5. **Avoid Circular Dependencies**: Prevent listeners from triggering events that create loops
6. **Log Events**: Always log important domain events for auditing
7. **Test Listeners**: Write unit tests for event listeners
8. **Document Events**: Document what each event means and when it's published

## Initialization

Initialize event listeners during application startup:

```typescript
import { initializeEventListeners } from '@/shared/events';

// In app.ts or server.ts
initializeEventListeners();
```

## Available Events

### Form Events

- `FormTemplateCreated`
- `FormTemplatePublished`
- `FormSubmissionCreated`
- `FormSubmissionStatusChanged`
- `FormSubmissionApproved`
- `FormSubmissionRejected`

### Task Events

- `TaskCreated`
- `TaskStatusChanged`
- `TaskAssigned`
- `TaskCompleted`
- `TaskDeleted`

### Incident Events

- `IncidentCreated`
- `IncidentStatusChanged`
- `IncidentAssigned`
- `IncidentResolved`
- `IncidentClosed`

## Future Enhancements

- Persistent event store (Event Sourcing)
- Event replay and projection
- Distributed event bus (RabbitMQ/Kafka)
- Event versioning and migration
- Saga pattern for distributed transactions
