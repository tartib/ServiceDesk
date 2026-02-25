/**
 * Guard Evaluator - مقيّم الحراس
 * Workflow Engine
 *
 * مسؤول عن تقييم شروط الانتقال (Guards) بناءً على السياق
 */

import {
  WFGuardType,
  WFGuardOperator,
  type IWFGuard,
  type IWFGuardResult,
  type IWFExecutionContext,
} from '../../types/workflow-engine.types';

export class GuardEvaluator {
  /**
   * تقييم مجموعة من الحراس — يجب أن تنجح جميعها (AND logic)
   */
  evaluateGuards(guards: IWFGuard[], context: IWFExecutionContext): IWFGuardResult {
    for (const guard of guards) {
      const result = this.evaluateGuard(guard, context);
      if (!result.passed) {
        return result;
      }
    }
    return { passed: true };
  }

  /**
   * تقييم حارس واحد
   */
  evaluateGuard(guard: IWFGuard, context: IWFExecutionContext): IWFGuardResult {
    try {
      switch (guard.type) {
        case WFGuardType.ROLE:
          return this.evaluateRoleGuard(guard, context);

        case WFGuardType.FIELD_VALUE:
          return this.evaluateFieldValueGuard(guard, context);

        case WFGuardType.APPROVAL_STATUS:
          return this.evaluateApprovalGuard(guard, context);

        case WFGuardType.EXPRESSION:
          return this.evaluateExpressionGuard(guard, context);

        case WFGuardType.TIME_WINDOW:
          return this.evaluateTimeWindowGuard(guard, context);

        case WFGuardType.CUSTOM_FUNCTION:
          return this.evaluateCustomGuard(guard, context);

        default:
          return {
            passed: false,
            failedGuard: guard,
            reason: `Unknown guard type: ${guard.type}`,
          };
      }
    } catch (error: any) {
      return {
        passed: false,
        failedGuard: guard,
        reason: `Guard evaluation error: ${error.message}`,
      };
    }
  }

  /**
   * حارس الدور — يتحقق أن المستخدم لديه أحد الأدوار المطلوبة
   */
  private evaluateRoleGuard(guard: IWFGuard, context: IWFExecutionContext): IWFGuardResult {
    const requiredRoles = guard.config.roles || [];
    if (requiredRoles.length === 0) {
      return { passed: true };
    }

    const userRoles = context.actor.roles || [];
    const hasRole = requiredRoles.some(role => userRoles.includes(role));

    if (!hasRole) {
      return {
        passed: false,
        failedGuard: guard,
        reason: guard.errorMessage || `User does not have required role. Required: ${requiredRoles.join(', ')}`,
      };
    }

    return { passed: true };
  }

  /**
   * حارس قيمة الحقل — يتحقق من قيمة حقل في الكيان أو المتغيرات
   */
  private evaluateFieldValueGuard(guard: IWFGuard, context: IWFExecutionContext): IWFGuardResult {
    const { fieldPath, operator, value } = guard.config;
    if (!fieldPath || !operator) {
      return { passed: true };
    }

    const actualValue = this.getValueByPath(context, fieldPath);
    const passed = this.compareValues(actualValue, operator, value);

    if (!passed) {
      return {
        passed: false,
        failedGuard: guard,
        reason: guard.errorMessage || `Field "${fieldPath}" condition not met (${operator})`,
      };
    }

    return { passed: true };
  }

  /**
   * حارس حالة الموافقة
   */
  private evaluateApprovalGuard(guard: IWFGuard, context: IWFExecutionContext): IWFGuardResult {
    const { fieldPath, value } = guard.config;
    const approvalStatus = fieldPath
      ? this.getValueByPath(context, fieldPath)
      : context.instance.variables?.approvalStatus;

    const requiredStatus = value || 'approved';

    if (approvalStatus !== requiredStatus) {
      return {
        passed: false,
        failedGuard: guard,
        reason: guard.errorMessage || `Approval status is "${approvalStatus}", required "${requiredStatus}"`,
      };
    }

    return { passed: true };
  }

  /**
   * حارس التعبير — يقيّم تعبير JavaScript بسيط
   */
  private evaluateExpressionGuard(guard: IWFGuard, context: IWFExecutionContext): IWFGuardResult {
    const { expression } = guard.config;
    if (!expression) {
      return { passed: true };
    }

    try {
      const safeContext = {
        entity: context.entity || {},
        variables: context.instance.variables || {},
        actor: {
          id: context.actor.id,
          roles: context.actor.roles || [],
          department: context.actor.department,
        },
        currentState: context.instance.currentState,
        transitionData: context.transitionData || {},
      };

      const fn = new Function(
        'ctx',
        `"use strict"; const { entity, variables, actor, currentState, transitionData } = ctx; return (${expression});`
      );
      const result = fn(safeContext);

      if (!result) {
        return {
          passed: false,
          failedGuard: guard,
          reason: guard.errorMessage || `Expression evaluated to false: ${expression}`,
        };
      }

      return { passed: true };
    } catch (error: any) {
      return {
        passed: false,
        failedGuard: guard,
        reason: `Expression evaluation error: ${error.message}`,
      };
    }
  }

  /**
   * حارس النافذة الزمنية
   */
  private evaluateTimeWindowGuard(guard: IWFGuard, context: IWFExecutionContext): IWFGuardResult {
    const { afterHours, beforeHours } = guard.config;
    const now = new Date();
    const instanceStarted = new Date(context.instance.startedAt);
    const hoursElapsed = (now.getTime() - instanceStarted.getTime()) / (1000 * 60 * 60);

    if (afterHours !== undefined && hoursElapsed < afterHours) {
      return {
        passed: false,
        failedGuard: guard,
        reason: guard.errorMessage || `Time window not reached. Must wait ${afterHours} hours (${hoursElapsed.toFixed(1)}h elapsed)`,
      };
    }

    if (beforeHours !== undefined && hoursElapsed > beforeHours) {
      return {
        passed: false,
        failedGuard: guard,
        reason: guard.errorMessage || `Time window expired. Must act within ${beforeHours} hours (${hoursElapsed.toFixed(1)}h elapsed)`,
      };
    }

    return { passed: true };
  }

  /**
   * حارس الدالة المخصصة — placeholder للتوسع
   */
  private evaluateCustomGuard(guard: IWFGuard, _context: IWFExecutionContext): IWFGuardResult {
    const { functionName } = guard.config;
    console.warn(`Custom guard function "${functionName}" not implemented. Passing by default.`);
    return { passed: true };
  }

  // ============================================
  // UTILITY METHODS
  // ============================================

  /**
   * الحصول على قيمة من مسار متداخل
   */
  private getValueByPath(context: IWFExecutionContext, path: string): any {
    const parts = path.split('.');
    let current: any;

    // تحديد المصدر بناءً على أول جزء
    const root = parts[0];
    const restPath = parts.slice(1);

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
      case 'transitionData':
        current = context.transitionData;
        break;
      default:
        // Try entity first, then variables
        current = context.entity?.[root] ?? context.instance.variables?.[root];
        return current;
    }

    for (const part of restPath) {
      if (current === null || current === undefined) return undefined;
      current = current[part];
    }

    return current;
  }

  /**
   * مقارنة القيم حسب العامل
   */
  private compareValues(actual: any, operator: WFGuardOperator, expected: any): boolean {
    switch (operator) {
      case WFGuardOperator.EQUALS:
        return actual == expected; // eslint-disable-line eqeqeq

      case WFGuardOperator.NOT_EQUALS:
        return actual != expected; // eslint-disable-line eqeqeq

      case WFGuardOperator.CONTAINS:
        if (typeof actual === 'string') return actual.includes(String(expected));
        if (Array.isArray(actual)) return actual.includes(expected);
        return false;

      case WFGuardOperator.NOT_CONTAINS:
        if (typeof actual === 'string') return !actual.includes(String(expected));
        if (Array.isArray(actual)) return !actual.includes(expected);
        return true;

      case WFGuardOperator.GREATER_THAN:
        return Number(actual) > Number(expected);

      case WFGuardOperator.LESS_THAN:
        return Number(actual) < Number(expected);

      case WFGuardOperator.GREATER_OR_EQUAL:
        return Number(actual) >= Number(expected);

      case WFGuardOperator.LESS_OR_EQUAL:
        return Number(actual) <= Number(expected);

      case WFGuardOperator.IN:
        if (Array.isArray(expected)) return expected.includes(actual);
        return false;

      case WFGuardOperator.NOT_IN:
        if (Array.isArray(expected)) return !expected.includes(actual);
        return true;

      case WFGuardOperator.IS_EMPTY:
        return actual === null || actual === undefined || actual === '' || (Array.isArray(actual) && actual.length === 0);

      case WFGuardOperator.IS_NOT_EMPTY:
        return actual !== null && actual !== undefined && actual !== '' && !(Array.isArray(actual) && actual.length === 0);

      case WFGuardOperator.BETWEEN:
        if (Array.isArray(expected) && expected.length === 2) {
          const num = Number(actual);
          return num >= Number(expected[0]) && num <= Number(expected[1]);
        }
        return false;

      case WFGuardOperator.MATCHES_REGEX:
        try {
          return new RegExp(String(expected)).test(String(actual));
        } catch {
          return false;
        }

      default:
        return false;
    }
  }
}

export const guardEvaluator = new GuardEvaluator();
export default GuardEvaluator;
