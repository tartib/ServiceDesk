/**
 * SLA Escalation Engine
 *
 * Evaluates escalation rules against metric instances and fires actions.
 * Called by the scheduler when metrics approach or breach their targets.
 */

import {
  ISlaEscalationRuleEntity,
  ISlaMetricInstanceEntity,
  ISlaCalendarResolved,
  SlaEscalationTrigger,
  SlaEscalationAction,
  SlaMetricStatus,
  SlaEventType,
  SlaEventSource,
} from '../domain';
import { slaClockEngine } from './SlaClockEngine';
import logger from '../../../utils/logger';

export interface EscalationContext {
  tenantId: string;
  ticketId: string;
  instanceId: string;
  metricInstanceId: string;
  metricKey: string;
  targetMinutes: number;
  elapsedSeconds: number;
  remainingSeconds: number;
  dueAt?: Date;
}

export interface EscalationActionResult {
  ruleId: string;
  actionType: SlaEscalationAction;
  success: boolean;
  error?: string;
}

export interface IEscalationActionHandler {
  execute(
    action: SlaEscalationAction,
    config: Record<string, unknown>,
    context: EscalationContext
  ): Promise<boolean>;
}

export class EscalationEngine {
  private actionHandler: IEscalationActionHandler | null = null;

  /**
   * Set the action handler (dependency injection for notification/webhook dispatch)
   */
  setActionHandler(handler: IEscalationActionHandler): void {
    this.actionHandler = handler;
  }

  /**
   * Evaluate all escalation rules for a metric instance.
   * Returns the list of rules that should fire.
   */
  evaluateRules(
    metric: ISlaMetricInstanceEntity,
    rules: ISlaEscalationRuleEntity[],
    calendar: ISlaCalendarResolved,
    now: Date = new Date()
  ): ISlaEscalationRuleEntity[] {
    const triggerable: ISlaEscalationRuleEntity[] = [];

    const remainingSec = slaClockEngine.getRemainingSeconds(metric, calendar, now);
    const isBreached = metric.status === SlaMetricStatus.BREACHED;
    const targetSec = metric.targetMinutes * 60;

    for (const rule of rules) {
      if (!rule.isActive) continue;

      const offsetSec = rule.offsetMinutes * 60;

      switch (rule.triggerType) {
        case SlaEscalationTrigger.BEFORE_BREACH:
          // Fire when remaining time <= offsetMinutes and not yet breached
          if (!isBreached && remainingSec <= offsetSec && remainingSec > 0) {
            triggerable.push(rule);
          }
          break;

        case SlaEscalationTrigger.ON_BREACH:
          // Fire when breached (remaining <= 0 or status is breached)
          if (isBreached || remainingSec <= 0) {
            triggerable.push(rule);
          }
          break;

        case SlaEscalationTrigger.AFTER_BREACH:
          // Fire when breached AND elapsed past target by offsetMinutes
          if (isBreached || remainingSec <= 0) {
            const elapsedPastTarget = (metric.elapsedBusinessSeconds - targetSec);
            if (elapsedPastTarget >= offsetSec) {
              triggerable.push(rule);
            }
          }
          break;
      }
    }

    return triggerable.sort((a, b) => a.sortOrder - b.sortOrder);
  }

  /**
   * Execute escalation actions for triggerable rules.
   */
  async executeEscalations(
    rules: ISlaEscalationRuleEntity[],
    context: EscalationContext
  ): Promise<EscalationActionResult[]> {
    const results: EscalationActionResult[] = [];

    for (const rule of rules) {
      try {
        let success = false;

        if (this.actionHandler) {
          success = await this.actionHandler.execute(
            rule.actionType,
            rule.actionConfig,
            context
          );
        } else {
          // No handler set — log only
          logger.warn('[SLA:Escalation] No action handler set, skipping execution', {
            ruleId: rule.id,
            actionType: rule.actionType,
          });
          success = true; // Don't block on missing handler
        }

        results.push({
          ruleId: rule.id!,
          actionType: rule.actionType,
          success,
        });

        logger.info('[SLA:Escalation] Rule executed', {
          ruleId: rule.id,
          actionType: rule.actionType,
          triggerType: rule.triggerType,
          context: {
            ticketId: context.ticketId,
            metricKey: context.metricKey,
          },
          success,
        });
      } catch (err) {
        logger.error('[SLA:Escalation] Rule execution failed', {
          ruleId: rule.id,
          error: err,
        });
        results.push({
          ruleId: rule.id!,
          actionType: rule.actionType,
          success: false,
          error: (err as Error).message,
        });
      }
    }

    return results;
  }
}

export const escalationEngine = new EscalationEngine();
