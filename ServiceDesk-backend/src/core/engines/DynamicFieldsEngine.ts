/**
 * Dynamic Fields Engine - محرك الحقول الديناميكية
 * Smart Forms System
 * 
 * مسؤول عن:
 * - توليد الحقول من القالب
 * - معالجة تغيير القيم
 * - تطبيق القيم الافتراضية
 * - تحميل الخيارات الديناميكية
 * - حساب الحقول المحسوبة
 */

import {
  ISmartField,
  IFormTemplate,
  IRenderedField,
  IFieldUpdateResult,
  IFieldUpdate,
  IFormContext,
  IFieldOption,
  SmartFieldType,
} from '../types/smart-forms.types';

// ============================================
// INTERFACES
// ============================================

export interface IFieldDependency {
  fieldId: string;
  dependsOn: string[];
  affectedBy: string[];
}

export interface IFormulaContext {
  data: Record<string, any>;
  user: Record<string, any>;
  now: Date;
}

// ============================================
// DYNAMIC FIELDS ENGINE
// ============================================

export class DynamicFieldsEngine {
  private conditionalLogicEngine: any; // Will be injected
  private lookupService: any; // Will be injected

  constructor(options?: {
    conditionalLogicEngine?: any;
    lookupService?: any;
  }) {
    this.conditionalLogicEngine = options?.conditionalLogicEngine;
    this.lookupService = options?.lookupService;
  }

  /**
   * توليد الحقول من القالب
   */
  generateFields(
    template: IFormTemplate,
    context: IFormContext
  ): IRenderedField[] {
    const renderedFields: IRenderedField[] = [];

    for (const field of template.fields) {
      // 1. تحديد الرؤية
      const visible = this.evaluateVisibility(field, context);

      // 2. تحديد القيمة الافتراضية
      const defaultValue = this.resolveDefaultValue(field, context);

      // 3. تحديد حالة الحقل
      const state = this.determineFieldState(field, context);

      // 4. إنشاء الحقل المُعرض
      const renderedField: IRenderedField = {
        ...field,
        visible,
        value: context.data[field.field_id] ?? defaultValue,
        errors: [],
        state: {
          disabled: state.disabled,
          readonly: state.readonly || field.display.readonly,
          required: this.isFieldRequired(field, context),
        },
      };

      renderedFields.push(renderedField);
    }

    // ترتيب الحقول حسب order
    return this.sortByOrder(renderedFields);
  }

  /**
   * معالجة تغيير قيمة حقل
   */
  onFieldChange(
    fieldId: string,
    newValue: any,
    fields: IRenderedField[],
    formData: Record<string, any>,
    context: IFormContext
  ): IFieldUpdateResult {
    const updates: IFieldUpdate[] = [];

    // 1. تحديث قيمة الحقل
    updates.push({
      fieldId,
      property: 'value',
      value: newValue,
    });

    // تحديث formData
    const updatedData = { ...formData, [fieldId]: newValue };

    // 2. البحث عن الحقول المعتمدة على هذا الحقل
    const dependentFields = this.getDependentFields(fieldId, fields);

    // 3. إعادة تقييم الحقول المعتمدة
    for (const depField of dependentFields) {
      const updatedContext = { ...context, data: updatedData };

      // تحديث الرؤية
      const visible = this.evaluateVisibility(depField, updatedContext);
      if (visible !== depField.visible) {
        updates.push({
          fieldId: depField.field_id,
          property: 'visible',
          value: visible,
        });

        // إذا أصبح الحقل مخفياً، امسح قيمته
        if (!visible && depField.value !== null && depField.value !== undefined) {
          updates.push({
            fieldId: depField.field_id,
            property: 'value',
            value: null,
          });
          updatedData[depField.field_id] = null;
        }
      }

      // تحديث حالة required
      const required = this.isFieldRequired(depField, updatedContext);
      if (required !== depField.state.required) {
        updates.push({
          fieldId: depField.field_id,
          property: 'state.required',
          value: required,
        });
      }

      // تحديث الخيارات (للحقول المتسلسلة)
      if (this.isCascadingField(depField) && depField.depends_on?.includes(fieldId)) {
        const filteredOptions = this.filterCascadingOptions(depField, updatedData);
        updates.push({
          fieldId: depField.field_id,
          property: 'options',
          value: filteredOptions,
        });

        // إذا القيمة الحالية ليست ضمن الخيارات الجديدة، امسحها
        if (depField.value && !filteredOptions.some(o => o.value === depField.value)) {
          updates.push({
            fieldId: depField.field_id,
            property: 'value',
            value: null,
          });
          updatedData[depField.field_id] = null;
        }
      }
    }

    // 4. إعادة حساب الحقول المحسوبة
    const formulaFields = fields.filter(f => f.type === SmartFieldType.FORMULA);
    for (const formulaField of formulaFields) {
      const calculatedValue = this.evaluateFormula(
        formulaField.settings.formula as string,
        updatedData
      );
      if (calculatedValue !== formulaField.value) {
        updates.push({
          fieldId: formulaField.field_id,
          property: 'value',
          value: calculatedValue,
        });
      }
    }

    return {
      updates,
      shouldValidate: true,
    };
  }

  /**
   * تطبيق القيم الافتراضية
   */
  applyDefaultValues(
    fields: ISmartField[],
    context: IFormContext
  ): Record<string, any> {
    const defaults: Record<string, any> = {};

    for (const field of fields) {
      const defaultValue = this.resolveDefaultValue(field, context);
      if (defaultValue !== undefined && defaultValue !== null) {
        defaults[field.field_id] = defaultValue;
      }
    }

    return defaults;
  }

  /**
   * تحديد القيمة الافتراضية للحقل
   */
  private resolveDefaultValue(
    field: ISmartField,
    context: IFormContext
  ): any {
    // إذا لم يكن هناك مصدر للقيمة الافتراضية
    if (!field.default_value_source) {
      return field.default_value;
    }

    const source = field.default_value_source;

    switch (source.type) {
      case 'static':
        return source.value;

      case 'user_attribute':
        return this.getUserAttribute(source.value, context.user);

      case 'formula':
        return this.evaluateFormula(source.value, context.data);

      case 'api':
        // سيتم تحميلها بشكل غير متزامن
        return field.default_value;

      default:
        return field.default_value;
    }
  }

  /**
   * الحصول على خاصية من المستخدم
   */
  private getUserAttribute(attribute: string, user: Record<string, any>): any {
    const parts = attribute.split('.');
    let value: any = user;

    for (const part of parts) {
      if (value === null || value === undefined) return undefined;
      value = value[part];
    }

    return value;
  }

  /**
   * تقييم رؤية الحقل
   */
  private evaluateVisibility(
    field: ISmartField,
    context: IFormContext
  ): boolean {
    // إذا كان الحقل مخفياً بشكل افتراضي
    if (field.display.hidden) {
      return false;
    }

    // إذا لم يكن هناك شروط رؤية
    if (!field.visibility_conditions || field.visibility_conditions.length === 0) {
      return true;
    }

    // تقييم الشروط باستخدام محرك المنطق الشرطي
    if (this.conditionalLogicEngine) {
      const conditionGroup = {
        operator: 'AND' as const,
        conditions: field.visibility_conditions,
      };
      return this.conditionalLogicEngine.evaluateConditionGroup(conditionGroup, {
        formData: context.data,
        user: context.user,
      });
    }

    // تقييم بسيط إذا لم يكن المحرك متاحاً
    return this.evaluateSimpleConditions(field.visibility_conditions, context);
  }

  /**
   * تقييم شروط بسيطة
   */
  private evaluateSimpleConditions(
    conditions: any[],
    context: IFormContext
  ): boolean {
    for (const condition of conditions) {
      const fieldValue = context.data[condition.field_id];
      
      switch (condition.operator) {
        case 'equals':
          if (fieldValue !== condition.value) return false;
          break;
        case 'not_equals':
          if (fieldValue === condition.value) return false;
          break;
        case 'is_empty':
          if (fieldValue !== null && fieldValue !== undefined && fieldValue !== '') return false;
          break;
        case 'is_not_empty':
          if (fieldValue === null || fieldValue === undefined || fieldValue === '') return false;
          break;
        case 'contains':
          if (!String(fieldValue).includes(String(condition.value))) return false;
          break;
        case 'in':
          if (!Array.isArray(condition.value) || !condition.value.includes(fieldValue)) return false;
          break;
      }
    }
    return true;
  }

  /**
   * تحديد حالة الحقل
   */
  private determineFieldState(
    field: ISmartField,
    _context: IFormContext
  ): { disabled: boolean; readonly: boolean } {
    // يمكن توسيع هذه الدالة لدعم قواعد أكثر تعقيداً
    return {
      disabled: false,
      readonly: field.display.readonly,
    };
  }

  /**
   * التحقق مما إذا كان الحقل مطلوباً
   */
  private isFieldRequired(
    field: ISmartField,
    context: IFormContext
  ): boolean {
    // إذا لم يكن الحقل مطلوباً أساساً
    if (!field.validation.required) {
      return false;
    }

    // إذا كان هناك شرط للمطلوبية
    if (field.validation.required_condition) {
      if (this.conditionalLogicEngine) {
        return this.conditionalLogicEngine.evaluateCondition(
          field.validation.required_condition,
          { formData: context.data, user: context.user }
        );
      }
      // تقييم بسيط
      return this.evaluateSimpleConditions(
        [field.validation.required_condition],
        context
      );
    }

    return true;
  }

  /**
   * الحصول على الحقول المعتمدة على حقل معين
   */
  private getDependentFields(
    fieldId: string,
    fields: IRenderedField[]
  ): IRenderedField[] {
    return fields.filter(field => {
      // الحقول التي تعتمد على هذا الحقل
      if (field.depends_on?.includes(fieldId)) {
        return true;
      }

      // الحقول التي لها شروط رؤية تعتمد على هذا الحقل
      if (field.visibility_conditions?.some(c => c.field_id === fieldId)) {
        return true;
      }

      // الحقول المحسوبة التي تستخدم هذا الحقل
      if (field.type === SmartFieldType.FORMULA) {
        const formula = field.settings.formula as string;
        if (formula && formula.includes(`{${fieldId}}`)) {
          return true;
        }
      }

      return false;
    });
  }

  /**
   * التحقق مما إذا كان الحقل متسلسلاً
   */
  private isCascadingField(field: IRenderedField): boolean {
    return (
      field.type === SmartFieldType.CASCADING_SELECT ||
      (field.options_source?.type === 'lookup' && !!field.depends_on && field.depends_on.length > 0)
    );
  }

  /**
   * تصفية خيارات الحقل المتسلسل
   */
  private filterCascadingOptions(
    field: IRenderedField,
    formData: Record<string, any>
  ): IFieldOption[] {
    if (!field.options) return [];

    const parentFieldId = field.depends_on?.[0];
    if (!parentFieldId) return field.options;

    const parentValue = formData[parentFieldId];
    if (!parentValue) return [];

    // تصفية الخيارات بناءً على قيمة الحقل الأب
    return field.options.filter(option => {
      if (option.metadata?.parent_value) {
        return option.metadata.parent_value === parentValue;
      }
      return true;
    });
  }

  /**
   * تحميل الخيارات الديناميكية
   */
  async loadDynamicOptions(
    field: ISmartField,
    context: IFormContext
  ): Promise<IFieldOption[]> {
    const source = field.options_source;
    if (!source) return field.options || [];

    switch (source.type) {
      case 'static':
        return field.options || [];

      case 'api':
        if (!source.endpoint) return [];
        try {
          const response = await fetch(source.endpoint, {
            headers: {
              'Content-Type': 'application/json',
              ...(context.token ? { Authorization: `Bearer ${context.token}` } : {}),
            },
          });
          if (!response.ok) return [];
          const data = await response.json();
          return this.mapApiResponseToOptions(data, source);
        } catch {
          return [];
        }

      case 'lookup':
        if (!this.lookupService || !source.lookup_entity) return [];
        try {
          const filters = this.resolveFilters(source.filters, context.data);
          return await this.lookupService.query(
            source.lookup_entity,
            filters,
            source.value_field || 'id',
            source.label_field || 'name'
          );
        } catch {
          return [];
        }

      default:
        return field.options || [];
    }
  }

  /**
   * تحويل استجابة API إلى خيارات
   */
  private mapApiResponseToOptions(
    data: any,
    source: NonNullable<ISmartField['options_source']>
  ): IFieldOption[] {
    const items = Array.isArray(data) ? data : data.data || data.items || [];
    const valueField = source.value_field || 'id';
    const labelField = source.label_field || 'name';

    return items.map((item: any) => ({
      value: String(item[valueField]),
      label: item[labelField],
      label_ar: item[`${labelField}_ar`] || item[labelField],
      metadata: item,
    }));
  }

  /**
   * حل الفلاتر مع البيانات
   */
  private resolveFilters(
    filters: Record<string, any> | undefined,
    formData: Record<string, any>
  ): Record<string, any> {
    if (!filters) return {};

    const resolved: Record<string, any> = {};
    for (const [key, value] of Object.entries(filters)) {
      if (typeof value === 'string' && value.startsWith('{') && value.endsWith('}')) {
        const fieldId = value.slice(1, -1);
        resolved[key] = formData[fieldId];
      } else {
        resolved[key] = value;
      }
    }
    return resolved;
  }

  /**
   * حساب جميع الحقول المحسوبة
   */
  evaluateFormulas(
    fields: ISmartField[],
    formData: Record<string, any>
  ): Record<string, any> {
    const results: Record<string, any> = {};

    const formulaFields = fields.filter(f => f.type === SmartFieldType.FORMULA);

    for (const field of formulaFields) {
      const formula = field.settings.formula as string;
      if (formula) {
        results[field.field_id] = this.evaluateFormula(formula, formData);
      }
    }

    return results;
  }

  /**
   * تقييم صيغة حسابية
   */
  evaluateFormula(formula: string, data: Record<string, any>): any {
    if (!formula) return null;

    // استبدال المتغيرات
    let expression = formula;
    const variablePattern = /\{([^}]+)\}/g;
    let match;

    while ((match = variablePattern.exec(formula)) !== null) {
      const fieldId = match[1];
      const value = data[fieldId];
      const replacement = value !== null && value !== undefined ? String(value) : '0';
      expression = expression.replace(match[0], replacement);
    }

    // دعم الدوال الشائعة
    expression = this.replaceFunctions(expression);

    // تقييم التعبير بأمان
    try {
      return this.safeEval(expression);
    } catch {
      return null;
    }
  }

  /**
   * استبدال الدوال الشائعة
   */
  private replaceFunctions(expression: string): string {
    // SUM
    expression = expression.replace(/SUM\(([^)]+)\)/gi, (_, args) => {
      const values = args.split(',').map((v: string) => parseFloat(v.trim()) || 0);
      return String(values.reduce((a: number, b: number) => a + b, 0));
    });

    // AVG
    expression = expression.replace(/AVG\(([^)]+)\)/gi, (_, args) => {
      const values = args.split(',').map((v: string) => parseFloat(v.trim()) || 0);
      return String(values.reduce((a: number, b: number) => a + b, 0) / values.length);
    });

    // MIN
    expression = expression.replace(/MIN\(([^)]+)\)/gi, (_, args) => {
      const values = args.split(',').map((v: string) => parseFloat(v.trim()) || 0);
      return String(Math.min(...values));
    });

    // MAX
    expression = expression.replace(/MAX\(([^)]+)\)/gi, (_, args) => {
      const values = args.split(',').map((v: string) => parseFloat(v.trim()) || 0);
      return String(Math.max(...values));
    });

    // ROUND
    expression = expression.replace(/ROUND\(([^,]+),?\s*(\d*)\)/gi, (_, value, decimals) => {
      const num = parseFloat(value) || 0;
      const dec = parseInt(decimals) || 0;
      return String(Math.round(num * Math.pow(10, dec)) / Math.pow(10, dec));
    });

    // IF
    expression = expression.replace(/IF\(([^,]+),([^,]+),([^)]+)\)/gi, (_, condition, trueVal, falseVal) => {
      try {
        const result = this.safeEval(condition);
        return result ? trueVal.trim() : falseVal.trim();
      } catch {
        return falseVal.trim();
      }
    });

    return expression;
  }

  /**
   * تقييم آمن للتعبيرات الحسابية
   */
  private safeEval(expression: string): any {
    // السماح فقط بالعمليات الحسابية الأساسية
    const sanitized = expression.replace(/[^0-9+\-*/().%<>=!&|?\s:]/g, '');
    
    // التحقق من أن التعبير آمن
    if (sanitized !== expression.replace(/\s/g, '')) {
      throw new Error('Invalid expression');
    }

    // استخدام Function بدلاً من eval للأمان
    try {
      const fn = new Function(`return (${sanitized})`);
      return fn();
    } catch {
      return null;
    }
  }

  /**
   * ترتيب الحقول حسب order
   */
  private sortByOrder(fields: IRenderedField[]): IRenderedField[] {
    return [...fields].sort((a, b) => a.display.order - b.display.order);
  }

  /**
   * الحصول على خريطة الاعتماديات
   */
  getFieldDependencies(fields: ISmartField[]): Map<string, IFieldDependency> {
    const dependencies = new Map<string, IFieldDependency>();

    for (const field of fields) {
      const dependsOn: string[] = [];
      const affectedBy: string[] = [];

      // الاعتماديات المباشرة
      if (field.depends_on) {
        dependsOn.push(...field.depends_on);
      }

      // الاعتماديات من شروط الرؤية
      if (field.visibility_conditions) {
        for (const condition of field.visibility_conditions) {
          if (condition.field_id && !dependsOn.includes(condition.field_id)) {
            dependsOn.push(condition.field_id);
          }
        }
      }

      // الاعتماديات من الصيغ
      if (field.type === SmartFieldType.FORMULA && field.settings.formula) {
        const formula = field.settings.formula as string;
        const variablePattern = /\{([^}]+)\}/g;
        let match;
        while ((match = variablePattern.exec(formula)) !== null) {
          if (!dependsOn.includes(match[1])) {
            dependsOn.push(match[1]);
          }
        }
      }

      dependencies.set(field.field_id, {
        fieldId: field.field_id,
        dependsOn,
        affectedBy,
      });
    }

    // حساب affectedBy
    for (const [fieldId, dep] of dependencies) {
      for (const depFieldId of dep.dependsOn) {
        const depDep = dependencies.get(depFieldId);
        if (depDep && !depDep.affectedBy.includes(fieldId)) {
          depDep.affectedBy.push(fieldId);
        }
      }
    }

    return dependencies;
  }
}

// ============================================
// SINGLETON INSTANCE
// ============================================

export const dynamicFieldsEngine = new DynamicFieldsEngine();

export default DynamicFieldsEngine;
