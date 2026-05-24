/**
 * Automation Action Catalog — Types (ADR 001 Phase 7)
 *
 * Defines the available actions that workflow nodes can execute.
 * The catalog is the single source of truth for what a workflow step can do.
 *
 * Categories:
 *   - record    → update record, change status, assign
 *   - task      → create task, complete task
 *   - notify    → send notification, email
 *   - document  → generate document
 *   - webhook   → call external endpoint
 *   - system    → log, delay, branch
 */

export type AutomationActionCategory =
  | 'record'
  | 'task'
  | 'notify'
  | 'document'
  | 'webhook'
  | 'system';

export type AutomationActionCode =
  // Record actions
  | 'update_record'
  | 'change_status'
  | 'assign_record'
  | 'escalate_record'
  // Task actions
  | 'create_task'
  | 'complete_task'
  | 'assign_task'
  // Notification actions
  | 'send_notification'
  | 'send_email'
  // Document actions
  | 'generate_document'
  // Webhook actions
  | 'call_webhook'
  // System actions
  | 'log_event'
  | 'delay'
  | 'branch';

export interface AutomationActionParam {
  key: string;
  label: string;
  label_ar?: string;
  type: 'string' | 'number' | 'boolean' | 'select' | 'json' | 'expression';
  required: boolean;
  defaultValue?: unknown;
  options?: { value: string; label: string }[];
  placeholder?: string;
}

export interface AutomationActionDefinition {
  code: AutomationActionCode;
  name: string;
  name_ar: string;
  description: string;
  description_ar: string;
  category: AutomationActionCategory;
  icon?: string;
  params: AutomationActionParam[];
  isAvailable: boolean;
}

/**
 * The automation catalog — all actions that can be used in workflow steps.
 */
export const AUTOMATION_ACTION_CATALOG: AutomationActionDefinition[] = [
  // ── Record ──────────────────────────────────────────────────────────────
  {
    code: 'update_record',
    name: 'Update Record',
    name_ar: 'تحديث السجل',
    description: 'Update fields on the current record',
    description_ar: 'تحديث حقول في السجل الحالي',
    category: 'record',
    icon: 'edit',
    params: [
      { key: 'fields', label: 'Fields to update', type: 'json', required: true },
    ],
    isAvailable: true,
  },
  {
    code: 'change_status',
    name: 'Change Status',
    name_ar: 'تغيير الحالة',
    description: 'Change the record status',
    description_ar: 'تغيير حالة السجل',
    category: 'record',
    icon: 'refresh-cw',
    params: [
      {
        key: 'status',
        label: 'New Status',
        type: 'select',
        required: true,
        options: [
          { value: 'submitted', label: 'Submitted' },
          { value: 'under_review', label: 'Under Review' },
          { value: 'in_progress', label: 'In Progress' },
          { value: 'waiting_client', label: 'Waiting Client' },
          { value: 'approved', label: 'Approved' },
          { value: 'rejected', label: 'Rejected' },
          { value: 'completed', label: 'Completed' },
          { value: 'cancelled', label: 'Cancelled' },
        ],
      },
    ],
    isAvailable: true,
  },
  {
    code: 'assign_record',
    name: 'Assign Record',
    name_ar: 'تعيين السجل',
    description: 'Assign the record to a user or team',
    description_ar: 'تعيين السجل لمستخدم أو فريق',
    category: 'record',
    icon: 'user-plus',
    params: [
      { key: 'assigneeId', label: 'Assignee', type: 'string', required: true, placeholder: 'User ID or expression' },
      { key: 'assigneeName', label: 'Assignee Name', type: 'string', required: false },
    ],
    isAvailable: true,
  },
  {
    code: 'escalate_record',
    name: 'Escalate Record',
    name_ar: 'تصعيد السجل',
    description: 'Escalate priority to critical',
    description_ar: 'تصعيد الأولوية إلى حرج',
    category: 'record',
    icon: 'alert-triangle',
    params: [
      { key: 'reason', label: 'Reason', type: 'string', required: false },
    ],
    isAvailable: true,
  },

  // ── Task ─────────────────────────────────────────────────────────────────
  {
    code: 'create_task',
    name: 'Create Task',
    name_ar: 'إنشاء مهمة',
    description: 'Create a new task linked to the record',
    description_ar: 'إنشاء مهمة جديدة مرتبطة بالسجل',
    category: 'task',
    icon: 'check-square',
    params: [
      { key: 'title', label: 'Task Title', type: 'string', required: true },
      { key: 'assigneeId', label: 'Assignee', type: 'string', required: false },
      { key: 'dueInHours', label: 'Due in (hours)', type: 'number', required: false, defaultValue: 24 },
    ],
    isAvailable: true,
  },
  {
    code: 'complete_task',
    name: 'Complete Task',
    name_ar: 'إكمال المهمة',
    description: 'Mark a linked task as complete',
    description_ar: 'وضع علامة مهمة مرتبطة كمكتملة',
    category: 'task',
    icon: 'check-circle',
    params: [
      { key: 'taskId', label: 'Task ID', type: 'expression', required: true },
    ],
    isAvailable: true,
  },
  {
    code: 'assign_task',
    name: 'Assign Task',
    name_ar: 'تعيين المهمة',
    description: 'Assign a linked task to a user',
    description_ar: 'تعيين مهمة مرتبطة لمستخدم',
    category: 'task',
    icon: 'user-check',
    params: [
      { key: 'taskId', label: 'Task ID', type: 'expression', required: true },
      { key: 'assigneeId', label: 'Assignee', type: 'string', required: true },
    ],
    isAvailable: true,
  },

  // ── Notification ─────────────────────────────────────────────────────────
  {
    code: 'send_notification',
    name: 'Send Notification',
    name_ar: 'إرسال إشعار',
    description: 'Send an in-app notification to a user',
    description_ar: 'إرسال إشعار داخلي لمستخدم',
    category: 'notify',
    icon: 'bell',
    params: [
      { key: 'recipientId', label: 'Recipient', type: 'string', required: true },
      { key: 'title', label: 'Title', type: 'string', required: true },
      { key: 'body', label: 'Body', type: 'string', required: true },
      { key: 'link', label: 'Link', type: 'string', required: false },
    ],
    isAvailable: true,
  },
  {
    code: 'send_email',
    name: 'Send Email',
    name_ar: 'إرسال بريد إلكتروني',
    description: 'Send an email notification',
    description_ar: 'إرسال إشعار عبر البريد الإلكتروني',
    category: 'notify',
    icon: 'mail',
    params: [
      { key: 'to', label: 'To (email)', type: 'string', required: true },
      { key: 'subject', label: 'Subject', type: 'string', required: true },
      { key: 'body', label: 'Body (HTML)', type: 'string', required: true },
    ],
    isAvailable: false, // requires email service integration
  },

  // ── Document ─────────────────────────────────────────────────────────────
  {
    code: 'generate_document',
    name: 'Generate Document',
    name_ar: 'إنشاء مستند',
    description: 'Generate a document from a template using record data',
    description_ar: 'إنشاء مستند من قالب باستخدام بيانات السجل',
    category: 'document',
    icon: 'file-text',
    params: [
      { key: 'templateId', label: 'Document Template', type: 'string', required: true },
      {
        key: 'format', label: 'Format', type: 'select', required: false,
        options: [
          { value: 'pdf', label: 'PDF' },
          { value: 'html', label: 'HTML' },
          { value: 'docx', label: 'DOCX' },
        ],
      },
    ],
    isAvailable: true,
  },

  // ── Webhook ──────────────────────────────────────────────────────────────
  {
    code: 'call_webhook',
    name: 'Call Webhook',
    name_ar: 'استدعاء ويب هوك',
    description: 'Make an HTTP request to an external endpoint',
    description_ar: 'إجراء طلب HTTP لنقطة نهاية خارجية',
    category: 'webhook',
    icon: 'globe',
    params: [
      { key: 'url', label: 'URL', type: 'string', required: true, placeholder: 'https://...' },
      {
        key: 'method', label: 'Method', type: 'select', required: true,
        defaultValue: 'POST',
        options: [
          { value: 'GET', label: 'GET' },
          { value: 'POST', label: 'POST' },
          { value: 'PUT', label: 'PUT' },
          { value: 'PATCH', label: 'PATCH' },
        ],
      },
      { key: 'headers', label: 'Headers (JSON)', type: 'json', required: false },
      { key: 'body', label: 'Body (JSON)', type: 'json', required: false },
    ],
    isAvailable: true,
  },

  // ── System ───────────────────────────────────────────────────────────────
  {
    code: 'log_event',
    name: 'Log Event',
    name_ar: 'تسجيل حدث',
    description: 'Add an event to the record timeline',
    description_ar: 'إضافة حدث إلى الجدول الزمني للسجل',
    category: 'system',
    icon: 'activity',
    params: [
      { key: 'message', label: 'Message', type: 'string', required: true },
      { key: 'messageAr', label: 'Message (Arabic)', type: 'string', required: false },
    ],
    isAvailable: true,
  },
  {
    code: 'delay',
    name: 'Delay',
    name_ar: 'تأخير',
    description: 'Wait for a specified duration before continuing',
    description_ar: 'انتظار مدة محددة قبل المتابعة',
    category: 'system',
    icon: 'clock',
    params: [
      { key: 'durationMinutes', label: 'Duration (minutes)', type: 'number', required: true, defaultValue: 60 },
    ],
    isAvailable: true,
  },
  {
    code: 'branch',
    name: 'Conditional Branch',
    name_ar: 'فرع شرطي',
    description: 'Branch workflow based on a condition',
    description_ar: 'تفريع سير العمل بناءً على شرط',
    category: 'system',
    icon: 'git-branch',
    params: [
      { key: 'condition', label: 'Condition Expression', type: 'expression', required: true },
      { key: 'trueBranch', label: 'True Branch (step ID)', type: 'string', required: true },
      { key: 'falseBranch', label: 'False Branch (step ID)', type: 'string', required: false },
    ],
    isAvailable: true,
  },
];

/** Get actions by category */
export function getActionsByCategory(
  category: AutomationActionCategory,
): AutomationActionDefinition[] {
  return AUTOMATION_ACTION_CATALOG.filter((a) => a.category === category && a.isAvailable);
}

/** Get a single action definition by code */
export function getActionDefinition(
  code: AutomationActionCode,
): AutomationActionDefinition | undefined {
  return AUTOMATION_ACTION_CATALOG.find((a) => a.code === code);
}
