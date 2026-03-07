/**
 * Kafka / Redpanda Event Bus
 *
 * Central event bus for domain event publishing and consumption.
 * Falls back to an in-memory emitter when KAFKA_ENABLED is false,
 * keeping the developer experience lightweight.
 */

import { Kafka, Producer, Consumer, EachMessagePayload, logLevel as KafkaLogLevel } from 'kafkajs';
import logger from '../../utils/logger';
import env from '../../config/env';
import { DomainEvent, EventHandler, EventSubscription } from './event.types';

// ============================================================
// TOPICS
// ============================================================

export const TOPICS = {
  ITSM: 'servicedesk.itsm',
  PM: 'servicedesk.pm',
  OPS: 'servicedesk.ops',
  WORKFLOW: 'servicedesk.workflow',
  NOTIFICATIONS: 'servicedesk.notifications',
  SLA: 'servicedesk.sla',
  DLQ: 'servicedesk.dlq',
} as const;

export type TopicName = typeof TOPICS[keyof typeof TOPICS];

// Map event-type prefix → topic
function topicForEvent(eventType: string): TopicName {
  if (eventType.startsWith('itsm.')) return TOPICS.ITSM;
  if (eventType.startsWith('pm.')) return TOPICS.PM;
  if (eventType.startsWith('ops.')) return TOPICS.OPS;
  if (eventType.startsWith('wf.')) return TOPICS.WORKFLOW;
  if (eventType.startsWith('sd.')) return TOPICS.ITSM; // SD events → ITSM topic
  if (eventType.startsWith('sla.')) return TOPICS.SLA;
  return TOPICS.NOTIFICATIONS;
}

// ============================================================
// IN-MEMORY FALLBACK
// ============================================================

class InMemoryBus {
  private handlers: Map<string, EventHandler<unknown>[]> = new Map();

  async publish<T>(event: DomainEvent<T>): Promise<boolean> {
    const eventType = event.type;
    // Notify exact-match handlers
    const exact = this.handlers.get(eventType) || [];
    // Notify wildcard pattern handlers
    const all: EventHandler<unknown>[] = [...exact];
    for (const [pattern, handlers] of this.handlers) {
      if (pattern === eventType) continue;
      if (this.matchPattern(pattern, eventType)) {
        all.push(...handlers);
      }
    }
    await Promise.all(
      all.map((h) =>
        h(event as DomainEvent<unknown>).catch((err) =>
          logger.error('In-memory handler error', { error: err, eventType })
        )
      )
    );
    return true;
  }

  subscribe(routingKey: string, handler: EventHandler<unknown>): void {
    const existing = this.handlers.get(routingKey) || [];
    existing.push(handler);
    this.handlers.set(routingKey, existing);
  }

  /**
   * Simple wildcard matching: '#' matches any, '*' matches one segment
   */
  private matchPattern(pattern: string, eventType: string): boolean {
    if (pattern === '#') return true;
    const pParts = pattern.split('.');
    const eParts = eventType.split('.');
    let pi = 0;
    let ei = 0;
    while (pi < pParts.length && ei < eParts.length) {
      if (pParts[pi] === '#') return true;
      if (pParts[pi] === '*') {
        pi++;
        ei++;
        continue;
      }
      if (pParts[pi] !== eParts[ei]) return false;
      pi++;
      ei++;
    }
    return pi === pParts.length && ei === eParts.length;
  }
}

// ============================================================
// KAFKA EVENT BUS
// ============================================================

class EventBus {
  private kafka: Kafka | null = null;
  private producer: Producer | null = null;
  private consumers: Map<string, Consumer> = new Map();
  private isConnected = false;
  private kafkaEnabled: boolean;
  private inMemoryBus: InMemoryBus = new InMemoryBus();
  private subscriptions: EventSubscription[] = [];
  private reconnectTimeout: NodeJS.Timeout | null = null;

  constructor() {
    this.kafkaEnabled = env.KAFKA_ENABLED;
  }

  // ----------------------------------------------------------
  // LIFECYCLE
  // ----------------------------------------------------------

  async connect(): Promise<void> {
    if (!this.kafkaEnabled) {
      logger.info('📨 Event bus running in IN-MEMORY mode (KAFKA_ENABLED=false)');
      this.isConnected = true;
      return;
    }

    try {
      const brokers = env.KAFKA_BROKERS.split(',').map((b) => b.trim());

      // Build Kafka config with optional SASL/SSL for production clusters
      const kafkaConfig: ConstructorParameters<typeof Kafka>[0] = {
        clientId: env.KAFKA_CLIENT_ID,
        brokers,
        connectionTimeout: env.KAFKA_CONNECTION_TIMEOUT,
        requestTimeout: env.KAFKA_REQUEST_TIMEOUT,
        logLevel: KafkaLogLevel.WARN,
        retry: { initialRetryTime: 300, retries: 10 },
        logCreator:
          () =>
          ({ log }) => {
            const { message, ...extra } = log;
            logger.debug(`[KafkaJS] ${message}`, extra);
          },
      };

      // SASL authentication (for managed Kafka / Confluent / MSK)
      if (env.KAFKA_SASL_MECHANISM && env.KAFKA_SASL_USERNAME) {
        const mechanism = env.KAFKA_SASL_MECHANISM;
        const creds = { username: env.KAFKA_SASL_USERNAME, password: env.KAFKA_SASL_PASSWORD };
        if (mechanism === 'plain') {
          kafkaConfig.sasl = { mechanism: 'plain' as const, ...creds };
        } else if (mechanism === 'scram-sha-256') {
          kafkaConfig.sasl = { mechanism: 'scram-sha-256' as const, ...creds };
        } else if (mechanism === 'scram-sha-512') {
          kafkaConfig.sasl = { mechanism: 'scram-sha-512' as const, ...creds };
        }
      }

      // SSL (required for most managed Kafka services)
      if (env.KAFKA_SSL_ENABLED) {
        kafkaConfig.ssl = true;
      }

      this.kafka = new Kafka(kafkaConfig);

      // Create producer
      this.producer = this.kafka.producer({
        allowAutoTopicCreation: true,
        idempotent: true,
      });
      await this.producer.connect();

      // Ensure topics exist
      const admin = this.kafka.admin();
      await admin.connect();
      const existingTopics = await admin.listTopics();
      const missingTopics = Object.values(TOPICS).filter((t) => !existingTopics.includes(t));
      if (missingTopics.length > 0) {
        await admin.createTopics({
          topics: missingTopics.map((topic) => ({
            topic,
            numPartitions: 3,
            replicationFactor: 1,
          })),
        });
        logger.info('Created Kafka topics', { topics: missingTopics });
      }
      await admin.disconnect();

      this.isConnected = true;
      logger.info('📨 Kafka event bus connected', { brokers });

      // Re-subscribe pending subscriptions
      await this.resubscribeAll();
    } catch (error) {
      logger.error('Failed to connect to Kafka', { error });
      this.scheduleReconnect();
    }
  }

  async disconnect(): Promise<void> {
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }
    for (const [, consumer] of this.consumers) {
      await consumer.disconnect().catch(() => {});
    }
    this.consumers.clear();
    if (this.producer) {
      await this.producer.disconnect().catch(() => {});
      this.producer = null;
    }
    this.isConnected = false;
    logger.info('Kafka event bus disconnected');
  }

  private scheduleReconnect(): void {
    if (this.reconnectTimeout) clearTimeout(this.reconnectTimeout);
    this.reconnectTimeout = setTimeout(() => this.connect(), 5000);
  }

  private async resubscribeAll(): Promise<void> {
    for (const sub of this.subscriptions) {
      await this.setupKafkaConsumer(sub);
    }
  }

  // ----------------------------------------------------------
  // PUBLISH
  // ----------------------------------------------------------

  async publish<T>(event: DomainEvent<T>): Promise<boolean> {
    // Always publish locally for in-process listeners
    await this.inMemoryBus.publish(event);

    if (!this.kafkaEnabled) return true;

    if (!this.producer || !this.isConnected) {
      logger.warn('Cannot publish event: Kafka not connected', { eventType: event.type });
      return false;
    }

    try {
      const topic = topicForEvent(event.type);
      await this.producer.send({
        topic,
        messages: [
          {
            key: event.organizationId || event.id,
            value: JSON.stringify(event),
            headers: {
              'x-event-type': event.type,
              'x-event-version': event.version,
              'x-event-id': event.id,
              'x-organization-id': event.organizationId || '',
              'x-correlation-id': event.correlationId || '',
            },
          },
        ],
      });

      logger.debug('Event published to Kafka', {
        topic,
        type: event.type,
        id: event.id,
      });
      return true;
    } catch (error) {
      logger.error('Failed to publish event to Kafka', { error, eventType: event.type });
      return false;
    }
  }

  // ----------------------------------------------------------
  // SUBSCRIBE
  // ----------------------------------------------------------

  async subscribe<T>(
    queueName: string,
    routingKey: string,
    handler: EventHandler<T>
  ): Promise<void> {
    const subscription: EventSubscription = {
      queueName,
      routingKey,
      handler: handler as EventHandler<unknown>,
    };

    this.subscriptions.push(subscription);

    // Always register in-memory (handles KAFKA_ENABLED=false and local dispatch)
    this.inMemoryBus.subscribe(routingKey, handler as EventHandler<unknown>);

    // Setup Kafka consumer if connected
    if (this.kafkaEnabled && this.isConnected && this.kafka) {
      await this.setupKafkaConsumer(subscription);
    }
  }

  private async setupKafkaConsumer(sub: EventSubscription): Promise<void> {
    if (!this.kafka) return;

    const groupId = `${env.KAFKA_CONSUMER_GROUP}.${sub.queueName}`;

    // Reuse consumer per groupId
    if (this.consumers.has(groupId)) return;

    const consumer = this.kafka.consumer({
      groupId,
      retry: { retries: 5 },
    });

    await consumer.connect();

    // Determine which topics to subscribe to based on routing key
    const topics = this.topicsForRoutingKey(sub.routingKey);
    for (const topic of topics) {
      await consumer.subscribe({ topic, fromBeginning: false });
    }

    await consumer.run({
      eachMessage: async (payload: EachMessagePayload) => {
        const { message } = payload;
        if (!message.value) return;

        try {
          const event: DomainEvent<unknown> = JSON.parse(message.value.toString());
          const eventType = (message.headers?.['x-event-type']?.toString()) || event.type;

          // Check if this handler should process this event type
          if (!this.matchesRoutingKey(sub.routingKey, eventType)) return;

          logger.debug('Kafka event received', {
            type: eventType,
            id: event.id,
            groupId,
          });

          await sub.handler(event);
        } catch (error) {
          logger.error('Failed to process Kafka event', {
            error,
            groupId,
            offset: message.offset,
          });
          // In a real production setup, send to DLQ here
        }
      },
    });

    this.consumers.set(groupId, consumer);
    logger.info('Kafka consumer started', { groupId, routingKey: sub.routingKey });
  }

  /**
   * Map a routing key pattern to Kafka topic(s)
   */
  private topicsForRoutingKey(routingKey: string): TopicName[] {
    if (routingKey === '#' || routingKey === '*.*.*') {
      return Object.values(TOPICS).filter((t) => t !== TOPICS.DLQ);
    }
    if (routingKey.startsWith('itsm.') || routingKey.startsWith('sd.')) return [TOPICS.ITSM];
    if (routingKey.startsWith('pm.')) return [TOPICS.PM];
    if (routingKey.startsWith('ops.')) return [TOPICS.OPS];
    if (routingKey.startsWith('wf.')) return [TOPICS.WORKFLOW];
    // Broad patterns like *.*.created → subscribe to all
    return Object.values(TOPICS).filter((t) => t !== TOPICS.DLQ);
  }

  private matchesRoutingKey(pattern: string, eventType: string): boolean {
    if (pattern === '#') return true;
    const pParts = pattern.split('.');
    const eParts = eventType.split('.');
    let pi = 0;
    let ei = 0;
    while (pi < pParts.length && ei < eParts.length) {
      if (pParts[pi] === '#') return true;
      if (pParts[pi] === '*') { pi++; ei++; continue; }
      if (pParts[pi] !== eParts[ei]) return false;
      pi++; ei++;
    }
    return pi === pParts.length && ei === eParts.length;
  }

  // ----------------------------------------------------------
  // STATUS
  // ----------------------------------------------------------

  getStatus(): { connected: boolean; mode: 'kafka' | 'in-memory'; consumerCount: number } {
    return {
      connected: this.isConnected,
      mode: this.kafkaEnabled ? 'kafka' : 'in-memory',
      consumerCount: this.consumers.size,
    };
  }
}

// ============================================================
// SINGLETON EXPORT
// ============================================================

export const eventBus = new EventBus();

export default eventBus;
