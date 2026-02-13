/**
 * Conditional Logic Engine - محرك المنطق الشرطي
 * Smart Forms System
 * 
 * مسؤول عن:
 * - تقييم الشروط المعقدة (AND/OR)
 * - تنفيذ الإجراءات الشرطية
 * - معالجة تغييرات الحقول
 */

import {
  ICondition,
  IConditionGroup,
  IConditionalRule,
  IConditionalAction,
  IEvaluationContext,
  IExecutionContext,
  IActionResult,
  ConditionType,
  ConditionOperator,
  ConditionalActionType,
} from '../types/smart-forms.types';

// ============================================
// INTERFACES
// ============================================

export interface IConditionalResult {
  appliedRules: string[];
  actions: IActionResult[];
}

// ============================================
// CONDITIONAL LOGIC ENGINE
// ============================================

export class ConditionalLogicEngine {
  /**
   * تقييم مجموعة شروط (AND/OR)
   */
  evaluateConditionGroup(
    group: IConditionGroup,
    context: IEvaluationContext
  ): boolean {
    if (!group.conditions || group.conditions.length === 0) {
      return true;
    }

    const results = group.conditions.map(condition => {
      // إذا كانت مجموعة شروط متداخلة
      if (this.isConditionGroup(condition)) {
        return this.evaluateConditionGroup(condition as IConditionGroup, context);
      }
      return this.evaluateCondition(condition as ICondition, context);
    });

    if (group.operator === 'AND') {
      return results.every(r => r === true);
    } else {
      return results.some(r => r === true);
    }
  }

  /**
   * تقييم شرط واحد
   */
  evaluateCondition(
    condition: ICondition,
    context: IEvaluationContext
  ): boolean {
    let leftValue: any;

    // تحديد القيمة اليسرى بناءً على نوع الشرط
    switch (condition.type) {
      case ConditionType.FIELD_VALUE:
        leftValue = this.getFieldValue(condition.field_id, context.formData);
        break;

      case ConditionType.FIELD_EMPTY:
        return this.isEmpty(this.getFieldValue(condition.field_id, context.formData));

      case ConditionType.FIELD_NOT_EMPTY:
        return !this.isEmpty(this.getFieldValue(condition.field_id, context.formData));

      case ConditionType.USER_ROLE:
        leftValue = context.user?.role;
        break;

      case ConditionType.USER_DEPARTMENT:
        leftValue = context.user?.department;
        break;

      case ConditionType.USER_SITE:
        leftValue = context.user?.site_id;
        break;

      case ConditionType.USER_ATTRIBUTE:
        leftValue = this.getUserAttribute(condition.user_attribute, context.user);
        break;

      case ConditionType.FORM_STATUS:
        leftValue = context.submission?.workflow_state?.status;
        break;

      case ConditionType.TIME_BASED:
        return this.evaluateTimeCondition(condition, context);

      case ConditionType.CUSTOM_FUNCTION:
        return this.evaluateCustomFunction(condition, context);

      default:
        return false;
    }

    // تطبيق العامل
    return this.applyOperator(leftValue, condition.operator, condition.value);
  }

  /**
   * تطبيق عامل المقارنة
   */
  private applyOperator(
    left: any,
    operator: ConditionOperator,
    right: any
  ): boolean {
    switch (operator) {
      case ConditionOperator.EQUALS:
        return this.isEqual(left, right);

      case ConditionOperator.NOT_EQUALS:
        return !this.isEqual(left, right);

      case ConditionOperator.CONTAINS:
        if (Array.isArray(left)) {
          return left.includes(right);
        }
        return String(left || '').toLowerCase().includes(String(right || '').toLowerCase());

      case ConditionOperator.NOT_CONTAINS:
        if (Array.isArray(left)) {
          return !left.includes(right);
        }
        return !String(left || '').toLowerCase().includes(String(right || '').toLowerCase());

      case ConditionOperator.STARTS_WITH:
        return String(left || '').toLowerCase().startsWith(String(right || '').toLowerCase());

      case ConditionOperator.ENDS_WITH:
        return String(left || '').toLowerCase().endsWith(String(right || '').toLowerCase());

      case ConditionOperator.GREATER_THAN:
        return this.toNumber(left) > this.toNumber(right);

      case ConditionOperator.LESS_THAN:
        return this.toNumber(left) < this.toNumber(right);

      case ConditionOperator.GREATER_OR_EQUAL:
        return this.toNumber(left) >= this.toNumber(right);

      case ConditionOperator.LESS_OR_EQUAL:
        return this.toNumber(left) <= this.toNumber(right);

      case ConditionOperator.BETWEEN: {
        if (!Array.isArray(right) || right.length !== 2) return false;
        const num = this.toNumber(left);
        return num >= this.toNumber(right[0]) && num <= this.toNumber(right[1]);
      }

      case ConditionOperator.IN:
        if (!Array.isArray(right)) return false;
        return right.some(r => this.isEqual(left, r));

      case ConditionOperator.NOT_IN:
        if (!Array.isArray(right)) return true;
        return !right.some(r => this.isEqual(left, r));

      case ConditionOperator.IS_EMPTY:
        return this.isEmpty(left);

      case ConditionOperator.IS_NOT_EMPTY:
        return !this.isEmpty(left);

      case ConditionOperator.MATCHES_REGEX:
        try {
          return new RegExp(right).test(String(left || ''));
        } catch {
          return false;
        }

      default:
        return false;
    }
  }

  /**
   * تنفيذ الإجراءات الشرطية
   */
  executeActions(
    actions: IConditionalAction[],
    context: IExecutionContext
  ): IActionResult[] {
    const results: IActionResult[] = [];

    for (const action of actions) {
      const result = this.executeAction(action, context);
      results.push(result);
    }

    return results;
  }

  /**
   * تنفيذ إجراء واحد
   */
  private executeAction(
    action: IConditionalAction,
    context: IExecutionContext
  ): IActionResult {
    const locale = context.locale || 'en';

    switch (action.action_type) {
      // Visibility Actions
      case ConditionalActionType.SHOW_FIELD:
        return {
          type: 'field_update',
          fieldId: action.target_field_id,
          property: 'visible',
          value: true,
        };

      case ConditionalActionType.HIDE_FIELD:
        return {
          type: 'field_update',
          fieldId: action.target_field_id,
          property: 'visible',
          value: false,
        };

      case ConditionalActionType.SHOW_SECTION:
        return {
          type: 'section_update',
          fieldId: action.target_section_id,
          property: 'visible',
          value: true,
        };

      case ConditionalActionType.HIDE_SECTION:
        return {
          type: 'section_update',
          fieldId: action.target_section_id,
          property: 'visible',
          value: false,
        };

      // State Actions
      case ConditionalActionType.ENABLE_FIELD:
        return {
          type: 'field_update',
          fieldId: action.target_field_id,
          property: 'disabled',
          value: false,
        };

      case ConditionalActionType.DISABLE_FIELD:
        return {
          type: 'field_update',
          fieldId: action.target_field_id,
          property: 'disabled',
          value: true,
        };

      case ConditionalActionType.SET_REQUIRED:
        return {
          type: 'field_update',
          fieldId: action.target_field_id,
          property: 'required',
          value: true,
        };

      case ConditionalActionType.SET_OPTIONAL:
        return {
          type: 'field_update',
          fieldId: action.target_field_id,
          property: 'required',
          value: false,
        };

      case ConditionalActionType.SET_READONLY:
        return {
          type: 'field_update',
          fieldId: action.target_field_id,
          property: 'readonly',
          value: true,
        };

      // Value Actions
      case ConditionalActionType.SET_VALUE:
        return {
          type: 'field_update',
          fieldId: action.target_field_id,
          property: 'value',
          value: this.resolveValue(action.value, context),
        };

      case ConditionalActionType.CLEAR_VALUE:
        return {
          type: 'field_update',
          fieldId: action.target_field_id,
          property: 'value',
          value: null,
        };

      case ConditionalActionType.CALCULATE_VALUE:
        return {
          type: 'field_update',
          fieldId: action.target_field_id,
          property: 'value',
          value: this.calculateValue(action.value, context),
        };

      // Options Actions
      case ConditionalActionType.FILTER_OPTIONS:
        return {
          type: 'field_update',
          fieldId: action.target_field_id,
          property: 'options_filter',
          value: action.value,
        };

      case ConditionalActionType.SET_OPTIONS:
        return {
          type: 'field_update',
          fieldId: action.target_field_id,
          property: 'options',
          value: action.value,
        };

      // Validation Actions
      case ConditionalActionType.ADD_VALIDATION:
        return {
          type: 'field_update',
          fieldId: action.target_field_id,
          property: 'add_validation',
          value: action.value,
        };

      case ConditionalActionType.REMOVE_VALIDATION:
        return {
          type: 'field_update',
          fieldId: action.target_field_id,
          property: 'remove_validation',
          value: action.value,
        };

      // Display Actions
      case ConditionalActionType.SHOW_MESSAGE:
        return {
          type: 'message',
          level: 'info',
          message: locale === 'ar' ? action.message_ar : action.message,
        };

      case ConditionalActionType.SHOW_WARNING:
        return {
          type: 'message',
          level: 'warning',
          message: locale === 'ar' ? action.message_ar : action.message,
        };

      case ConditionalActionType.SHOW_ERROR:
        return {
          type: 'message',
          level: 'error',
          message: locale === 'ar' ? action.message_ar : action.message,
        };

      default:
        return { type: 'noop' };
    }
  }

  /**
   * الحصول على القواعد المطبقة
   */
  getApplicableRules(
    rules: IConditionalRule[],
    context: IEvaluationContext
  ): IConditionalRule[] {
    return rules
      .filter(rule => rule.is_active)
      .filter(rule => this.evaluateConditionGroup(rule.conditions, context))
      .sort((a, b) => a.priority - b.priority);
  }

  /**
   * معالجة تغيير حقل
   */
  processFieldChange(
    fieldId: string,
    rules: IConditionalRule[],
    context: IEvaluationContext
  ): IConditionalResult {
    // البحث عن القواعد المرتبطة بهذا الحقل
    const relatedRules = rules.filter(rule =>
      this.ruleReferencesField(rule, fieldId)
    );

    // تقييم وتنفيذ القواعد
    const applicableRules = this.getApplicableRules(relatedRules, context);

    const allActions: IActionResult[] = [];
    for (const rule of applicableRules) {
      const actions = this.executeActions(rule.actions, context as IExecutionContext);
      allActions.push(...actions);
    }

    return {
      appliedRules: applicableRules.map(r => r.rule_id),
      actions: allActions,
    };
  }

  /**
   * معالجة جميع القواعد
   */
  processAllRules(
    rules: IConditionalRule[],
    context: IEvaluationContext
  ): IConditionalResult {
    const applicableRules = this.getApplicableRules(rules, context);

    const allActions: IActionResult[] = [];
    for (const rule of applicableRules) {
      const actions = this.executeActions(rule.actions, context as IExecutionContext);
      allActions.push(...actions);
    }

    return {
      appliedRules: applicableRules.map(r => r.rule_id),
      actions: allActions,
    };
  }

  /**
   * التحقق مما إذا كانت القاعدة تشير إلى حقل معين
   */
  private ruleReferencesField(rule: IConditionalRule, fieldId: string): boolean {
    return this.conditionGroupReferencesField(rule.conditions, fieldId);
  }

  /**
   * التحقق مما إذا كانت مجموعة الشروط تشير إلى حقل معين
   */
  private conditionGroupReferencesField(
    group: IConditionGroup,
    fieldId: string
  ): boolean {
    for (const condition of group.conditions) {
      if (this.isConditionGroup(condition)) {
        if (this.conditionGroupReferencesField(condition as IConditionGroup, fieldId)) {
          return true;
        }
      } else {
        const cond = condition as ICondition;
        if (cond.field_id === fieldId) {
          return true;
        }
      }
    }
    return false;
  }

  /**
   * التحقق مما إذا كان الكائن مجموعة شروط
   */
  private isConditionGroup(obj: any): obj is IConditionGroup {
    return obj && 'operator' in obj && 'conditions' in obj;
  }

  /**
   * الحصول على قيمة حقل
   */
  private getFieldValue(fieldId: string | undefined, formData: Record<string, any>): any {
    if (!fieldId) return undefined;
    return formData[fieldId];
  }

  /**
   * الحصول على خاصية من المستخدم
   */
  private getUserAttribute(
    attribute: string | undefined,
    user: Record<string, any> | undefined
  ): any {
    if (!attribute || !user) return undefined;

    const parts = attribute.split('.');
    let value: any = user;

    for (const part of parts) {
      if (value === null || value === undefined) return undefined;
      value = value[part];
    }

    return value;
  }

  /**
   * تقييم شرط زمني
   */
  private evaluateTimeCondition(
    condition: ICondition,
    _context: IEvaluationContext
  ): boolean {
    if (!condition.time_condition) return false;

    const now = new Date();
    const { type, value } = condition.time_condition;

    switch (type) {
      case 'before':
        return now < new Date(value as string);

      case 'after':
        return now > new Date(value as string);

      case 'between':
        if (!Array.isArray(value) || value.length !== 2) return false;
        return now >= new Date(value[0]) && now <= new Date(value[1]);

      default:
        return false;
    }
  }

  /**
   * تقييم دالة مخصصة
   */
  private evaluateCustomFunction(
    _condition: ICondition,
    _context: IEvaluationContext
  ): boolean {
    // يمكن توسيع هذه الدالة لدعم دوال مخصصة
    return false;
  }

  /**
   * حل قيمة ديناميكية
   */
  private resolveValue(value: any, context: IExecutionContext): any {
    if (typeof value !== 'string') return value;

    // استبدال المتغيرات
    if (value.startsWith('{') && value.endsWith('}')) {
      const fieldId = value.slice(1, -1);
      return context.formData[fieldId];
    }

    // استبدال متغيرات المستخدم
    if (value.startsWith('$user.')) {
      const attr = value.slice(6);
      return this.getUserAttribute(attr, context.user);
    }

    // قيم خاصة
    if (value === '$now') return new Date();
    if (value === '$today') {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      return today;
    }

    return value;
  }

  /**
   * حساب قيمة
   */
  private calculateValue(formula: any, context: IExecutionContext): any {
    if (typeof formula !== 'string') return formula;

    // استبدال المتغيرات
    let expression = formula;
    const variablePattern = /\{([^}]+)\}/g;
    let match;

    while ((match = variablePattern.exec(formula)) !== null) {
      const fieldId = match[1];
      const value = context.formData[fieldId];
      const replacement = value !== null && value !== undefined ? String(value) : '0';
      expression = expression.replace(match[0], replacement);
    }

    // تقييم التعبير
    try {
      const sanitized = expression.replace(/[^0-9+\-*/().%]/g, '');
      const fn = new Function(`return (${sanitized})`);
      return fn();
    } catch {
      return null;
    }
  }

  /**
   * التحقق من التساوي
   */
  private isEqual(a: any, b: any): boolean {
    if (a === b) return true;
    if (a === null || a === undefined) return b === null || b === undefined;
    if (typeof a !== typeof b) {
      // محاولة المقارنة كنصوص
      return String(a) === String(b);
    }
    if (Array.isArray(a) && Array.isArray(b)) {
      if (a.length !== b.length) return false;
      return a.every((val, idx) => this.isEqual(val, b[idx]));
    }
    return false;
  }

  /**
   * التحقق من أن القيمة فارغة
   */
  private isEmpty(value: any): boolean {
    if (value === null || value === undefined) return true;
    if (typeof value === 'string') return value.trim() === '';
    if (Array.isArray(value)) return value.length === 0;
    if (typeof value === 'object') return Object.keys(value).length === 0;
    return false;
  }

  /**
   * تحويل إلى رقم
   */
  private toNumber(value: any): number {
    if (typeof value === 'number') return value;
    if (typeof value === 'string') {
      const num = parseFloat(value);
      return isNaN(num) ? 0 : num;
    }
    if (value instanceof Date) return value.getTime();
    return 0;
  }
}

// ============================================
// SINGLETON INSTANCE
// ============================================

export const conditionalLogicEngine = new ConditionalLogicEngine();

export default ConditionalLogicEngine;
