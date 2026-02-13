/**
 * RabbitMQ Event Bus
 * 
 * Central event bus for domain event publishing and consumption
 */

import amqp, { Connection, Channel, ConsumeMessage } from 'amqplib';
import logger from '../../../../utils/logger';
import { DomainEvent, EventHandler, EventSubscription } from './event.types';

// ============================================================
// CONFIGURATION
// ============================================================

const RABBITMQ_URL = process.env.RABBITMQ_URL || 'amqp://localhost:5672';
const EXCHANGE_NAME = 'servicedesk.events';
const EXCHANGE_TYPE = 'topic';

// ============================================================
// EVENT BUS CLASS
// ============================================================

class EventBus {
  private connection: Connection | null = null;
  private channel: Channel | null = null;
  private isConnected = false;
  private reconnectTimeout: NodeJS.Timeout | null = null;
  private subscriptions: Map<string, EventSubscription[]> = new Map();

  /**
   * Connect to RabbitMQ
   */
  async connect(): Promise<void> {
    try {
      this.connection = await amqp.connect(RABBITMQ_URL);
      this.channel = await this.connection.createChannel();

      // Setup exchange
      await this.channel.assertExchange(EXCHANGE_NAME, EXCHANGE_TYPE, {
        durable: true,
      });

      this.isConnected = true;
      logger.info('🐰 RabbitMQ connected successfully');

      // Handle connection close
      this.connection.on('close', () => {
        this.isConnected = false;
        logger.warn('RabbitMQ connection closed, attempting to reconnect...');
        this.scheduleReconnect();
      });

      this.connection.on('error', (err: any) => {
        logger.error('RabbitMQ connection error', { error: err.message });
      });

      // Re-subscribe all handlers after reconnection
      await this.resubscribeAll();

    } catch (error) {
      logger.error('Failed to connect to RabbitMQ', { error });
      this.scheduleReconnect();
    }
  }

  /**
   * Schedule reconnection attempt
   */
  private scheduleReconnect(): void {
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
    }
    this.reconnectTimeout = setTimeout(() => {
      this.connect();
    }, 5000); // Retry every 5 seconds
  }

  /**
   * Re-subscribe all handlers after reconnection
   */
  private async resubscribeAll(): Promise<void> {
    for (const [eventType, subscriptions] of this.subscriptions) {
      for (const sub of subscriptions) {
        await this.setupConsumer(sub.queueName, sub.routingKey, sub.handler);
      }
    }
  }

  /**
   * Close connection
   */
  async close(): Promise<void> {
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
    }
    if (this.channel) {
      await this.channel.close();
    }
    if (this.connection) {
      await this.connection.close();
    }
    this.isConnected = false;
    logger.info('RabbitMQ connection closed');
  }

  /**
   * Publish an event to the exchange
   */
  async publish<T>(event: DomainEvent<T>): Promise<boolean> {
    if (!this.channel || !this.isConnected) {
      logger.warn('Cannot publish event: RabbitMQ not connected', { eventType: event.type });
      // Store event for later retry (could use Redis/DB)
      return false;
    }

    try {
      const routingKey = event.type; // e.g., 'ops.work_order.created'
      const message = Buffer.from(JSON.stringify(event));

      this.channel.publish(EXCHANGE_NAME, routingKey, message, {
        persistent: true,
        contentType: 'application/json',
        timestamp: Date.now(),
        messageId: event.id,
        headers: {
          'x-event-version': event.version,
          'x-organization-id': event.organizationId,
          'x-correlation-id': event.correlationId,
        },
      });

      logger.debug('Event published', {
        type: event.type,
        id: event.id,
        organizationId: event.organizationId,
      });

      return true;
    } catch (error) {
      logger.error('Failed to publish event', { error, eventType: event.type });
      return false;
    }
  }

  /**
   * Subscribe to events matching a routing pattern
   */
  async subscribe<T>(
    queueName: string,
    routingKey: string,
    handler: EventHandler<T>
  ): Promise<void> {
    // Store subscription for reconnection
    const subscription: EventSubscription = {
      queueName,
      routingKey,
      handler: handler as EventHandler<unknown>,
    };

    const existing = this.subscriptions.get(routingKey) || [];
    existing.push(subscription);
    this.subscriptions.set(routingKey, existing);

    if (this.isConnected && this.channel) {
      await this.setupConsumer(queueName, routingKey, handler);
    }
  }

  /**
   * Setup a consumer for a queue
   */
  private async setupConsumer<T>(
    queueName: string,
    routingKey: string,
    handler: EventHandler<T>
  ): Promise<void> {
    if (!this.channel) return;

    // Assert queue
    await this.channel.assertQueue(queueName, {
      durable: true,
      deadLetterExchange: `${EXCHANGE_NAME}.dlx`,
    });

    // Bind queue to exchange with routing key
    await this.channel.bindQueue(queueName, EXCHANGE_NAME, routingKey);

    // Set prefetch (process one message at a time)
    await this.channel.prefetch(1);

    // Consume messages
    await this.channel.consume(queueName, async (msg: ConsumeMessage | null) => {
      if (!msg) return;

      try {
        const event: DomainEvent<T> = JSON.parse(msg.content.toString());
        
        logger.debug('Event received', {
          type: event.type,
          id: event.id,
          queue: queueName,
        });

        await handler(event);

        // Acknowledge successful processing
        this.channel?.ack(msg);

      } catch (error) {
        logger.error('Failed to process event', {
          error,
          queue: queueName,
          messageId: msg.properties.messageId,
        });

        // Reject and requeue (or send to DLQ after max retries)
        const retryCount = (msg.properties.headers?.['x-retry-count'] || 0) + 1;
        if (retryCount < 3) {
          // Requeue with retry count
          this.channel?.reject(msg, true);
        } else {
          // Send to dead letter queue
          this.channel?.reject(msg, false);
        }
      }
    });

    logger.info(`Subscribed to events`, { queue: queueName, routingKey });
  }
}

// ============================================================
// SINGLETON EXPORT
// ============================================================

export const eventBus = new EventBus();

export default eventBus;
