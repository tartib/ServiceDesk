/**
 * SD Domain Event Publisher
 * 
 * Publishes service desk related events to RabbitMQ
 */

import eventBus from '../event-bus';
import { SdEvents } from '../event-factory';
import {
  TicketCreatedEvent,
  TicketResolvedEvent,
} from '../event.types';
import logger from '../../../../../utils/logger';

interface EventContext {
  organizationId: string;
  userId: string;
  correlationId?: string;
}

export const SdEventPublisher = {
  /**
   * Publish ticket created event
   */
  async ticketCreated(
    data: TicketCreatedEvent,
    context: EventContext
  ): Promise<boolean> {
    const event = SdEvents.ticketCreated(data, context);
    const success = await eventBus.publish(event);
    
    if (success) {
      logger.info('Published: ticket.created', {
        ticketId: data.ticketId,
        reference: data.reference,
        type: data.type,
      });
    }
    
    return success;
  },

  /**
   * Publish ticket resolved event
   */
  async ticketResolved(
    data: TicketResolvedEvent,
    context: EventContext
  ): Promise<boolean> {
    const event = SdEvents.ticketResolved(data, context);
    const success = await eventBus.publish(event);
    
    if (success) {
      logger.info('Published: ticket.resolved', {
        ticketId: data.ticketId,
        resolutionTime: data.resolutionTime,
      });
    }
    
    return success;
  },
};

export default SdEventPublisher;
