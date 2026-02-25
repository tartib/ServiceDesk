/**
 * Action Executor - منفّذ الإجراءات
 * Workflow Engine
 *
 * مسؤول عن تنفيذ الإجراءات التلقائية عند الانتقالات ودخول/خروج الحالات
 */

import {
  WFActionType,
  type IWFAction,
  type IWFActionResult,
  type IWFExecutionContext,
} from '../../types/workflow-engine.types';
import { GuardEvaluator } from './GuardEvaluator';

export interface IWFNotificationService {
  send(params: {
    to: string;
    template: string;
    data: Record<string, any>;
    channel?: 'email' | 'push' | 'in_app' | 'sms';
  }): Promise<void>;
}

export interface IWFWebhookService {
  call(params: {
    url: string;
    method: string;
    headers?: Record<string, string>;
    body: any;
    timeout?: number;
  }): Promise<any>;
}

export interface IWFEntityService {
  updateEntity(entityType: string, entityId: string, updates: Record<string, any>): Promise<void>;
  getEntity(entityType: string, entityId: string): Promise<Record<string, any> | null>;
}

export class ActionExecutor {
  private guardEvaluator: GuardEvaluator;
  private notificationService?: IWFNotificationService;
  private webhookService?: IWFWebhookService;
  private entityService?: IWFEntityService;

  constructor(options?: {
    guardEvaluator?: GuardEvaluator;
    notificationService?: IWFNotificationService;
    webhookService?: IWFWebhookService;
    entityService?: IWFEntityService;
  }) {
    this.guardEvaluator = options?.guardEvaluator || new GuardEvaluator();
    this.notificationService = options?.notificationService;
    this.webhookService = options?.webhookService;
    this.entityService = options?.entityService;
  }

  /**
   * تنفيذ مجموعة إجراءات مرتبة
   */
  async executeActions(
    actions: IWFAction[],
    context: IWFExecutionContext
  ): Promise<IWFActionResult[]> {
    const results: IWFActionResult[] = [];
    const sorted = [...actions].sort((a, b) => a.order - b.order);

    for (const action of sorted) {
      // تحقق من الشرط إن وُجد
      if (action.condition) {
        const guardResult = this.guardEvaluator.evaluateGuard(action.condition, context);
        if (!guardResult.passed) {
          results.push({
            actionId: action.actionId,
            type: action.type,
            success: true,
            result: 'Skipped: condition not met',
          });
          continue;
        }
      }

      const result = await this.executeWithRetry(action, context);
      results.push(result);

      // إذا فشل الإجراء ولا يسمح بالاستمرار
      if (!result.success && !action.continueOnError) {
        break;
      }
    }

    return results;
  }

  /**
   * تنفيذ إجراء واحد مع إعادة المحاولة
   */
  private async executeWithRetry(
    action: IWFAction,
    context: IWFExecutionContext
  ): Promise<IWFActionResult> {
    const maxAttempts = action.retryOnFailure ? (action.maxRetries || 3) + 1 : 1;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        const result = await this.executeAction(action, context);
        return {
          actionId: action.actionId,
          type: action.type,
          success: true,
          result,
        };
      } catch (error: any) {
        if (attempt === maxAttempts) {
          return {
            actionId: action.actionId,
            type: action.type,
            success: false,
            error: error.message,
          };
        }
        // انتظار قبل إعادة المحاولة
        await this.delay(Math.pow(2, attempt) * 500);
      }
    }

    // لن يصل هنا لكن للسلامة
    return {
      actionId: action.actionId,
      type: action.type,
      success: false,
      error: 'Unexpected retry exhaustion',
    };
  }

  /**
   * تنفيذ إجراء واحد
   */
  private async executeAction(
    action: IWFAction,
    context: IWFExecutionContext
  ): Promise<any> {
    const config = this.resolveTemplates(action.config, context);

    switch (action.type) {
      case WFActionType.SET_FIELD:
        return this.executeSetField(config, context);

      case WFActionType.NOTIFY:
      case WFActionType.SEND_EMAIL:
        return this.executeNotify(config, context);

      case WFActionType.ASSIGN:
        return this.executeAssign(config, context);

      case WFActionType.CREATE_TASK:
        return this.executeCreateTask(config, context);

      case WFActionType.CALL_WEBHOOK:
        return this.executeCallWebhook(config, context);

      case WFActionType.CALL_API:
        return this.executeCallAPI(config, context);

      case WFActionType.ESCALATE:
        return this.executeEscalate(config, context);

      case WFActionType.UPDATE_ENTITY:
        return this.executeUpdateEntity(config, context);

      case WFActionType.LOG_ACTIVITY:
        return this.executeLogActivity(config, context);

      case WFActionType.ADD_COMMENT:
        return this.executeAddComment(config, context);

      case WFActionType.RUN_SCRIPT:
        return this.executeRunScript(config, context);

      case WFActionType.CUSTOM:
        return this.executeCustom(config, context);

      default:
        console.warn(`[ActionExecutor] Unknown action type: ${action.type}`);
        return null;
    }
  }

  // ============================================
  // ACTION IMPLEMENTATIONS
  // ============================================

  private async executeSetField(
    config: Record<string, any>,
    context: IWFExecutionContext
  ): Promise<void> {
    const { fieldPath, value, operation } = config;

    // تحديث في variables الخاصة بالـ instance
    const variables = context.instance.variables || {};

    switch (operation || 'set') {
      case 'set':
        this.setValueByPath(variables, fieldPath, value);
        break;
      case 'increment':
        this.setValueByPath(
          variables,
          fieldPath,
          (this.getValueByPath(variables, fieldPath) || 0) + (value || 1)
        );
        break;
      case 'decrement':
        this.setValueByPath(
          variables,
          fieldPath,
          (this.getValueByPath(variables, fieldPath) || 0) - (value || 1)
        );
        break;
      case 'append': {
        const current = this.getValueByPath(variables, fieldPath);
        if (Array.isArray(current)) {
          current.push(value);
        } else {
          this.setValueByPath(variables, fieldPath, [current, value].filter(Boolean));
        }
        break;
      }
      case 'clear':
        this.setValueByPath(variables, fieldPath, null);
        break;
    }

    context.instance.variables = variables;
  }

  private async executeNotify(
    config: Record<string, any>,
    context: IWFExecutionContext
  ): Promise<void> {
    if (!this.notificationService) {
      console.log('[ActionExecutor] Notification (no service):', config.template || 'default');
      return;
    }

    const to = config.to || context.instance.assignment?.userId || context.instance.startedBy;
    await this.notificationService.send({
      to,
      template: config.template || 'workflow_notification',
      data: {
        instanceId: context.instance._id?.toString(),
        entityType: context.instance.entityType,
        entityId: context.instance.entityId,
        currentState: context.instance.currentState,
        definitionName: context.definition.name,
        ...config.data,
      },
      channel: config.channel,
    });
  }

  private async executeAssign(
    config: Record<string, any>,
    context: IWFExecutionContext
  ): Promise<void> {
    context.instance.assignment = {
      userId: config.userId || config.to,
      userName: config.userName,
      assignedAt: new Date(),
      assignedBy: context.actor.id,
      assignmentType: config.assignmentType || 'user',
    };
  }

  private async executeCreateTask(
    config: Record<string, any>,
    _context: IWFExecutionContext
  ): Promise<string | null> {
    // placeholder — يتم ربطه بـ TaskService الحقيقي
    console.log('[ActionExecutor] Create task:', config.title);
    return null;
  }

  private async executeCallWebhook(
    config: Record<string, any>,
    context: IWFExecutionContext
  ): Promise<any> {
    if (!this.webhookService) {
      console.log('[ActionExecutor] Webhook (no service):', config.url);
      return null;
    }

    return this.webhookService.call({
      url: config.url,
      method: config.method || 'POST',
      headers: config.headers,
      body: {
        instanceId: context.instance._id?.toString(),
        entityType: context.instance.entityType,
        entityId: context.instance.entityId,
        currentState: context.instance.currentState,
        variables: context.instance.variables,
        ...config.payload,
      },
      timeout: config.timeout,
    });
  }

  private async executeCallAPI(
    config: Record<string, any>,
    context: IWFExecutionContext
  ): Promise<any> {
    // تستخدم نفس Webhook service مع endpoint داخلي
    if (!this.webhookService) {
      console.log('[ActionExecutor] API call (no service):', config.endpoint);
      return null;
    }

    return this.webhookService.call({
      url: config.endpoint,
      method: config.method || 'POST',
      headers: config.headers,
      body: {
        instanceId: context.instance._id?.toString(),
        ...config.body,
      },
    });
  }

  private async executeEscalate(
    config: Record<string, any>,
    context: IWFExecutionContext
  ): Promise<void> {
    // إرسال إشعار تصعيد
    if (this.notificationService) {
      const to = config.escalateTo || config.targetUserId || context.instance.startedBy;
      await this.notificationService.send({
        to,
        template: config.template || 'workflow_escalation',
        data: {
          instanceId: context.instance._id?.toString(),
          entityType: context.instance.entityType,
          entityId: context.instance.entityId,
          currentState: context.instance.currentState,
          reason: config.reason || 'SLA escalation',
        },
      });
    }
  }

  private async executeUpdateEntity(
    config: Record<string, any>,
    context: IWFExecutionContext
  ): Promise<void> {
    if (!this.entityService) {
      console.log('[ActionExecutor] Update entity (no service):', config);
      return;
    }

    await this.entityService.updateEntity(
      context.instance.entityType,
      context.instance.entityId,
      config.updates || config
    );
  }

  private async executeLogActivity(
    config: Record<string, any>,
    context: IWFExecutionContext
  ): Promise<void> {
    console.log(`[WorkflowActivity] ${config.message || 'Activity logged'}`, {
      instanceId: context.instance._id?.toString(),
      entityType: context.instance.entityType,
      entityId: context.instance.entityId,
      actor: context.actor.id,
      ...config.data,
    });
  }

  private async executeAddComment(
    config: Record<string, any>,
    context: IWFExecutionContext
  ): Promise<void> {
    const comment = {
      text: config.content || config.text,
      author: config.author || 'system',
      isInternal: config.isInternal !== false,
      timestamp: new Date(),
    };

    // إضافة التعليق في variables الخاصة بالـ instance
    if (!context.instance.variables._comments) {
      context.instance.variables._comments = [];
    }
    context.instance.variables._comments.push(comment);
  }

  private async executeRunScript(
    config: Record<string, any>,
    context: IWFExecutionContext
  ): Promise<any> {
    const { script } = config;
    if (!script) return null;

    try {
      const safeContext = {
        entity: context.entity || {},
        variables: context.instance.variables || {},
        actor: { id: context.actor.id, roles: context.actor.roles || [] },
        currentState: context.instance.currentState,
      };

      const fn = new Function(
        'ctx',
        `"use strict"; const { entity, variables, actor, currentState } = ctx; ${script}`
      );
      return fn(safeContext);
    } catch (error: any) {
      throw new Error(`Script execution error: ${error.message}`);
    }
  }

  private async executeCustom(
    config: Record<string, any>,
    _context: IWFExecutionContext
  ): Promise<any> {
    console.log('[ActionExecutor] Custom action:', config.name || 'unnamed');
    return null;
  }

  // ============================================
  // UTILITY METHODS
  // ============================================

  /**
   * حل القوالب في التكوين — يستبدل {{path}} بالقيم من السياق
   */
  private resolveTemplates(
    config: Record<string, any>,
    context: IWFExecutionContext
  ): Record<string, any> {
    const resolved: Record<string, any> = {};

    for (const [key, value] of Object.entries(config)) {
      if (typeof value === 'string') {
        resolved[key] = value.replace(/\{\{([^}]+)\}\}/g, (_match, path) => {
          const val = this.resolveTemplatePath(path.trim(), context);
          return val !== undefined ? String(val) : _match;
        });
      } else if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
        resolved[key] = this.resolveTemplates(value, context);
      } else {
        resolved[key] = value;
      }
    }

    return resolved;
  }

  private resolveTemplatePath(path: string, context: IWFExecutionContext): any {
    const parts = path.split('.');
    const root = parts[0];
    const rest = parts.slice(1);

    let current: any;
    switch (root) {
      case 'entity':
        current = context.entity;
        break;
      case 'variables':
        current = context.instance.variables;
        break;
      case 'actor':
        current = context.actor;
        break;
      case 'instance':
        current = context.instance;
        break;
      case 'definition':
        current = context.definition;
        break;
      default:
        return undefined;
    }

    for (const part of rest) {
      if (current === null || current === undefined) return undefined;
      current = current[part];
    }

    return current;
  }

  private getValueByPath(obj: any, path: string): any {
    const parts = path.split('.');
    let current = obj;
    for (const part of parts) {
      if (current === null || current === undefined) return undefined;
      current = current[part];
    }
    return current;
  }

  private setValueByPath(obj: any, path: string, value: any): void {
    const parts = path.split('.');
    let current = obj;
    for (let i = 0; i < parts.length - 1; i++) {
      if (current[parts[i]] === undefined || current[parts[i]] === null) {
        current[parts[i]] = {};
      }
      current = current[parts[i]];
    }
    current[parts[parts.length - 1]] = value;
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

export const actionExecutor = new ActionExecutor();
export default ActionExecutor;
