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
import logger from '../../../../../utils/logger';

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

export default initWebSocketConsumer;
