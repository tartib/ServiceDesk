/**
 * RuleExecutionService — ITSM Automation Rule Executor
 *
 * Loads matching rules for a trigger event, evaluates conditions,
 * maps ITSM RuleActionType → workflow WFActionType, and delegates
 * execution to the shared ActionExecutor.
 */

import mongoose from 'mongoose';
import {
  AutomationRuleStatus,
  RuleTriggerType,
  RuleOperator,
  RuleActionType,
  type IAutomationRule,
  type IRuleExecutionLog,
  type RuleExecutionResult,
} from '../models/AutomationRule';
import { WFActionType, WFActorType } from '../../../core/types/workflow-engine.types';
import type { IWFAction, IWFExecutionContext, IWFActionResult } from '../../../core/types/workflow-engine.types';
import { ActionExecutor, type IWFNotificationService, type IWFWebhookService, type IWFEntityService } from '../../workflow-engine/engine/ActionExecutor';

// ============================================
// Types
// ============================================

export interface RuleExecutionContext {
  triggerType: RuleTriggerType;
  entity: Record<string, any>;
  entityType: string;
  entityId: string;
  organizationId: string;
  actor?: {
    id: string;
    name?: string;
    roles?: string[];
    department?: string;
  };
  changes?: Record<string, { old: any; new: any }>;
  metadata?: Record<string, any>;
}

export interface RuleExecutionServiceOptions {
  notificationService?: IWFNotificationService;
  webhookService?: IWFWebhookService;
  entityService?: IWFEntityService;
}

// ============================================
// ITSM RuleActionType → WFActionType mapping
// ============================================

const ACTION_TYPE_MAP: Partial<Record<RuleActionType, WFActionType>> = {
  [RuleActionType.ASSIGN_TICKET]: WFActionType.ASSIGN,
  [RuleActionType.SET_PRIORITY]: WFActionType.SET_FIELD,
  [RuleActionType.SET_STATUS]: WFActionType.SET_FIELD,
  [RuleActionType.ADD_TAG]: WFActionType.SET_FIELD,
  [RuleActionType.REMOVE_TAG]: WFActionType.SET_FIELD,
  [RuleActionType.ADD_COMMENT]: WFActionType.ADD_COMMENT,
  [RuleActionType.NOTIFY_USER]: WFActionType.NOTIFY,
  [RuleActionType.NOTIFY_TEAM]: WFActionType.NOTIFY,
  [RuleActionType.SEND_EMAIL]: WFActionType.SEND_EMAIL,
  [RuleActionType.EXECUTE_WEBHOOK]: WFActionType.CALL_WEBHOOK,
  [RuleActionType.CREATE_TASK]: WFActionType.CREATE_TASK,
  [RuleActionType.SET_FIELD]: WFActionType.SET_FIELD,
  [RuleActionType.RUN_SCRIPT]: WFActionType.RUN_SCRIPT,
  [RuleActionType.EXECUTE_WORKFLOW]: WFActionType.CUSTOM,
  [RuleActionType.ROUTE_TO_QUEUE]: WFActionType.ASSIGN,
  [RuleActionType.REQUEST_APPROVAL]: WFActionType.CUSTOM,
  [RuleActionType.CREATE_INCIDENT]: WFActionType.CUSTOM,
  [RuleActionType.LINK_TICKETS]: WFActionType.CUSTOM,
  [RuleActionType.MERGE_TICKETS]: WFActionType.CUSTOM,
};

// ============================================
// Service
// ============================================

export class RuleExecutionService {
  private actionExecutor: ActionExecutor;

  constructor(options?: RuleExecutionServiceOptions) {
    this.actionExecutor = new ActionExecutor({
      notificationService: options?.notificationService,
      webhookService: options?.webhookService,
      entityService: options?.entityService,
    });
  }

  /**
   * Execute all matching rules for a given trigger event.
   * Returns an array of execution results (one per rule).
   */
  async executeRules(ctx: RuleExecutionContext): Promise<RuleExecutionResult[]> {
    const startTime = Date.now();
    const results: RuleExecutionResult[] = [];

    // 1. Load matching active rules, sorted by execution.priority desc
    const AutomationRuleModel = mongoose.model<IAutomationRule>('AutomationRule');
    const rules: any[] = await AutomationRuleModel.find({
      status: AutomationRuleStatus.ACTIVE,
      'trigger.type': ctx.triggerType,
      $or: [
        { organizationId: ctx.organizationId },
        { organizationId: { $exists: false } },
      ],
    }).sort({ 'execution.priority': -1 }).lean();

    if (rules.length === 0) return results;

    // 2. For each rule, evaluate & execute
    for (const rule of rules) {
      const ruleStart = Date.now();
      const executionId = `exec_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;

      try {
        // 2a. Scope check
        if (!this.matchesScope(rule, ctx)) {
          continue;
        }

        // 2b. Trigger filter check
        if (!this.matchesTriggerFilters(rule, ctx)) {
          continue;
        }

        // 2c. Evaluate conditions
        const conditionsResult = this.evaluateConditions(rule, ctx);

        if (!conditionsResult.matched) {
          results.push({
            success: true,
            ruleId: rule.ruleId,
            executionId,
            conditionsMatched: false,
            actionsExecuted: 0,
            actionsFailed: 0,
            errors: [],
            durationMs: Date.now() - ruleStart,
          });
          continue;
        }

        // 2d. Map & execute actions via shared ActionExecutor
        const wfActions = this.mapActions(rule.actions);
        const fakeContext = this.buildFakeWFContext(rule, ctx);
        const actionResults = await this.actionExecutor.executeActions(wfActions, fakeContext);

        const failedActions = actionResults.filter((r) => !r.success);

        // 2e. Log execution
        await this.logExecution(rule, executionId, ctx, conditionsResult, actionResults, ruleStart);

        // 2f. Update stats
        await this.updateRuleStats(rule, actionResults, ruleStart);

        results.push({
          success: failedActions.length === 0,
          ruleId: rule.ruleId,
          executionId,
          conditionsMatched: true,
          actionsExecuted: actionResults.length,
          actionsFailed: failedActions.length,
          errors: failedActions.map((f) => f.error || 'Unknown error'),
          durationMs: Date.now() - ruleStart,
        });
      } catch (error: any) {
        console.error(`[RuleExecutionService] Rule ${rule.ruleId} failed:`, error.message);
        results.push({
          success: false,
          ruleId: rule.ruleId,
          executionId,
          conditionsMatched: false,
          actionsExecuted: 0,
          actionsFailed: 0,
          errors: [error.message],
          durationMs: Date.now() - ruleStart,
        });
      }
    }

    const totalMs = Date.now() - startTime;
    if (results.length > 0) {
      console.log(
        `[RuleExecutionService] Executed ${results.length} rules for ${ctx.triggerType} on ${ctx.entityType}:${ctx.entityId} in ${totalMs}ms`
      );
    }

    return results;
  }

  // ============================================
  // Scope matching
  // ============================================

  private matchesScope(rule: any, ctx: RuleExecutionContext): boolean {
    const scope = rule.scope;
    if (!scope || scope.applyTo === 'all') return true;

    if (scope.ticketTypes?.length > 0) {
      const ticketType = ctx.entity?.type || ctx.entityType;
      if (!scope.ticketTypes.includes(ticketType)) return false;
    }
    if (scope.priorities?.length > 0) {
      const priority = ctx.entity?.priority;
      if (priority && !scope.priorities.includes(priority)) return false;
    }
    if (scope.categories?.length > 0) {
      const category = ctx.entity?.category;
      if (category && !scope.categories.includes(category)) return false;
    }
    if (scope.services?.length > 0) {
      const service = ctx.entity?.service || ctx.entity?.serviceId;
      if (service && !scope.services.includes(service)) return false;
    }

    return true;
  }

  // ============================================
  // Trigger filter matching
  // ============================================

  private matchesTriggerFilters(rule: any, ctx: RuleExecutionContext): boolean {
    const filters = rule.trigger?.filters;
    if (!filters || filters.length === 0) return true;

    for (const filter of filters) {
      const actual = this.resolveField(filter.field, ctx);
      if (!this.compareValue(actual, filter.operator, filter.value)) {
        return false;
      }
    }
    return true;
  }

  // ============================================
  // Condition evaluation
  // ============================================

  private evaluateConditions(
    rule: any,
    ctx: RuleExecutionContext
  ): { matched: boolean; results: Array<{ field: string; passed: boolean }> } {
    const cond = rule.conditions;
    if (!cond || !cond.groups || cond.groups.length === 0) {
      return { matched: true, results: [] };
    }

    const groupResults: boolean[] = [];
    const details: Array<{ field: string; passed: boolean }> = [];

    for (const group of cond.groups) {
      const condResults: boolean[] = [];

      for (const condition of group.conditions) {
        const actual = this.resolveField(condition.field, ctx);
        const passed = this.compareValue(actual, condition.operator, condition.value);
        condResults.push(passed);
        details.push({ field: condition.field, passed });
      }

      // Within-group logic
      const groupPassed =
        group.operator === 'OR'
          ? condResults.some((r) => r)
          : condResults.every((r) => r);
      groupResults.push(groupPassed);
    }

    // Root-level logic
    const matched =
      cond.operator === 'OR'
        ? groupResults.some((r) => r)
        : groupResults.every((r) => r);

    return { matched, results: details };
  }

  // ============================================
  // Field resolution
  // ============================================

  private resolveField(fieldPath: string, ctx: RuleExecutionContext): any {
    if (!fieldPath) return undefined;

    // Support dot-path: entity.priority, actor.role, changes.status.new, etc.
    const parts = fieldPath.split('.');
    const root = parts[0];
    const rest = parts.slice(1);

    let target: any;
    switch (root) {
      case 'entity':
        target = ctx.entity;
        break;
      case 'actor':
        target = ctx.actor;
        break;
      case 'changes':
        target = ctx.changes;
        break;
      case 'metadata':
        target = ctx.metadata;
        break;
      default:
        // Try entity first
        target = ctx.entity;
        return this.getByPath(target, fieldPath);
    }

    return rest.length > 0 ? this.getByPath(target, rest.join('.')) : target;
  }

  private getByPath(obj: any, path: string): any {
    if (!obj || !path) return undefined;
    return path.split('.').reduce((acc, key) => acc?.[key], obj);
  }

  // ============================================
  // Value comparison
  // ============================================

  private compareValue(actual: any, operator: RuleOperator | string, expected: any): boolean {
    switch (operator) {
      case RuleOperator.EQUALS:
      case 'equals':
        return String(actual) === String(expected);
      case RuleOperator.NOT_EQUALS:
      case 'not_equals':
        return String(actual) !== String(expected);
      case RuleOperator.CONTAINS:
      case 'contains':
        return String(actual).toLowerCase().includes(String(expected).toLowerCase());
      case RuleOperator.NOT_CONTAINS:
      case 'not_contains':
        return !String(actual).toLowerCase().includes(String(expected).toLowerCase());
      case RuleOperator.STARTS_WITH:
      case 'starts_with':
        return String(actual).toLowerCase().startsWith(String(expected).toLowerCase());
      case RuleOperator.ENDS_WITH:
      case 'ends_with':
        return String(actual).toLowerCase().endsWith(String(expected).toLowerCase());
      case RuleOperator.GREATER_THAN:
      case 'greater_than':
        return Number(actual) > Number(expected);
      case RuleOperator.LESS_THAN:
      case 'less_than':
        return Number(actual) < Number(expected);
      case RuleOperator.GREATER_OR_EQUAL:
      case 'greater_or_equal':
        return Number(actual) >= Number(expected);
      case RuleOperator.LESS_OR_EQUAL:
      case 'less_or_equal':
        return Number(actual) <= Number(expected);
      case RuleOperator.IN:
      case 'in': {
        const arr = Array.isArray(expected) ? expected : String(expected).split(',').map((s: string) => s.trim());
        return arr.includes(String(actual));
      }
      case RuleOperator.NOT_IN:
      case 'not_in': {
        const arr2 = Array.isArray(expected) ? expected : String(expected).split(',').map((s: string) => s.trim());
        return !arr2.includes(String(actual));
      }
      case RuleOperator.IS_EMPTY:
      case 'is_empty':
        return actual === null || actual === undefined || actual === '' || (Array.isArray(actual) && actual.length === 0);
      case RuleOperator.IS_NOT_EMPTY:
      case 'is_not_empty':
        return actual !== null && actual !== undefined && actual !== '' && !(Array.isArray(actual) && actual.length === 0);
      case RuleOperator.MATCHES_REGEX:
      case 'matches_regex':
        try {
          return new RegExp(String(expected)).test(String(actual));
        } catch {
          return false;
        }
      case RuleOperator.IS_TRUE:
      case 'is_true':
        return actual === true || actual === 'true' || actual === 1;
      case RuleOperator.IS_FALSE:
      case 'is_false':
        return actual === false || actual === 'false' || actual === 0;
      default:
        return false;
    }
  }

  // ============================================
  // Action mapping — ITSM → WF action types
  // ============================================

  private mapActions(ruleActions: any[]): IWFAction[] {
    if (!ruleActions || ruleActions.length === 0) return [];

    return ruleActions
      .sort((a: any, b: any) => a.order - b.order)
      .map((ra: any, idx: number) => {
        const wfType = ACTION_TYPE_MAP[ra.type as RuleActionType] || WFActionType.CUSTOM;
        const config: Record<string, any> = ra.config instanceof Map
          ? Object.fromEntries(ra.config)
          : { ...(ra.config as Record<string, any> || {}) };

        // Enrich config for mapped types
        switch (ra.type) {
          case RuleActionType.SET_PRIORITY:
            config.fieldPath = config.fieldPath || 'priority';
            config.value = config.value || config.priority;
            config.operation = 'set';
            break;
          case RuleActionType.SET_STATUS:
            config.fieldPath = config.fieldPath || 'status';
            config.value = config.value || config.status;
            config.operation = 'set';
            break;
          case RuleActionType.ADD_TAG:
            config.fieldPath = config.fieldPath || 'tags';
            config.value = config.value || config.tag;
            config.operation = 'append';
            break;
          case RuleActionType.REMOVE_TAG:
            config.fieldPath = config.fieldPath || 'tags';
            config.value = config.value || config.tag;
            config.operation = 'remove';
            break;
          case RuleActionType.ASSIGN_TICKET:
            config.userId = config.userId || config.assigneeId;
            break;
          case RuleActionType.ROUTE_TO_QUEUE:
            config.assignmentType = 'group';
            config.userId = config.queueId || config.userId;
            break;
        }

        return {
          actionId: `rule_act_${idx}`,
          type: wfType,
          config,
          order: ra.order || idx + 1,
          retryOnFailure: false,
          continueOnError: !ra.stopOnFailure,
        };
      });
  }

  // ============================================
  // Build fake WFExecutionContext for ActionExecutor
  // ============================================

  private buildFakeWFContext(
    rule: any,
    ctx: RuleExecutionContext
  ): IWFExecutionContext {
    return {
      instance: {
        _id: ctx.entityId,
        definitionId: rule._id,
        definitionVersion: rule.version || 1,
        organizationId: ctx.organizationId,
        entityType: ctx.entityType as any,
        entityId: ctx.entityId,
        currentState: ctx.entity?.status || 'unknown',
        status: 'active' as any,
        parallelBranches: [],
        variables: { ...ctx.entity },
        timers: [],
        startedAt: new Date(),
        startedBy: ctx.actor?.id || 'system',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      definition: {
        _id: rule._id,
        organizationId: ctx.organizationId,
        name: rule.name,
        nameAr: rule.nameAr,
        entityType: ctx.entityType as any,
        version: rule.version || 1,
        isLatest: true,
        status: 'published' as any,
        states: [],
        transitions: [],
        initialState: '',
        finalStates: [],
        settings: {
          allowParallelSteps: false,
          requireCommentsOnReject: false,
          enableDelegation: false,
          maxDelegationDepth: 0,
          trackSLA: false,
          enableTimers: false,
          enableWebhooks: false,
        },
        createdBy: '',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      actor: {
        id: ctx.actor?.id || 'system',
        type: WFActorType.SYSTEM,
        name: ctx.actor?.name || 'Automation Engine',
        roles: ctx.actor?.roles,
        department: ctx.actor?.department,
      },
      entity: ctx.entity,
    };
  }

  // ============================================
  // Execution logging
  // ============================================

  private async logExecution(
    rule: any,
    executionId: string,
    ctx: RuleExecutionContext,
    conditionsResult: { matched: boolean; results: Array<{ field: string; passed: boolean }> },
    actionResults: IWFActionResult[],
    startTime: number
  ): Promise<void> {
    try {
      const RuleExecutionLogModel = mongoose.model<IRuleExecutionLog>('RuleExecutionLog');
      const failedCount = actionResults.filter((r) => !r.success).length;

      await RuleExecutionLogModel.create({
        ruleId: rule._id,
        ruleName: rule.name,
        triggerTicketId: ctx.entityId,
        triggerType: ctx.triggerType,
        executionId,
        startedAt: new Date(startTime),
        completedAt: new Date(),
        durationMs: Date.now() - startTime,
        status: failedCount === 0 ? 'success' : failedCount < actionResults.length ? 'partial' : 'failed',
        context: {
          entityType: ctx.entityType,
          entityId: ctx.entityId,
          triggerType: ctx.triggerType,
        },
        conditionsEvaluated: conditionsResult.results.map((r, i) => ({
          groupIndex: 0,
          conditionIndex: i,
          field: r.field,
          operator: 'equals' as RuleOperator,
          expectedValue: null,
          actualValue: null,
          result: r.passed,
        })),
        conditionsResult: conditionsResult.matched,
        actionsExecuted: actionResults.map((ar, i) => ({
          order: i + 1,
          type: ar.type as unknown as RuleActionType,
          status: ar.success ? 'success' as const : 'failed' as const,
          error: ar.error,
          result: ar.result,
          durationMs: 0,
          startedAt: new Date(startTime),
          completedAt: new Date(),
        })),
        retryCount: 0,
        maxRetries: 0,
      });
    } catch (error: any) {
      console.error(`[RuleExecutionService] Failed to log execution for rule ${rule.ruleId}:`, error.message);
    }
  }

  // ============================================
  // Stats update
  // ============================================

  private async updateRuleStats(
    rule: any,
    actionResults: IWFActionResult[],
    startTime: number
  ): Promise<void> {
    try {
      const AutomationRuleModel = mongoose.model<IAutomationRule>('AutomationRule');
      const failed = actionResults.filter((r) => !r.success).length;
      const success = failed === 0;
      const durationMs = Date.now() - startTime;

      await AutomationRuleModel.updateOne(
        { _id: rule._id },
        {
          $inc: {
            'stats.executionCount': 1,
            'stats.successCount': success ? 1 : 0,
            'stats.failureCount': success ? 0 : 1,
          },
          $set: {
            'stats.lastExecutedAt': new Date(),
            'stats.lastExecutionStatus': success ? 'success' : failed < actionResults.length ? 'partial' : 'failed',
            'stats.averageExecutionTimeMs': durationMs,
          },
        }
      );
    } catch (error: any) {
      console.error(`[RuleExecutionService] Failed to update stats for rule ${rule.ruleId}:`, error.message);
    }
  }
}

// Singleton factory
let _ruleExecutionService: RuleExecutionService | null = null;

export function getRuleExecutionService(options?: RuleExecutionServiceOptions): RuleExecutionService {
  if (!_ruleExecutionService) {
    _ruleExecutionService = new RuleExecutionService(options);
  }
  return _ruleExecutionService;
}

export function resetRuleExecutionService(): void {
  _ruleExecutionService = null;
}
