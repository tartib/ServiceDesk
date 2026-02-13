/**
 * Rules Engine - محرك القواعد التجارية
 * Smart Forms System
 * 
 * مسؤول عن:
 * - تقييم وتنفيذ القواعد التجارية
 * - تنفيذ الإجراءات التلقائية
 * - معالجة الأحداث والمحفزات
 */

import {
  IBusinessRule,
  IRuleContext,
  IRuleExecutionResult,
  RuleTriggerType,
  RuleActionType,
} from '../types/smart-forms.types';
import { ConditionalLogicEngine } from './ConditionalLogicEngine';

// ============================================
// INTERFACES
// ============================================

export interface IRuleAction {
  action_id: string;
  type: RuleActionType;
  config: Record<string, any>;
  order: number;
}

export interface INotificationService {
  sendEmail(to: string, subject: string, body: string, template?: string): Promise<void>;
  sendSMS(to: string, message: string): Promise<void>;
  sendPush(userId: string, title: string, body: string): Promise<void>;
}

export interface IIntegrationService {
  callWebhook(url: string, method: string, headers: Record<string, string>, body: any): Promise<any>;
  callAPI(endpoint: string, config: Record<string, any>): Promise<any>;
}

export interface ITaskService {
  createTask(config: {
    title: string;
    description?: string;
    assignee: string;
    due_date?: Date;
    priority?: string;
    linked_submission?: string;
  }): Promise<string>;
}

// ============================================
// RULES ENGINE
// ============================================

export class RulesEngine {
  private conditionalLogicEngine: ConditionalLogicEngine;
  private notificationService?: INotificationService;
  private integrationService?: IIntegrationService;
  private taskService?: ITaskService;

  constructor(options?: {
    conditionalLogicEngine?: ConditionalLogicEngine;
    notificationService?: INotificationService;
    integrationService?: IIntegrationService;
    taskService?: ITaskService;
  }) {
    this.conditionalLogicEngine = options?.conditionalLogicEngine || new ConditionalLogicEngine();
    this.notificationService = options?.notificationService;
    this.integrationService = options?.integrationService;
    this.taskService = options?.taskService;
  }

  /**
   * تنفيذ القواعد بناءً على المحفز
   */
  async executeRules(
    rules: IBusinessRule[],
    trigger: RuleTriggerType,
    context: IRuleContext
  ): Promise<IRuleExecutionResult[]> {
    const results: IRuleExecutionResult[] = [];

    // تصفية القواعد النشطة والمطابقة للمحفز
    const applicableRules = rules
      .filter(rule => rule.is_active && rule.trigger === trigger)
      .sort((a, b) => a.priority - b.priority);

    for (const rule of applicableRules) {
      // تقييم الشروط
      if (rule.conditions) {
        const conditionsMet = this.conditionalLogicEngine.evaluateConditionGroup(
          rule.conditions,
          context
        );
        if (!conditionsMet) continue;
      }

      // تنفيذ الإجراءات
      const result = await this.executeRule(rule, context);
      results.push(result);

      // إذا كانت القاعدة تتطلب التوقف عند التنفيذ
      if (rule.stop_on_first_match) {
        break;
      }
    }

    return results;
  }

  /**
   * تنفيذ قاعدة واحدة
   */
  private async executeRule(
    rule: IBusinessRule,
    context: IRuleContext
  ): Promise<IRuleExecutionResult> {
    const result: IRuleExecutionResult = {
      rule_id: rule.rule_id,
      executed_at: new Date(),
      actions: [],
    };

    // ترتيب الإجراءات حسب الترتيب
    const sortedActions = [...rule.actions].sort((a, b) => a.order - b.order);

    for (const action of sortedActions) {
      try {
        const actionResult = await this.executeAction(action, context);
        result.actions.push({
          action_id: action.action_id,
          success: true,
          result: actionResult,
        });
      } catch (error: any) {
        result.actions.push({
          action_id: action.action_id,
          success: false,
          error: error.message,
        });
      }
    }

    return result;
  }

  /**
   * تنفيذ إجراء واحد
   */
  private async executeAction(
    action: IRuleAction,
    context: IRuleContext
  ): Promise<any> {
    const config = this.resolveConfig(action.config, context);

    switch (action.type) {
      case RuleActionType.SEND_EMAIL:
        return this.sendEmail(config, context);

      case RuleActionType.SEND_SMS:
        return this.sendSMS(config, context);

      case RuleActionType.SEND_NOTIFICATION:
        return this.sendNotification(config, context);

      case RuleActionType.CREATE_TASK:
        return this.createTask(config, context);

      case RuleActionType.UPDATE_FIELD:
        return this.updateField(config, context);

      case RuleActionType.SET_FIELD_VALUE:
        return this.setFieldValue(config, context);

      case RuleActionType.ASSIGN_TO:
        return this.assignTo(config, context);

      case RuleActionType.CHANGE_STATUS:
        return this.changeStatus(config, context);

      case RuleActionType.ESCALATE:
        return this.escalate(config, context);

      case RuleActionType.CALL_WEBHOOK:
        return this.callWebhook(config, context);

      case RuleActionType.CALL_API:
        return this.callAPI(config, context);

      case RuleActionType.LOG_ACTIVITY:
        return this.logActivity(config, context);

      case RuleActionType.ADD_COMMENT:
        return this.addComment(config, context);

      case RuleActionType.CALCULATE:
        return this.calculate(config, context);

      case RuleActionType.VALIDATE:
        return this.validate(config, context);

      default:
        console.log(`Unknown action type: ${action.type}`);
        return null;
    }
  }

  /**
   * حل قيم التكوين مع المتغيرات
   */
  private resolveConfig(
    config: Record<string, any>,
    context: IRuleContext
  ): Record<string, any> {
    const resolved: Record<string, any> = {};

    for (const [key, value] of Object.entries(config)) {
      if (typeof value === 'string') {
        resolved[key] = this.resolveTemplate(value, context);
      } else if (typeof value === 'object' && value !== null) {
        resolved[key] = this.resolveConfig(value, context);
      } else {
        resolved[key] = value;
      }
    }

    return resolved;
  }

  /**
   * حل قالب النص مع المتغيرات
   */
  private resolveTemplate(template: string, context: IRuleContext): string {
    return template.replace(/\{\{([^}]+)\}\}/g, (match, path) => {
      const value = this.getValueByPath(context, path.trim());
      return value !== undefined ? String(value) : match;
    });
  }

  /**
   * الحصول على قيمة من مسار
   */
  private getValueByPath(obj: any, path: string): any {
    const parts = path.split('.');
    let current = obj;

    for (const part of parts) {
      if (current === null || current === undefined) return undefined;
      
      // دعم المسارات الخاصة
      if (part === 'submission') {
        current = current.submission;
      } else if (part === 'data') {
        current = current.submission?.data || current.formData;
      } else if (part === 'user') {
        current = current.user;
      } else if (part === 'now') {
        return new Date();
      } else if (part === 'today') {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return today;
      } else {
        current = current[part];
      }
    }

    return current;
  }

  // ============================================
  // ACTION IMPLEMENTATIONS
  // ============================================

  /**
   * إرسال بريد إلكتروني
   */
  private async sendEmail(
    config: Record<string, any>,
    _context: IRuleContext
  ): Promise<void> {
    if (!this.notificationService) {
      console.log('Email notification (no service):', config);
      return;
    }

    await this.notificationService.sendEmail(
      config.to,
      config.subject,
      config.body,
      config.template
    );
  }

  /**
   * إرسال رسالة SMS
   */
  private async sendSMS(
    config: Record<string, any>,
    _context: IRuleContext
  ): Promise<void> {
    if (!this.notificationService) {
      console.log('SMS notification (no service):', config);
      return;
    }

    await this.notificationService.sendSMS(config.to, config.message);
  }

  /**
   * إرسال إشعار
   */
  private async sendNotification(
    config: Record<string, any>,
    _context: IRuleContext
  ): Promise<void> {
    if (!this.notificationService) {
      console.log('Push notification (no service):', config);
      return;
    }

    await this.notificationService.sendPush(
      config.user_id,
      config.title,
      config.body
    );
  }

  /**
   * إنشاء مهمة
   */
  private async createTask(
    config: Record<string, any>,
    context: IRuleContext
  ): Promise<string | null> {
    if (!this.taskService) {
      console.log('Create task (no service):', config);
      return null;
    }

    return this.taskService.createTask({
      title: config.title,
      description: config.description,
      assignee: config.assignee,
      due_date: config.due_date ? new Date(config.due_date) : undefined,
      priority: config.priority,
      linked_submission: context.submission?.submission_id,
    });
  }

  /**
   * تحديث حقل
   */
  private async updateField(
    config: Record<string, any>,
    context: IRuleContext
  ): Promise<void> {
    if (!context.submission) return;

    const { field_id, value, operation } = config;

    switch (operation) {
      case 'set':
        context.submission.data[field_id] = value;
        break;
      case 'increment':
        context.submission.data[field_id] = (context.submission.data[field_id] || 0) + value;
        break;
      case 'decrement':
        context.submission.data[field_id] = (context.submission.data[field_id] || 0) - value;
        break;
      case 'append': {
        const current = context.submission.data[field_id];
        if (Array.isArray(current)) {
          context.submission.data[field_id] = [...current, value];
        } else {
          context.submission.data[field_id] = [current, value].filter(Boolean);
        }
        break;
      }
      case 'clear':
        context.submission.data[field_id] = null;
        break;
    }
  }

  /**
   * تعيين قيمة حقل
   */
  private async setFieldValue(
    config: Record<string, any>,
    context: IRuleContext
  ): Promise<void> {
    if (!context.submission) return;
    context.submission.data[config.field_id] = config.value;
  }

  /**
   * تعيين إلى مستخدم
   */
  private async assignTo(
    config: Record<string, any>,
    context: IRuleContext
  ): Promise<void> {
    if (!context.submission) return;

    context.submission.workflow_state.assigned_to = {
      user_id: config.user_id,
      name: config.user_name || config.user_id,
      assigned_at: new Date(),
      assigned_by: 'rules_engine',
    };
  }

  /**
   * تغيير الحالة
   */
  private async changeStatus(
    config: Record<string, any>,
    context: IRuleContext
  ): Promise<void> {
    if (!context.submission) return;
    context.submission.workflow_state.status = config.status;
  }

  /**
   * التصعيد
   */
  private async escalate(
    config: Record<string, any>,
    _context: IRuleContext
  ): Promise<void> {
    // يمكن تنفيذ منطق التصعيد هنا
    console.log('Escalation triggered:', config);
  }

  /**
   * استدعاء Webhook
   */
  private async callWebhook(
    config: Record<string, any>,
    context: IRuleContext
  ): Promise<any> {
    if (!this.integrationService) {
      console.log('Webhook call (no service):', config);
      return null;
    }

    return this.integrationService.callWebhook(
      config.url,
      config.method || 'POST',
      config.headers || {},
      {
        submission_id: context.submission?.submission_id,
        data: context.submission?.data,
        ...config.payload,
      }
    );
  }

  /**
   * استدعاء API
   */
  private async callAPI(
    config: Record<string, any>,
    _context: IRuleContext
  ): Promise<any> {
    if (!this.integrationService) {
      console.log('API call (no service):', config);
      return null;
    }

    return this.integrationService.callAPI(config.endpoint, config);
  }

  /**
   * تسجيل نشاط
   */
  private async logActivity(
    config: Record<string, any>,
    context: IRuleContext
  ): Promise<void> {
    console.log(`[Activity Log] ${config.message}`, {
      submission_id: context.submission?.submission_id,
      timestamp: new Date(),
      ...config.data,
    });
  }

  /**
   * إضافة تعليق
   */
  private async addComment(
    config: Record<string, any>,
    context: IRuleContext
  ): Promise<void> {
    if (!context.submission) return;

    const comment = {
      comment_id: `CMT-${Date.now()}`,
      content: config.content,
      user_id: 'system',
      user_name: 'System',
      is_internal: config.is_internal || true,
      created_at: new Date(),
    };

    if (!context.submission.comments) {
      context.submission.comments = [];
    }
    context.submission.comments.push(comment);
  }

  /**
   * حساب قيمة
   */
  private async calculate(
    config: Record<string, any>,
    context: IRuleContext
  ): Promise<any> {
    const { formula, target_field } = config;
    
    // استبدال المتغيرات في الصيغة
    let expression = formula;
    const variablePattern = /\{([^}]+)\}/g;
    let match;

    while ((match = variablePattern.exec(formula)) !== null) {
      const fieldId = match[1];
      const value = context.submission?.data[fieldId] || 0;
      expression = expression.replace(match[0], String(value));
    }

    // تقييم التعبير بأمان
    try {
      const sanitized = expression.replace(/[^0-9+\-*/().%]/g, '');
      const fn = new Function(`return (${sanitized})`);
      const result = fn();

      if (target_field && context.submission) {
        context.submission.data[target_field] = result;
      }

      return result;
    } catch {
      return null;
    }
  }

  /**
   * التحقق من صحة
   */
  private async validate(
    config: Record<string, any>,
    context: IRuleContext
  ): Promise<{ valid: boolean; errors: string[] }> {
    const errors: string[] = [];

    for (const validation of config.validations || []) {
      const value = context.submission?.data[validation.field_id];
      
      switch (validation.type) {
        case 'required':
          if (value === null || value === undefined || value === '') {
            errors.push(validation.message || `${validation.field_id} is required`);
          }
          break;
        case 'min':
          if (typeof value === 'number' && value < validation.value) {
            errors.push(validation.message || `${validation.field_id} must be at least ${validation.value}`);
          }
          break;
        case 'max':
          if (typeof value === 'number' && value > validation.value) {
            errors.push(validation.message || `${validation.field_id} must be at most ${validation.value}`);
          }
          break;
        case 'pattern':
          if (typeof value === 'string' && !new RegExp(validation.pattern).test(value)) {
            errors.push(validation.message || `${validation.field_id} format is invalid`);
          }
          break;
      }
    }

    return { valid: errors.length === 0, errors };
  }

  // ============================================
  // UTILITY METHODS
  // ============================================

  /**
   * الحصول على القواعد المطبقة
   */
  getApplicableRules(
    rules: IBusinessRule[],
    trigger: RuleTriggerType,
    context: IRuleContext
  ): IBusinessRule[] {
    return rules
      .filter(rule => rule.is_active && rule.trigger === trigger)
      .filter(rule => {
        if (!rule.conditions) return true;
        return this.conditionalLogicEngine.evaluateConditionGroup(rule.conditions, context);
      })
      .sort((a, b) => a.priority - b.priority);
  }

  /**
   * التحقق من صحة القاعدة
   */
  validateRule(rule: IBusinessRule): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!rule.rule_id) {
      errors.push('Rule ID is required');
    }

    if (!rule.name) {
      errors.push('Rule name is required');
    }

    if (!rule.trigger) {
      errors.push('Rule trigger is required');
    }

    if (!rule.actions || rule.actions.length === 0) {
      errors.push('At least one action is required');
    }

    return { valid: errors.length === 0, errors };
  }
}

// ============================================
// SINGLETON INSTANCE
// ============================================

export const rulesEngine = new RulesEngine();

export default RulesEngine;
