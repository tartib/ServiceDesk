/**
 * WebSocket Broadcast Consumer
 * 
 * Handles events that need real-time broadcast to connected clients
 */

import eventBus from '../event-bus';
import {
  DomainEvent,
  QUEUES,
  ROUTING_PATTERNS,
} from '../event.types';
import logger from '../../../utils/logger';

const QUEUE_NAME = QUEUES.WEBSOCKET_BROADCAST;

// Reference to socket.io instance (set during initialization)
let io: any = null;

/**
 * Initialize WebSocket broadcast consumer
 */
export async function initWebSocketConsumer(socketIO: any): Promise<void> {
  io = socketIO;

  // Subscribe to OPS work order events (real-time dashboard)
  await eventBus.subscribe(
    QUEUE_NAME,
    ROUTING_PATTERNS.OPS_WORK_ORDER_ALL,
    handleOpsEvent
  );

  // Subscribe to PM events (board updates)
  await eventBus.subscribe(
    QUEUE_NAME,
    ROUTING_PATTERNS.PM_ALL,
    handlePmEvent
  );

  // Subscribe to ITSM events (service desk dashboard)
  await eventBus.subscribe(
    QUEUE_NAME,
    ROUTING_PATTERNS.ITSM_ALL,
    handleItsmEvent
  );

  // Subscribe to Workflow events (workflow dashboard)
  await eventBus.subscribe(
    QUEUE_NAME,
    ROUTING_PATTERNS.WF_ALL,
    handleWorkflowEvent
  );

  logger.info('🔌 WebSocket broadcast consumer initialized');
}

/**
 * Handle OPS domain events - broadcast to dashboard
 */
async function handleOpsEvent(event: DomainEvent<unknown>): Promise<void> {
  if (!io) {
    logger.warn('WebSocket not initialized, skipping broadcast');
    return;
  }

  const room = `org:${event.organizationId}:ops`;
  
  logger.debug('Broadcasting OPS event to WebSocket', {
    type: event.type,
    room,
  });

  // Broadcast to organization's OPS room
  io.to(room).emit('ops:event', {
    type: event.type,
    data: event.data,
    timestamp: event.timestamp,
  });
}

/**
 * Handle PM domain events - broadcast to board
 */
async function handlePmEvent(event: DomainEvent<unknown>): Promise<void> {
  if (!io) {
    logger.warn('WebSocket not initialized, skipping broadcast');
    return;
  }

  // Extract projectId from event data if available
  const projectId = (event.data as any)?.projectId;
  
  if (projectId) {
    const room = `project:${projectId}:board`;
    
    logger.debug('Broadcasting PM event to WebSocket', {
      type: event.type,
      room,
    });

    // Broadcast to project's board room
    io.to(room).emit('pm:event', {
      type: event.type,
      data: event.data,
      timestamp: event.timestamp,
    });
  }

  // Also broadcast to organization feed
  const orgRoom = `org:${event.organizationId}:activity`;
  io.to(orgRoom).emit('activity:event', {
    type: event.type,
    data: event.data,
    timestamp: event.timestamp,
    userId: event.userId,
  });
}

/**
 * Handle ITSM domain events - broadcast to service desk dashboard
 */
async function handleItsmEvent(event: DomainEvent<unknown>): Promise<void> {
  if (!io) {
    logger.warn('WebSocket not initialized, skipping broadcast');
    return;
  }

  const orgRoom = `org:${event.organizationId}:itsm`;

  logger.debug('Broadcasting ITSM event to WebSocket', {
    type: event.type,
    room: orgRoom,
  });

  io.to(orgRoom).emit('itsm:event', {
    type: event.type,
    data: event.data,
    timestamp: event.timestamp,
    userId: event.userId,
  });

  // Also broadcast to organization activity feed
  const activityRoom = `org:${event.organizationId}:activity`;
  io.to(activityRoom).emit('activity:event', {
    type: event.type,
    data: event.data,
    timestamp: event.timestamp,
    userId: event.userId,
  });
}

/**
 * Handle Workflow domain events - broadcast to workflow dashboard
 */
async function handleWorkflowEvent(event: DomainEvent<unknown>): Promise<void> {
  if (!io) {
    logger.warn('WebSocket not initialized, skipping broadcast');
    return;
  }

  const orgRoom = `org:${event.organizationId}:workflow`;

  logger.debug('Broadcasting Workflow event to WebSocket', {
    type: event.type,
    room: orgRoom,
  });

  io.to(orgRoom).emit('workflow:event', {
    type: event.type,
    data: event.data,
    timestamp: event.timestamp,
    userId: event.userId,
  });
}

export default initWebSocketConsumer;
