/**
 * Form Template Model - نموذج قالب النموذج
 * Smart Forms System
 */

import mongoose, { Schema, Document, Model } from 'mongoose';
import {
  IFormTemplate,
  SmartFieldType,
  FormLayoutType,
  ConditionalActionType,
  WorkflowStepType,
  ApprovalType,
  AssignmentStrategy,
  BusinessRuleType,
  RuleTriggerType,
  RuleActionType,
} from '../types/smart-forms.types';

// ============================================
// SUB-SCHEMAS - المخططات الفرعية
// ============================================

const FieldOptionSchema = new Schema({
  value: { type: String, required: true },
  label: { type: String, required: true },
  label_ar: String,
  icon: String,
  color: String,
  disabled: { type: Boolean, default: false },
  metadata: Schema.Types.Mixed,
}, { _id: false });

const DefaultValueSourceSchema = new Schema({
  type: { type: String, enum: ['static', 'user_attribute', 'api', 'formula'], required: true },
  value: { type: String, required: true },
}, { _id: false });

const OptionsSourceSchema = new Schema({
  type: { type: String, enum: ['static', 'api', 'lookup'], required: true },
  endpoint: String,
  lookup_entity: String,
  value_field: String,
  label_field: String,
  filters: Schema.Types.Mixed,
}, { _id: false });

const FieldValidationSchema = new Schema({
  required: { type: Boolean, default: false },
  required_condition: Schema.Types.Mixed,
  min: Number,
  max: Number,
  min_length: Number,
  max_length: Number,
  pattern: String,
  pattern_message: String,
  pattern_message_ar: String,
  custom_validator: String,
}, { _id: false });

const FieldDisplaySchema = new Schema({
  order: { type: Number, required: true },
  section_id: String,
  width: { type: String, enum: ['full', 'half', 'third', 'quarter'], default: 'full' },
  hidden: { type: Boolean, default: false },
  readonly: { type: Boolean, default: false },
  css_class: String,
}, { _id: false });

const SmartFieldSchema = new Schema({
  field_id: { type: String, required: true },
  type: { type: String, enum: Object.values(SmartFieldType), required: true },
  label: { type: String, required: true },
  label_ar: { type: String, required: true },
  placeholder: String,
  placeholder_ar: String,
  help_text: String,
  help_text_ar: String,
  default_value: Schema.Types.Mixed,
  default_value_source: DefaultValueSourceSchema,
  options: [FieldOptionSchema],
  options_source: OptionsSourceSchema,
  validation: { type: FieldValidationSchema, required: true },
  display: { type: FieldDisplaySchema, required: true },
  visibility_conditions: [Schema.Types.Mixed],
  depends_on: [String],
  settings: { type: Schema.Types.Mixed, default: {} },
}, { _id: false });

const FormSectionSchema = new Schema({
  section_id: { type: String, required: true },
  title: { type: String, required: true },
  title_ar: { type: String, required: true },
  description: String,
  description_ar: String,
  order: { type: Number, required: true },
  collapsible: { type: Boolean, default: false },
  collapsed_by_default: { type: Boolean, default: false },
}, { _id: false });

const ConditionGroupSchema = new Schema({
  operator: { type: String, enum: ['AND', 'OR'], required: true },
  conditions: [Schema.Types.Mixed],
}, { _id: false });

const ConditionalActionSchema = new Schema({
  action_type: { type: String, enum: Object.values(ConditionalActionType), required: true },
  target_field_id: String,
  target_section_id: String,
  value: Schema.Types.Mixed,
  message: String,
  message_ar: String,
}, { _id: false });

const ConditionalRuleSchema = new Schema({
  rule_id: { type: String, required: true },
  name: { type: String, required: true },
  description: String,
  conditions: { type: ConditionGroupSchema, required: true },
  actions: [ConditionalActionSchema],
  priority: { type: Number, default: 0 },
  is_active: { type: Boolean, default: true },
}, { _id: false });

const ValidationRuleSchema = new Schema({
  rule_id: { type: String, required: true },
  name: { type: String, required: true },
  type: { type: String, enum: ['field', 'cross_field', 'form'], required: true },
  field_ids: [String],
  condition: { type: ConditionGroupSchema, required: true },
  error_message: { type: String, required: true },
  error_message_ar: { type: String, required: true },
  is_active: { type: Boolean, default: true },
}, { _id: false });

const EscalationRuleSchema = new Schema({
  rule_id: { type: String, required: true },
  trigger: {
    type: { type: String, enum: ['time', 'condition'], required: true },
    after_hours: Number,
    condition: Schema.Types.Mixed,
  },
  action: {
    type: { type: String, enum: ['notify', 'reassign', 'escalate_to_manager', 'auto_action'], required: true },
    target: String,
    notification_template: String,
    auto_action: { type: String, enum: ['approve', 'reject'] },
  },
  repeat: { type: Boolean, default: false },
  repeat_interval_hours: Number,
  max_escalations: Number,
}, { _id: false });

const AutoActionSchema = new Schema({
  action_id: { type: String, required: true },
  type: { type: String, enum: Object.values(RuleActionType), required: true },
  config: { type: Schema.Types.Mixed, default: {} },
  condition: Schema.Types.Mixed,
  order: { type: Number, default: 0 },
}, { _id: false });

const WorkflowActionSchema = new Schema({
  action_id: { type: String, required: true },
  name: { type: String, required: true },
  name_ar: { type: String, required: true },
  icon: String,
  color: String,
  type: { type: String, enum: ['approve', 'reject', 'return', 'forward', 'escalate', 'complete', 'cancel', 'custom'], required: true },
  requires_comment: { type: Boolean, default: false },
  requires_signature: { type: Boolean, default: false },
  confirmation_message: String,
  confirmation_message_ar: String,
  visible_when: Schema.Types.Mixed,
}, { _id: false });

const SubActivitySchema = new Schema({
  activity_id: { type: String, required: true },
  name: { type: String, required: true },
  name_ar: { type: String, required: true },
  description: String,
  type: { type: String, enum: ['task', 'checklist', 'form'], required: true },
  task_config: {
    assignee_type: { type: String, enum: ['same', 'different'] },
    assignee: String,
    due_hours: Number,
  },
  checklist_items: [{
    item_id: { type: String, required: true },
    label: { type: String, required: true },
    label_ar: { type: String, required: true },
    required: { type: Boolean, default: false },
  }],
  sub_form_id: String,
  is_required: { type: Boolean, default: true },
  order: { type: Number, default: 0 },
}, { _id: false });

const WorkflowStepSchema = new Schema({
  step_id: { type: String, required: true },
  name: { type: String, required: true },
  name_ar: { type: String, required: true },
  description: String,
  type: { type: String, enum: Object.values(WorkflowStepType), required: true },
  assignment: {
    type: { type: String, enum: ['user', 'role', 'group', 'dynamic', 'requester_manager'], required: true },
    value: String,
    dynamic_rule: String,
  },
  permissions: {
    can_edit_fields: [String],
    can_view_fields: [String],
    can_add_attachments: { type: Boolean, default: true },
    can_add_comments: { type: Boolean, default: true },
  },
  available_actions: [WorkflowActionSchema],
  sla: {
    response_hours: Number,
    warning_percent: { type: Number, default: 80 },
    escalation_rules: [EscalationRuleSchema],
  },
  auto_actions: {
    on_enter: [AutoActionSchema],
    on_exit: [AutoActionSchema],
    on_timeout: [AutoActionSchema],
  },
  sub_activities: [SubActivitySchema],
  is_final: { type: Boolean, default: false },
  is_approval_step: { type: Boolean, default: false },
}, { _id: false });

const WorkflowTransitionSchema = new Schema({
  transition_id: { type: String, required: true },
  from_step_id: { type: String, required: true },
  to_step_id: { type: String, required: true },
  trigger: {
    type: { type: String, enum: ['action', 'condition', 'auto'], required: true },
    action_id: String,
    condition: Schema.Types.Mixed,
    auto_after_hours: Number,
  },
  on_transition: [AutoActionSchema],
}, { _id: false });

const WorkflowConfigSchema = new Schema({
  workflow_id: { type: String, required: true },
  name: { type: String, required: true },
  description: String,
  steps: [WorkflowStepSchema],
  initial_step_id: { type: String, required: true },
  transitions: [WorkflowTransitionSchema],
  settings: {
    allow_parallel_steps: { type: Boolean, default: false },
    require_comments_on_reject: { type: Boolean, default: true },
    enable_delegation: { type: Boolean, default: true },
    max_delegation_depth: { type: Number, default: 2 },
    auto_close_after_days: Number,
  },
}, { _id: false });

const ApprovalChainStepSchema = new Schema({
  step: { type: Number, required: true },
  approver: {
    type: { type: String, enum: ['user', 'role', 'group', 'manager', 'dynamic'], required: true },
    value: String,
    dynamic_rule: String,
    manager_level: Number,
  },
  condition: Schema.Types.Mixed,
  is_optional: { type: Boolean, default: false },
  can_skip_if_same_as_previous: { type: Boolean, default: false },
  auto_approve_after_hours: Number,
  auto_approve_condition: Schema.Types.Mixed,
}, { _id: false });

const DelegationRuleSchema = new Schema({
  rule_id: { type: String, required: true },
  delegator: {
    type: { type: String, enum: ['user', 'role', 'any'], required: true },
    value: String,
  },
  delegate_to: {
    type: { type: String, enum: ['user', 'role', 'group'], required: true },
    value: String,
    restrictions: [String],
  },
  valid_from: Date,
  valid_to: Date,
  applies_to_forms: [String],
  is_active: { type: Boolean, default: true },
}, { _id: false });

const AutoApproveRuleSchema = new Schema({
  rule_id: { type: String, required: true },
  name: { type: String, required: true },
  conditions: { type: ConditionGroupSchema, required: true },
  priority: { type: Number, default: 0 },
  is_active: { type: Boolean, default: true },
}, { _id: false });

const ApprovalConfigSchema = new Schema({
  approval_id: { type: String, required: true },
  type: { type: String, enum: Object.values(ApprovalType), required: true },
  chain: [ApprovalChainStepSchema],
  settings: {
    allow_delegation: { type: Boolean, default: true },
    delegation_rules: [DelegationRuleSchema],
    auto_approve_rules: [AutoApproveRuleSchema],
    escalation_enabled: { type: Boolean, default: true },
    escalation_rules: [EscalationRuleSchema],
    quorum_type: { type: String, enum: ['all', 'majority', 'any', 'count'], default: 'all' },
    quorum_count: Number,
    on_reject: { type: String, enum: ['stop', 'continue', 'restart'], default: 'stop' },
    timeout_hours: { type: Number, default: 48 },
    on_timeout: { type: String, enum: ['escalate', 'auto_approve', 'auto_reject', 'notify'], default: 'escalate' },
  },
}, { _id: false });

const LoadBalancingConfigSchema = new Schema({
  consider_active_tasks: { type: Boolean, default: true },
  max_tasks_per_user: { type: Number, default: 10 },
  consider_skills: { type: Boolean, default: false },
  required_skills: [String],
  consider_availability: { type: Boolean, default: true },
  working_hours_only: { type: Boolean, default: true },
}, { _id: false });

const AssignmentRuleSchema = new Schema({
  rule_id: { type: String, required: true },
  name: { type: String, required: true },
  description: String,
  priority: { type: Number, default: 0 },
  conditions: { type: ConditionGroupSchema, required: true },
  strategy: { type: String, enum: Object.values(AssignmentStrategy), required: true },
  target: {
    type: { type: String, enum: ['user', 'role', 'group', 'team'], required: true },
    values: [String],
  },
  load_balancing: LoadBalancingConfigSchema,
  fallback_assignment: {
    type: { type: String, enum: ['user', 'role', 'group'] },
    value: String,
  },
  is_active: { type: Boolean, default: true },
}, { _id: false });

const RuleTriggerSchema = new Schema({
  type: { type: String, enum: Object.values(RuleTriggerType), required: true },
  event: String,
  schedule: {
    cron: String,
    timezone: String,
  },
  field_ids: [String],
  from_status: [String],
  to_status: [String],
}, { _id: false });

const RuleActionSchema = new Schema({
  action_id: { type: String, required: true },
  type: { type: String, enum: Object.values(RuleActionType), required: true },
  config: { type: Schema.Types.Mixed, default: {} },
  condition: Schema.Types.Mixed,
  order: { type: Number, default: 0 },
}, { _id: false });

const BusinessRuleSchema = new Schema({
  rule_id: { type: String, required: true },
  name: { type: String, required: true },
  description: String,
  type: { type: String, enum: Object.values(BusinessRuleType), required: true },
  trigger: { type: RuleTriggerSchema, required: true },
  conditions: { type: ConditionGroupSchema, required: true },
  actions: [RuleActionSchema],
  execution: {
    async: { type: Boolean, default: false },
    retry_on_failure: { type: Boolean, default: false },
    max_retries: { type: Number, default: 3 },
    retry_delay_seconds: { type: Number, default: 60 },
  },
  priority: { type: Number, default: 0 },
  is_active: { type: Boolean, default: true },
  created_by: { type: String, required: true },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now },
}, { _id: false });

const FormSettingsSchema = new Schema({
  allow_draft: { type: Boolean, default: true },
  allow_attachments: { type: Boolean, default: true },
  max_attachments: { type: Number, default: 10 },
  allowed_file_types: { type: [String], default: ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'png', 'jpg', 'jpeg'] },
  max_file_size_mb: { type: Number, default: 10 },
  require_signature: { type: Boolean, default: false },
  enable_geolocation: { type: Boolean, default: false },
  submission_message: String,
  submission_message_ar: String,
}, { _id: false });

const FormAccessSchema = new Schema({
  available_to: { type: [String], default: [] },
  restricted_from: [String],
  requires_authentication: { type: Boolean, default: true },
}, { _id: false });

// ============================================
// MAIN SCHEMA - المخطط الرئيسي
// ============================================

export interface IFormTemplateDocument extends Omit<IFormTemplate, '_id'>, Document {
  generateFormId(): Promise<string>;
}

interface IFormTemplateModel extends Model<IFormTemplateDocument> {
  findByFormId(formId: string): Promise<IFormTemplateDocument | null>;
  findPublished(): Promise<IFormTemplateDocument[]>;
  findByCategory(category: string): Promise<IFormTemplateDocument[]>;
}

const FormTemplateSchema = new Schema<IFormTemplateDocument>(
  {
    form_id: {
      type: String,
      unique: true,
      sparse: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    name_ar: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    description_ar: {
      type: String,
      trim: true,
    },
    category: {
      type: String,
      required: true,
      index: true,
    },
    icon: String,
    version: {
      type: Number,
      default: 1,
    },
    is_published: {
      type: Boolean,
      default: false,
      index: true,
    },
    published_at: Date,
    fields: {
      type: [SmartFieldSchema],
      default: [],
    },
    layout: {
      type: {
        type: String,
        enum: Object.values(FormLayoutType),
        default: FormLayoutType.SINGLE_COLUMN,
      },
      sections: [FormSectionSchema],
    },
    conditional_rules: {
      type: [ConditionalRuleSchema],
      default: [],
    },
    validation_rules: {
      type: [ValidationRuleSchema],
      default: [],
    },
    workflow: WorkflowConfigSchema,
    approval: ApprovalConfigSchema,
    assignment_rules: {
      type: [AssignmentRuleSchema],
      default: [],
    },
    business_rules: {
      type: [BusinessRuleSchema],
      default: [],
    },
    settings: {
      type: FormSettingsSchema,
      default: () => ({}),
    },
    access: {
      type: FormAccessSchema,
      default: () => ({}),
    },
    created_by: {
      type: String,
      required: true,
    },
    updated_by: String,
    site_id: {
      type: String,
      index: true,
    },
  },
  {
    timestamps: {
      createdAt: 'created_at',
      updatedAt: 'updated_at',
    },
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// ============================================
// INDEXES - الفهارس
// ============================================

FormTemplateSchema.index({ category: 1, is_published: 1 });
FormTemplateSchema.index({ site_id: 1, is_published: 1 });
FormTemplateSchema.index({ created_by: 1 });
FormTemplateSchema.index({ 'access.available_to': 1 });

// ============================================
// METHODS - الدوال
// ============================================

FormTemplateSchema.methods.generateFormId = async function(): Promise<string> {
  const year = new Date().getFullYear();
  const count = await FormTemplate.countDocuments({
    form_id: { $regex: `^FORM-${year}-` }
  });
  return `FORM-${year}-${String(count + 1).padStart(5, '0')}`;
};

// ============================================
// STATICS - الدوال الثابتة
// ============================================

FormTemplateSchema.statics.findByFormId = function(formId: string) {
  return this.findOne({ form_id: formId });
};

FormTemplateSchema.statics.findPublished = function() {
  return this.find({ is_published: true }).sort({ category: 1, name: 1 });
};

FormTemplateSchema.statics.findByCategory = function(category: string) {
  return this.find({ category, is_published: true }).sort({ name: 1 });
};

// ============================================
// HOOKS - الخطافات
// ============================================

FormTemplateSchema.pre('save', async function(next) {
  if (this.isNew && !this.form_id) {
    this.form_id = await this.generateFormId();
  }
  
  if (this.isModified() && !this.isNew) {
    this.version = (this.version || 1) + 1;
  }
  
  next();
});

// ============================================
// VIRTUALS - الحقول الافتراضية
// ============================================

FormTemplateSchema.virtual('field_count').get(function() {
  return this.fields?.length || 0;
});

FormTemplateSchema.virtual('has_workflow').get(function() {
  return !!this.workflow;
});

FormTemplateSchema.virtual('has_approval').get(function() {
  return !!this.approval;
});

// ============================================
// EXPORT - التصدير
// ============================================

export const FormTemplate = mongoose.model<IFormTemplateDocument, IFormTemplateModel>(
  'FormTemplate',
  FormTemplateSchema
);

export default FormTemplate;
