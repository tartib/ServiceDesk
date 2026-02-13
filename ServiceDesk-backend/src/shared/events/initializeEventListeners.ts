import { EventListenerRegistry } from './EventListener';
import { FormSubmissionStatusChangeListener, FormSubmissionApprovalListener } from './listeners/FormEventListeners';
import { TaskStatusChangeListener, TaskCompletionListener, TaskAssignmentListener } from './listeners/TaskEventListeners';
import { IncidentStatusChangeListener, IncidentResolutionListener, IncidentAssignmentListener } from './listeners/IncidentEventListeners';
import logger from '../../utils/logger';

/**
 * Initialize all event listeners
 * Call this during application startup
 */
export function initializeEventListeners(): void {
  const registry = EventListenerRegistry.getInstance();

  // Register Form Event Listeners
  registry.register(new FormSubmissionStatusChangeListener());
  registry.register(new FormSubmissionApprovalListener());

  // Register Task Event Listeners
  registry.register(new TaskStatusChangeListener());
  registry.register(new TaskCompletionListener());
  registry.register(new TaskAssignmentListener());

  // Register Incident Event Listeners
  registry.register(new IncidentStatusChangeListener());
  registry.register(new IncidentResolutionListener());
  registry.register(new IncidentAssignmentListener());

  logger.info('Event listeners initialized successfully', {
    totalListeners: registry.getAllListeners().length,
  });
}
