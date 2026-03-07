import mongoose, { Schema, Document } from 'mongoose';

/**
 * Automation Rules Engine Model
 * Based on the ITSM Platform PRD - Phase 2
 */

// Rule Status
export enum AutomationRuleStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  DRAFT = 'draft',
  DEPRECATED = 'deprecated',
}

// Trigger Types
export enum RuleTriggerType {
  TICKET_CREATED = 'ticket_created',
  TICKET_UPDATED = 'ticket_updated',
  STATUS_CHANGED = 'status_changed',
  PRIORITY_CHANGED = 'priority_changed',
  ASSIGNMENT_CHANGED = 'assignment_changed',
  SLA_BREACH_WARNING = 'sla_breach_warning',
  SLA_BREACHED = 'sla_breached',
  TIME_TRIGGER = 'time_trigger',
  SCHEDULED = 'scheduled',
  WEBHOOK_RECEIVED = 'webhook_received',
  EMAIL_RECEIVED = 'email_received',
  CUSTOM_EVENT = 'custom_event',
  USER_ACTION = 'user_action',
}

// Action Types
export enum RuleActionType {
  ASSIGN_TICKET = 'assign_ticket',
  SET_PRIORITY = 'set_priority',
  SET_STATUS = 'set_status',
  ADD_TAG = 'add_tag',
  REMOVE_TAG = 'remove_tag',
  ADD_COMMENT = 'add_comment',
  NOTIFY_USER = 'notify_user',
  NOTIFY_TEAM = 'notify_team',
  SEND_EMAIL = 'send_email',
  EXECUTE_WEBHOOK = 'execute_webhook',
  CREATE_TASK = 'create_task',
  CREATE_INCIDENT = 'create_incident',
  LINK_TICKETS = 'link_tickets',
  MERGE_TICKETS = 'merge_tickets',
  SET_FIELD = 'set_field',
  RUN_SCRIPT = 'run_script',
  EXECUTE_WORKFLOW = 'execute_workflow',
  ROUTE_TO_QUEUE = 'route_to_queue',
  REQUEST_APPROVAL = 'request_approval',
}

// Operator Types for Conditions
export enum RuleOperator {
  EQUALS = 'equals',
  NOT_EQUALS = 'not_equals',
  CONTAINS = 'contains',
  NOT_CONTAINS = 'not_contains',
  STARTS_WITH = 'starts_with',
  ENDS_WITH = 'ends_with',
  GREATER_THAN = 'greater_than',
  LESS_THAN = 'less_than',
  GREATER_OR_EQUAL = 'greater_or_equal',
  LESS_OR_EQUAL = 'less_or_equal',
  IN = 'in',
  NOT_IN = 'not_in',
  IS_EMPTY = 'is_empty',
  IS_NOT_EMPTY = 'is_not_empty',
  MATCHES_REGEX = 'matches_regex',
  IS_TRUE = 'is_true',
  IS_FALSE = 'is_false',
}

// Automation Rule Interface
export interface IAutomationRule extends Document {
  ruleId: string;
  name: string;
  nameAr?: string;
  description?: string;
  descriptionAr?: string;
  status: AutomationRuleStatus;
  
  // Organization
  organizationId?: mongoose.Types.ObjectId;
  department?: string;
  
  // Trigger Configuration
  trigger: {
    type: RuleTriggerType;
    config: Record<string, unknown>;
    filters?: Array<{
      field: string;
      operator: RuleOperator;
      value: unknown;
    }>;
  };
  
  // Conditions (AND/OR Logic)
  conditions: {
    operator: 'AND' | 'OR';
    groups: Array<{
      operator: 'AND' | 'OR';
      conditions: Array<{
        field: string;
        operator: RuleOperator;
        value: unknown;
        valueType: 'string' | 'number' | 'boolean' | 'date' | 'array';
      }>;
    }>;
  };
  
  // Actions to Execute
  actions: Array<{
    order: number;
    type: RuleActionType;
    config: Record<string, unknown>;
    delayMinutes?: number;
    stopOnFailure: boolean;
    condition?: {
      field: string;
      operator: RuleOperator;
      value: unknown;
    };
  }>;
  
  // Execution Settings
  execution: {
    maxExecutionsPerTicket: number;
    preventReTrigger: boolean;
    reTriggerDelayMinutes?: number;
    allowParallel: boolean;
    queueName?: string;
    priority: number;
  };
  
  // Schedule (for scheduled triggers)
  schedule?: {
    cron: string;
    timezone: string;
    enabled: boolean;
    lastRun?: Date;
    nextRun?: Date;
  };
  
  // Scope
  scope: {
    ticketTypes: string[];
    services: string[];
    categories: string[];
    priorities: string[];
    applyTo: 'all' | 'specific';
  };
  
  // Statistics
  stats: {
    executionCount: number;
    successCount: number;
    failureCount: number;
    lastExecutedAt?: Date;
    lastExecutionStatus?: 'success' | 'failed' | 'partial';
    averageExecutionTimeMs: number;
  };
  
  // Audit
  createdAt: Date;
  createdBy?: mongoose.Types.ObjectId;
  updatedAt: Date;
  updatedBy?: mongoose.Types.ObjectId;
  version: number;
  
  // Change History
  history: Array<{
    version: number;
    timestamp: Date;
    userId: mongoose.Types.ObjectId;
    changes: Record<string, { old: unknown; new: unknown }>;
  }>;
  
  // Validation
  isValid: boolean;
  validationErrors?: string[];
  
  // Methods
  evaluateConditions(context: Record<string, unknown>): boolean;
  executeActions(context: Record<string, unknown>): Promise<RuleExecutionResult>;
  incrementExecution(success: boolean, durationMs: number): void;
}

// Rule Execution Log Interface
export interface IRuleExecutionLog extends Document {
  ruleId: mongoose.Types.ObjectId;
  ruleName: string;
  triggerTicketId?: mongoose.Types.ObjectId;
  triggerType: RuleTriggerType;
  
  // Execution Details
  executionId: string;
  startedAt: Date;
  completedAt?: Date;
  durationMs: number;
  status: 'success' | 'failed' | 'partial' | 'timeout';
  
  // Context
  context: Record<string, unknown>;
  
  // Condition Results
  conditionsEvaluated: Array<{
    groupIndex: number;
    conditionIndex: number;
    field: string;
    operator: RuleOperator;
    expectedValue: unknown;
    actualValue: unknown;
    result: boolean;
  }>;
  conditionsResult: boolean;
  
  // Action Results
  actionsExecuted: Array<{
    order: number;
    type: RuleActionType;
    status: 'success' | 'failed' | 'skipped';
    error?: string;
    result?: unknown;
    durationMs: number;
    startedAt: Date;
    completedAt?: Date;
  }>;
  
  // Error Details
  error?: {
    message: string;
    stack?: string;
    code?: string;
  };
  
  // Retry Info
  retryCount: number;
  maxRetries: number;
  
  createdAt: Date;
}

// Rule Template Interface
export interface IRuleTemplate extends Document {
  templateId: string;
  name: string;
  nameAr?: string;
  description?: string;
  descriptionAr?: string;
  category: string;
  
  // Template Content
  trigger: {
    type: RuleTriggerType;
    config: Record<string, unknown>;
  };
  conditions: IAutomationRule['conditions'];
  actions: IAutomationRule['actions'];
  execution: IAutomationRule['execution'];
  scope: IAutomationRule['scope'];
  
  // Usage
  usageCount: number;
  isSystem: boolean;
  
  createdAt: Date;
  createdBy?: mongoose.Types.ObjectId;
}

// Rule Execution Result Type
export type RuleExecutionResult = {
  success: boolean;
  ruleId: string;
  executionId: string;
  conditionsMatched: boolean;
  actionsExecuted: number;
  actionsFailed: number;
  errors: string[];
  durationMs: number;
};

// Schemas

const AutomationRuleSchema = new Schema<IAutomationRule>(
  {
    ruleId: {
      type: String,
      unique: true,
      index: true,
    },
    name: {
      type: String,
      required: [true, 'Rule name is required'],
      trim: true,
    },
    nameAr: {
      type: String,
      trim: true,
    },
    description: String,
    descriptionAr: String,
    status: {
      type: String,
      enum: Object.values(AutomationRuleStatus),
      default: AutomationRuleStatus.DRAFT,
      index: true,
    },
    organizationId: {
      type: Schema.Types.ObjectId,
      ref: 'Organization',
      index: true,
    },
    department: String,
    trigger: {
      type: {
        type: String,
        enum: Object.values(RuleTriggerType),
        required: true,
      },
      config: {
        type: Map,
        of: Schema.Types.Mixed,
        default: {},
      },
      filters: [{
        field: String,
        operator: {
          type: String,
          enum: Object.values(RuleOperator),
        },
        value: Schema.Types.Mixed,
      }],
    },
    conditions: {
      operator: {
        type: String,
        enum: ['AND', 'OR'],
        default: 'AND',
      },
      groups: [{
        operator: {
          type: String,
          enum: ['AND', 'OR'],
          default: 'AND',
        },
        conditions: [{
          field: String,
          operator: {
            type: String,
            enum: Object.values(RuleOperator),
          },
          value: Schema.Types.Mixed,
          valueType: {
            type: String,
            enum: ['string', 'number', 'boolean', 'date', 'array'],
          },
        }],
      }],
    },
    actions: [{
      order: Number,
      type: {
        type: String,
        enum: Object.values(RuleActionType),
      },
      config: {
        type: Map,
        of: Schema.Types.Mixed,
        default: {},
      },
      delayMinutes: Number,
      stopOnFailure: {
        type: Boolean,
        default: false,
      },
      condition: {
        field: String,
        operator: {
          type: String,
          enum: Object.values(RuleOperator),
        },
        value: Schema.Types.Mixed,
      },
    }],
    execution: {
      maxExecutionsPerTicket: {
        type: Number,
        default: 1,
      },
      preventReTrigger: {
        type: Boolean,
        default: true,
      },
      reTriggerDelayMinutes: Number,
      allowParallel: {
        type: Boolean,
        default: false,
      },
      queueName: String,
      priority: {
        type: Number,
        default: 100,
      },
    },
    schedule: {
      cron: String,
      timezone: String,
      enabled: Boolean,
      lastRun: Date,
      nextRun: Date,
    },
    scope: {
      ticketTypes: [String],
      services: [String],
      categories: [String],
      priorities: [String],
      applyTo: {
        type: String,
        enum: ['all', 'specific'],
        default: 'all',
      },
    },
    stats: {
      executionCount: {
        type: Number,
        default: 0,
      },
      successCount: {
        type: Number,
        default: 0,
      },
      failureCount: {
        type: Number,
        default: 0,
      },
      lastExecutedAt: Date,
      lastExecutionStatus: {
        type: String,
        enum: ['success', 'failed', 'partial'],
      },
      averageExecutionTimeMs: {
        type: Number,
        default: 0,
      },
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    updatedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    version: {
      type: Number,
      default: 1,
    },
    history: [{
      version: Number,
      timestamp: {
        type: Date,
        default: Date.now,
      },
      userId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
      },
      changes: {
        type: Map,
        of: new Schema({
          old: Schema.Types.Mixed,
          new: Schema.Types.Mixed,
        }),
      },
    }],
    isValid: {
      type: Boolean,
      default: false,
    },
    validationErrors: [String],
  },
  {
    timestamps: true,
  }
);

// Indexes
AutomationRuleSchema.index({ ruleId: 1 });
AutomationRuleSchema.index({ status: 1, organizationId: 1 });
AutomationRuleSchema.index({ 'trigger.type': 1 });
AutomationRuleSchema.index({ name: 'text', description: 'text' });

// Pre-save hook
AutomationRuleSchema.pre('save', async function (next) {
  if (!this.ruleId) {
    const count = await mongoose.model('AutomationRule').countDocuments();
    this.ruleId = `RULE-${(count + 1).toString().padStart(4, '0')}`;
  }
  next();
});

// Methods
AutomationRuleSchema.methods.evaluateConditions = function (context: Record<string, unknown>): boolean {
  const evaluateCondition = (
    condition: { field: string; operator: RuleOperator; value: unknown },
    ctx: Record<string, unknown>
  ): boolean => {
    const fieldValue = ctx[condition.field];
    const compareValue = condition.value;

    switch (condition.operator) {
      case RuleOperator.EQUALS:
        return fieldValue === compareValue;
      case RuleOperator.NOT_EQUALS:
        return fieldValue !== compareValue;
      case RuleOperator.CONTAINS:
        return String(fieldValue).includes(String(compareValue));
      case RuleOperator.NOT_CONTAINS:
        return !String(fieldValue).includes(String(compareValue));
      case RuleOperator.GREATER_THAN:
        return Number(fieldValue) > Number(compareValue);
      case RuleOperator.LESS_THAN:
        return Number(fieldValue) < Number(compareValue);
      case RuleOperator.IN:
        return Array.isArray(compareValue) && compareValue.includes(fieldValue);
      case RuleOperator.IS_EMPTY:
        return fieldValue === undefined || fieldValue === null || fieldValue === '';
      case RuleOperator.IS_NOT_EMPTY:
        return fieldValue !== undefined && fieldValue !== null && fieldValue !== '';
      default:
        return false;
    }
  };

  const evaluateGroup = (group: typeof this.conditions.groups[0]): boolean => {
    const results = group.conditions.map((c: { field: string; operator: RuleOperator; value: unknown }) => evaluateCondition(c, context));
    return group.operator === 'AND' ? results.every(Boolean) : results.some(Boolean);
  };

  const groupResults = this.conditions.groups.map((g: typeof this.conditions.groups[0]) => evaluateGroup(g));
  return this.conditions.operator === 'AND' ? groupResults.every(Boolean) : groupResults.some(Boolean);
};

AutomationRuleSchema.methods.executeActions = async function (
  context: Record<string, unknown>
): Promise<RuleExecutionResult> {
  const errors: string[] = [];
  let executed = 0;
  let failed = 0;
  const startTime = Date.now();

  for (const action of this.actions) {
    try {
      // Check action condition if exists
      if (action.condition) {
        const conditionMet = this.evaluateConditions({ ...context, [action.condition.field]: context[action.condition.field] });
        if (!conditionMet) {
          continue;
        }
      }

      // Simulate action execution (actual implementation would be in a service)
      executed++;
    } catch (error) {
      failed++;
      errors.push(`Action ${action.order} failed: ${error}`);
      if (action.stopOnFailure) break;
    }
  }

  return {
    success: failed === 0,
    ruleId: this.ruleId,
    executionId: `EXEC-${Date.now()}`,
    conditionsMatched: true,
    actionsExecuted: executed,
    actionsFailed: failed,
    errors,
    durationMs: Date.now() - startTime,
  };
};

AutomationRuleSchema.methods.incrementExecution = function (success: boolean, durationMs: number): void {
  this.stats.executionCount++;
  if (success) {
    this.stats.successCount++;
  } else {
    this.stats.failureCount++;
  }
  this.stats.lastExecutedAt = new Date();
  this.stats.lastExecutionStatus = success ? 'success' : 'failed';
  
  // Update average execution time
  const currentAvg = this.stats.averageExecutionTimeMs;
  const count = this.stats.executionCount;
  this.stats.averageExecutionTimeMs = (currentAvg * (count - 1) + durationMs) / count;
};

// Rule Execution Log Schema
const RuleExecutionLogSchema = new Schema<IRuleExecutionLog>(
  {
    ruleId: {
      type: Schema.Types.ObjectId,
      ref: 'AutomationRule',
      required: true,
      index: true,
    },
    ruleName: String,
    triggerTicketId: {
      type: Schema.Types.ObjectId,
      ref: 'Ticket',
    },
    triggerType: {
      type: String,
      enum: Object.values(RuleTriggerType),
    },
    executionId: {
      type: String,
      unique: true,
    },
    startedAt: Date,
    completedAt: Date,
    durationMs: Number,
    status: {
      type: String,
      enum: ['success', 'failed', 'partial', 'timeout'],
    },
    context: {
      type: Map,
      of: Schema.Types.Mixed,
    },
    conditionsEvaluated: [{
      groupIndex: Number,
      conditionIndex: Number,
      field: String,
      operator: String,
      expectedValue: Schema.Types.Mixed,
      actualValue: Schema.Types.Mixed,
      result: Boolean,
    }],
    conditionsResult: Boolean,
    actionsExecuted: [{
      order: Number,
      type: String,
      status: {
        type: String,
        enum: ['success', 'failed', 'skipped'],
      },
      error: String,
      result: Schema.Types.Mixed,
      durationMs: Number,
      startedAt: Date,
      completedAt: Date,
    }],
    error: {
      message: String,
      stack: String,
      code: String,
    },
    retryCount: {
      type: Number,
      default: 0,
    },
    maxRetries: Number,
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
);

RuleExecutionLogSchema.index({ executionId: 1 });
RuleExecutionLogSchema.index({ ruleId: 1, startedAt: -1 });
RuleExecutionLogSchema.index({ triggerTicketId: 1 });

// Pre-save hook for execution ID
RuleExecutionLogSchema.pre('save', function (next) {
  if (!this.executionId) {
    this.executionId = `EXEC-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
  next();
});

// Rule Template Schema
const RuleTemplateSchema = new Schema<IRuleTemplate>(
  {
    templateId: {
      type: String,
      unique: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
    },
    nameAr: String,
    description: String,
    descriptionAr: String,
    category: {
      type: String,
      required: true,
    },
    trigger: {
      type: {
        type: String,
        enum: Object.values(RuleTriggerType),
      },
      config: {
        type: Map,
        of: Schema.Types.Mixed,
      },
    },
    conditions: {
      operator: String,
      groups: [Schema.Types.Mixed],
    },
    actions: [Schema.Types.Mixed],
    execution: {
      maxExecutionsPerTicket: Number,
      preventReTrigger: Boolean,
      allowParallel: Boolean,
      priority: Number,
    },
    scope: {
      ticketTypes: [String],
      services: [String],
      categories: [String],
      priorities: [String],
      applyTo: String,
    },
    usageCount: {
      type: Number,
      default: 0,
    },
    isSystem: {
      type: Boolean,
      default: false,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  {
    timestamps: true,
  }
);

RuleTemplateSchema.pre('save', async function (next) {
  if (!this.templateId) {
    const count = await mongoose.model('RuleTemplate').countDocuments();
    this.templateId = `TMPL-${(count + 1).toString().padStart(4, '0')}`;
  }
  next();
});

// Models
export const AutomationRule = (mongoose.models.AutomationRule as mongoose.Model<IAutomationRule>) || mongoose.model<IAutomationRule>('AutomationRule', AutomationRuleSchema);
export const RuleExecutionLog = (mongoose.models.RuleExecutionLog as mongoose.Model<IRuleExecutionLog>) || mongoose.model<IRuleExecutionLog>('RuleExecutionLog', RuleExecutionLogSchema);
export const RuleTemplate = (mongoose.models.RuleTemplate as mongoose.Model<IRuleTemplate>) || mongoose.model<IRuleTemplate>('RuleTemplate', RuleTemplateSchema);
