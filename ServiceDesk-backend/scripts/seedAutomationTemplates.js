/**
 * Seed script for Automation Rule Templates
 * Run: node scripts/seedAutomationTemplates.js
 */
const mongoose = require('mongoose');
require('dotenv').config();

const MONGO_URI = process.env.MONGODB_URI || process.env.MONGO_URI || 'mongodb://localhost:27017/servicedesk';

const RuleTemplateSchema = new mongoose.Schema({
  templateId: { type: String, unique: true },
  name: { type: String, required: true },
  nameAr: String,
  description: String,
  descriptionAr: String,
  category: String,
  trigger: {
    type: { type: String, required: true },
    config: { type: Map, of: mongoose.Schema.Types.Mixed, default: {} },
  },
  conditions: {
    operator: { type: String, enum: ['AND', 'OR'], default: 'AND' },
    groups: [{
      operator: { type: String, enum: ['AND', 'OR'], default: 'AND' },
      conditions: [{
        field: String,
        operator: String,
        value: mongoose.Schema.Types.Mixed,
        valueType: String,
      }],
    }],
  },
  actions: [{
    order: Number,
    type: String,
    config: { type: Map, of: mongoose.Schema.Types.Mixed, default: {} },
    stopOnFailure: { type: Boolean, default: false },
  }],
  execution: {
    maxExecutionsPerTicket: { type: Number, default: 1 },
    preventReTrigger: { type: Boolean, default: true },
    allowParallel: { type: Boolean, default: false },
    priority: { type: Number, default: 50 },
  },
  scope: {
    ticketTypes: [String],
    services: [String],
    categories: [String],
    priorities: [String],
    applyTo: { type: String, default: 'all' },
  },
  usageCount: { type: Number, default: 0 },
  isSystem: { type: Boolean, default: true },
}, { timestamps: true });

const RuleTemplate = mongoose.model('RuleTemplate', RuleTemplateSchema);

// ============================================
// Templates
// ============================================

const templates = [
  // 1. Auto-assign high-priority tickets
  {
    templateId: 'tpl_auto_assign_high_priority',
    name: 'Auto-Assign High Priority Tickets',
    nameAr: 'تعيين تلقائي للتذاكر ذات الأولوية العالية',
    description: 'Automatically assign high or critical priority tickets to the senior support team upon creation.',
    descriptionAr: 'تعيين التذاكر ذات الأولوية العالية أو الحرجة تلقائياً لفريق الدعم الأول عند الإنشاء.',
    category: 'assignment',
    trigger: {
      type: 'ticket_created',
      config: {},
    },
    conditions: {
      operator: 'OR',
      groups: [
        {
          operator: 'AND',
          conditions: [
            { field: 'entity.priority', operator: 'equals', value: 'high', valueType: 'string' },
          ],
        },
        {
          operator: 'AND',
          conditions: [
            { field: 'entity.priority', operator: 'equals', value: 'critical', valueType: 'string' },
          ],
        },
      ],
    },
    actions: [
      {
        order: 1,
        type: 'assign_ticket',
        config: { assigneeId: '', teamId: 'senior_support', assignmentType: 'group' },
        stopOnFailure: false,
      },
      {
        order: 2,
        type: 'notify_team',
        config: { teamId: 'senior_support', template: 'high_priority_ticket', channel: 'in_app' },
        stopOnFailure: false,
      },
    ],
    execution: { maxExecutionsPerTicket: 1, preventReTrigger: true, allowParallel: false, priority: 80 },
    scope: { ticketTypes: [], services: [], categories: [], priorities: ['high', 'critical'], applyTo: 'specific' },
    isSystem: true,
  },

  // 2. SLA breach notification
  {
    templateId: 'tpl_sla_breach_escalation',
    name: 'SLA Breach Escalation',
    nameAr: 'تصعيد عند انتهاك SLA',
    description: 'When an SLA is breached, notify the manager, add a comment, and escalate the ticket priority.',
    descriptionAr: 'عند انتهاك اتفاقية مستوى الخدمة، يتم إشعار المدير وإضافة تعليق ورفع أولوية التذكرة.',
    category: 'sla',
    trigger: {
      type: 'sla_breached',
      config: {},
    },
    conditions: {
      operator: 'AND',
      groups: [
        {
          operator: 'AND',
          conditions: [
            { field: 'entity.status', operator: 'not_equals', value: 'resolved', valueType: 'string' },
            { field: 'entity.status', operator: 'not_equals', value: 'closed', valueType: 'string' },
          ],
        },
      ],
    },
    actions: [
      {
        order: 1,
        type: 'set_priority',
        config: { priority: 'critical' },
        stopOnFailure: false,
      },
      {
        order: 2,
        type: 'add_comment',
        config: { body: '⚠️ SLA has been breached. Ticket priority escalated to critical.', isInternal: true },
        stopOnFailure: false,
      },
      {
        order: 3,
        type: 'notify_user',
        config: { to: '{{entity.assignee.managerId}}', template: 'sla_breach_notification', channel: 'email' },
        stopOnFailure: false,
      },
    ],
    execution: { maxExecutionsPerTicket: 1, preventReTrigger: true, allowParallel: false, priority: 90 },
    scope: { ticketTypes: [], services: [], categories: [], priorities: [], applyTo: 'all' },
    isSystem: true,
  },

  // 3. Auto-close resolved tickets after inactivity
  {
    templateId: 'tpl_auto_close_resolved',
    name: 'Auto-Close Resolved Tickets',
    nameAr: 'إغلاق تلقائي للتذاكر المحلولة',
    description: 'Automatically close tickets that have been in "resolved" status for more than 3 days with no customer response.',
    descriptionAr: 'إغلاق التذاكر التي بقيت في حالة "محلول" لأكثر من 3 أيام دون رد من العميل تلقائياً.',
    category: 'lifecycle',
    trigger: {
      type: 'time_trigger',
      config: { intervalMinutes: 1440, checkField: 'entity.resolvedAt' },
    },
    conditions: {
      operator: 'AND',
      groups: [
        {
          operator: 'AND',
          conditions: [
            { field: 'entity.status', operator: 'equals', value: 'resolved', valueType: 'string' },
          ],
        },
      ],
    },
    actions: [
      {
        order: 1,
        type: 'set_status',
        config: { status: 'closed' },
        stopOnFailure: true,
      },
      {
        order: 2,
        type: 'add_comment',
        config: { body: 'Ticket auto-closed after 3 days in resolved status with no customer response.', isInternal: true },
        stopOnFailure: false,
      },
      {
        order: 3,
        type: 'notify_user',
        config: { to: '{{entity.requesterId}}', template: 'ticket_auto_closed', channel: 'email' },
        stopOnFailure: false,
      },
    ],
    execution: { maxExecutionsPerTicket: 1, preventReTrigger: true, allowParallel: false, priority: 30 },
    scope: { ticketTypes: [], services: [], categories: [], priorities: [], applyTo: 'all' },
    isSystem: true,
  },

  // 4. New ticket welcome notification
  {
    templateId: 'tpl_new_ticket_welcome',
    name: 'New Ticket Welcome Notification',
    nameAr: 'إشعار ترحيبي للتذكرة الجديدة',
    description: 'Send a welcome email to the requester when a new ticket is created, confirming receipt and providing the ticket number.',
    descriptionAr: 'إرسال بريد ترحيبي للمستخدم عند إنشاء تذكرة جديدة، مع تأكيد الاستلام وتوفير رقم التذكرة.',
    category: 'notification',
    trigger: {
      type: 'ticket_created',
      config: {},
    },
    conditions: {
      operator: 'AND',
      groups: [],
    },
    actions: [
      {
        order: 1,
        type: 'send_email',
        config: {
          to: '{{entity.requesterEmail}}',
          template: 'ticket_created_confirmation',
          subject: 'Your request #{{entity.ticketNumber}} has been received',
        },
        stopOnFailure: false,
      },
    ],
    execution: { maxExecutionsPerTicket: 1, preventReTrigger: true, allowParallel: true, priority: 50 },
    scope: { ticketTypes: [], services: [], categories: [], priorities: [], applyTo: 'all' },
    isSystem: true,
  },

  // 5. Status change notification to requester
  {
    templateId: 'tpl_status_change_notify',
    name: 'Status Change Notification',
    nameAr: 'إشعار تغيير الحالة',
    description: 'Notify the ticket requester via email whenever the ticket status changes.',
    descriptionAr: 'إشعار مقدم التذكرة عبر البريد الإلكتروني عند كل تغيير في حالة التذكرة.',
    category: 'notification',
    trigger: {
      type: 'status_changed',
      config: {},
    },
    conditions: {
      operator: 'AND',
      groups: [],
    },
    actions: [
      {
        order: 1,
        type: 'send_email',
        config: {
          to: '{{entity.requesterEmail}}',
          template: 'ticket_status_changed',
          subject: 'Your request #{{entity.ticketNumber}} status updated to {{entity.status}}',
        },
        stopOnFailure: false,
      },
      {
        order: 2,
        type: 'notify_user',
        config: { to: '{{entity.requesterId}}', template: 'status_changed', channel: 'in_app' },
        stopOnFailure: false,
      },
    ],
    execution: { maxExecutionsPerTicket: 100, preventReTrigger: false, allowParallel: true, priority: 40 },
    scope: { ticketTypes: [], services: [], categories: [], priorities: [], applyTo: 'all' },
    isSystem: true,
  },
];

// ============================================
// Runner
// ============================================

async function seed() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('Connected to MongoDB');

    for (const tpl of templates) {
      const existing = await RuleTemplate.findOne({ templateId: tpl.templateId });
      if (existing) {
        await RuleTemplate.updateOne({ templateId: tpl.templateId }, { $set: tpl });
        console.log(`  Updated: ${tpl.templateId}`);
      } else {
        await RuleTemplate.create(tpl);
        console.log(`  Created: ${tpl.templateId}`);
      }
    }

    console.log(`\nSeeded ${templates.length} automation rule templates.`);
  } catch (error) {
    console.error('Seed error:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected.');
  }
}

seed();
