/**
 * SLA Policy Assignment Engine
 *
 * Evaluates ticket attributes against policy match conditions to find
 * the best-matching SLA policy. Policies are pre-sorted by priority
 * (lower number = higher priority). First match wins.
 */

import { ISlaPolicyEntity, ISlaMatchCondition, SlaConditionOperator } from '../domain';
import logger from '../../../utils/logger';

export interface TicketAttributes {
  entityType: string;
  priority?: string;
  category?: string;
  serviceId?: string;
  customerTier?: string;
  requestType?: string;
  source?: string;
  assignedTeam?: string;
  [key: string]: unknown;
}

export class PolicyAssignmentEngine {
  /**
   * Find the best-matching policy for a ticket from an ordered list.
   * Policies should be pre-sorted by priority ASC (lower = higher priority).
   * Returns null if no policy matches.
   */
  matchPolicy(ticket: TicketAttributes, policies: ISlaPolicyEntity[]): ISlaPolicyEntity | null {
    for (const policy of policies) {
      if (!policy.isActive) continue;
      if (policy.entityType !== ticket.entityType) continue;

      if (this.evaluateConditions(ticket, policy.matchConditions)) {
        logger.debug('[SLA:PolicyAssignment] Matched policy', {
          policyCode: policy.code,
          ticketEntityType: ticket.entityType,
        });
        return policy;
      }
    }

    return null;
  }

  /**
   * Evaluate all match conditions against ticket attributes.
   * All conditions must be satisfied (AND logic).
   * An empty conditions array = catch-all (always matches).
   */
  private evaluateConditions(ticket: TicketAttributes, conditions: ISlaMatchCondition[]): boolean {
    if (!conditions || conditions.length === 0) return true;

    return conditions.every((cond) => this.evaluateCondition(ticket, cond));
  }

  /**
   * Evaluate a single match condition.
   */
  private evaluateCondition(ticket: TicketAttributes, cond: ISlaMatchCondition): boolean {
    const ticketValue = ticket[cond.field];

    switch (cond.operator) {
      case SlaConditionOperator.EQ:
        return ticketValue === cond.value;

      case SlaConditionOperator.NEQ:
        return ticketValue !== cond.value;

      case SlaConditionOperator.IN:
        if (Array.isArray(cond.value)) {
          return cond.value.includes(ticketValue as string);
        }
        return false;

      case SlaConditionOperator.NOT_IN:
        if (Array.isArray(cond.value)) {
          return !cond.value.includes(ticketValue as string);
        }
        return true;

      case SlaConditionOperator.GT:
        return typeof ticketValue === 'number' && typeof cond.value === 'number'
          ? ticketValue > cond.value
          : false;

      case SlaConditionOperator.GTE:
        return typeof ticketValue === 'number' && typeof cond.value === 'number'
          ? ticketValue >= cond.value
          : false;

      case SlaConditionOperator.LT:
        return typeof ticketValue === 'number' && typeof cond.value === 'number'
          ? ticketValue < cond.value
          : false;

      case SlaConditionOperator.LTE:
        return typeof ticketValue === 'number' && typeof cond.value === 'number'
          ? ticketValue <= cond.value
          : false;

      default:
        logger.warn('[SLA:PolicyAssignment] Unknown operator', { operator: cond.operator });
        return false;
    }
  }
}

export const policyAssignmentEngine = new PolicyAssignmentEngine();
