/**
 * Workspace Templates — RequestType Seed Data (Section 2, Batch 1)
 *
 * Each workspace type has a curated set of RequestType entries that
 * drive the CreateRequestFlow UI. Seeds are idempotent (upsert on name + workspaceType).
 */

import { WorkspaceType } from '../../../shared/types/workspace.types';
import { RequestTypePriority } from '../models/RequestType';

export interface RequestTypeSeed {
  name: string;
  nameAr: string;
  description: string;
  descriptionAr: string;
  icon: string;
  workspaceType: WorkspaceType;
  defaultPriority: RequestTypePriority;
  isClientVisible: boolean;
  category: string;
  categoryAr: string;
  sortOrder: number;
}

// ── Product Studio ────────────────────────────────────────────────────────────

const PRODUCT_STUDIO_TEMPLATES: RequestTypeSeed[] = [
  {
    name: 'Bug Report',
    nameAr: 'تقرير خطأ',
    description: 'Report a software bug or defect',
    descriptionAr: 'الإبلاغ عن خطأ أو عيب برمجي',
    icon: 'bug',
    workspaceType: WorkspaceType.PRODUCT_STUDIO,
    defaultPriority: RequestTypePriority.HIGH,
    isClientVisible: true,
    category: 'Quality',
    categoryAr: 'الجودة',
    sortOrder: 1,
  },
  {
    name: 'Feature Request',
    nameAr: 'طلب ميزة',
    description: 'Request a new feature or enhancement',
    descriptionAr: 'طلب ميزة جديدة أو تحسين',
    icon: 'lightbulb',
    workspaceType: WorkspaceType.PRODUCT_STUDIO,
    defaultPriority: RequestTypePriority.MEDIUM,
    isClientVisible: true,
    category: 'Product',
    categoryAr: 'المنتج',
    sortOrder: 2,
  },
  {
    name: 'Sprint Task',
    nameAr: 'مهمة سبرنت',
    description: 'Internal task for the current sprint',
    descriptionAr: 'مهمة داخلية للسبرنت الحالي',
    icon: 'zap',
    workspaceType: WorkspaceType.PRODUCT_STUDIO,
    defaultPriority: RequestTypePriority.MEDIUM,
    isClientVisible: false,
    category: 'Engineering',
    categoryAr: 'الهندسة',
    sortOrder: 3,
  },
  {
    name: 'Design Review',
    nameAr: 'مراجعة التصميم',
    description: 'Submit a design for team review',
    descriptionAr: 'إرسال تصميم لمراجعة الفريق',
    icon: 'palette',
    workspaceType: WorkspaceType.PRODUCT_STUDIO,
    defaultPriority: RequestTypePriority.LOW,
    isClientVisible: false,
    category: 'Design',
    categoryAr: 'التصميم',
    sortOrder: 4,
  },
];

// ── Marketing Agency ──────────────────────────────────────────────────────────

const MARKETING_AGENCY_TEMPLATES: RequestTypeSeed[] = [
  {
    name: 'Campaign Brief',
    nameAr: 'ملخص حملة',
    description: 'Submit a new campaign brief for planning',
    descriptionAr: 'إرسال ملخص حملة جديدة للتخطيط',
    icon: 'megaphone',
    workspaceType: WorkspaceType.MARKETING_AGENCY,
    defaultPriority: RequestTypePriority.HIGH,
    isClientVisible: true,
    category: 'Campaigns',
    categoryAr: 'الحملات',
    sortOrder: 1,
  },
  {
    name: 'Content Request',
    nameAr: 'طلب محتوى',
    description: 'Request content creation (blog, social, email)',
    descriptionAr: 'طلب إنشاء محتوى (مدونة، وسائل التواصل، بريد إلكتروني)',
    icon: 'file-text',
    workspaceType: WorkspaceType.MARKETING_AGENCY,
    defaultPriority: RequestTypePriority.MEDIUM,
    isClientVisible: true,
    category: 'Content',
    categoryAr: 'المحتوى',
    sortOrder: 2,
  },
  {
    name: 'Asset Production',
    nameAr: 'إنتاج أصول',
    description: 'Request graphic design or video production',
    descriptionAr: 'طلب تصميم جرافيك أو إنتاج فيديو',
    icon: 'image',
    workspaceType: WorkspaceType.MARKETING_AGENCY,
    defaultPriority: RequestTypePriority.MEDIUM,
    isClientVisible: true,
    category: 'Creative',
    categoryAr: 'الإبداع',
    sortOrder: 3,
  },
  {
    name: 'Client Feedback',
    nameAr: 'ملاحظات العميل',
    description: 'Submit feedback or revision requests on deliverables',
    descriptionAr: 'إرسال ملاحظات أو طلبات تعديل على المخرجات',
    icon: 'message-square',
    workspaceType: WorkspaceType.MARKETING_AGENCY,
    defaultPriority: RequestTypePriority.HIGH,
    isClientVisible: true,
    category: 'Feedback',
    categoryAr: 'الملاحظات',
    sortOrder: 4,
  },
];

// ── Professional Service Office ──────────────────────────────────────────────

const PROFESSIONAL_SERVICE_TEMPLATES: RequestTypeSeed[] = [
  {
    name: 'Client Engagement',
    nameAr: 'تعاقد عميل',
    description: 'Open a new client engagement or project',
    descriptionAr: 'فتح تعاقد أو مشروع عميل جديد',
    icon: 'briefcase',
    workspaceType: WorkspaceType.PROFESSIONAL_SERVICE_OFFICE,
    defaultPriority: RequestTypePriority.HIGH,
    isClientVisible: false,
    category: 'Engagements',
    categoryAr: 'التعاقدات',
    sortOrder: 1,
  },
  {
    name: 'Deliverable Request',
    nameAr: 'طلب مخرج',
    description: 'Request a project deliverable or milestone approval',
    descriptionAr: 'طلب مخرج مشروع أو موافقة على مرحلة',
    icon: 'package',
    workspaceType: WorkspaceType.PROFESSIONAL_SERVICE_OFFICE,
    defaultPriority: RequestTypePriority.MEDIUM,
    isClientVisible: true,
    category: 'Delivery',
    categoryAr: 'التسليم',
    sortOrder: 2,
  },
  {
    name: 'Timesheet Review',
    nameAr: 'مراجعة ساعات العمل',
    description: 'Submit or review timesheet entries',
    descriptionAr: 'إرسال أو مراجعة سجلات ساعات العمل',
    icon: 'clock',
    workspaceType: WorkspaceType.PROFESSIONAL_SERVICE_OFFICE,
    defaultPriority: RequestTypePriority.LOW,
    isClientVisible: false,
    category: 'Operations',
    categoryAr: 'العمليات',
    sortOrder: 3,
  },
  {
    name: 'Billing Dispute',
    nameAr: 'اعتراض على فاتورة',
    description: 'Client dispute on an invoice or billing item',
    descriptionAr: 'اعتراض عميل على فاتورة أو بند فوترة',
    icon: 'alert-circle',
    workspaceType: WorkspaceType.PROFESSIONAL_SERVICE_OFFICE,
    defaultPriority: RequestTypePriority.HIGH,
    isClientVisible: true,
    category: 'Billing',
    categoryAr: 'الفوترة',
    sortOrder: 4,
  },
];

// ── All templates ─────────────────────────────────────────────────────────────

export const ALL_WORKSPACE_TEMPLATES: Record<WorkspaceType, RequestTypeSeed[]> = {
  [WorkspaceType.PRODUCT_STUDIO]: PRODUCT_STUDIO_TEMPLATES,
  [WorkspaceType.MARKETING_AGENCY]: MARKETING_AGENCY_TEMPLATES,
  [WorkspaceType.PROFESSIONAL_SERVICE_OFFICE]: PROFESSIONAL_SERVICE_TEMPLATES,
  [WorkspaceType.ACCOUNTING_OFFICE]: [], // Phase 2+ (Do Not Build Yet)
  [WorkspaceType.LEGAL_OFFICE]: [],      // Phase 2+ (Do Not Build Yet)
};

/**
 * Seed RequestTypes for a given workspace type and organization.
 * Uses upsert on (name, workspaceType, organizationId) to be idempotent.
 */
export async function seedWorkspaceRequestTypes(
  workspaceType: WorkspaceType,
  organizationId: string,
  createdBy: string,
): Promise<number> {
  const RequestTypeModel = (await import('../models/RequestType')).default;

  const templates = ALL_WORKSPACE_TEMPLATES[workspaceType] ?? [];
  let seeded = 0;

  for (const tpl of templates) {
    const result = await RequestTypeModel.updateOne(
      {
        name: tpl.name,
        workspaceType: tpl.workspaceType,
        organizationId,
      },
      {
        $setOnInsert: {
          ...tpl,
          organizationId,
          createdBy,
          isActive: true,
        },
      },
      { upsert: true },
    );
    if (result.upsertedCount > 0) seeded++;
  }

  return seeded;
}

/**
 * Get all available workspace types that have templates (MVP only).
 */
export function getAvailableWorkspaceTypes(): WorkspaceType[] {
  return Object.entries(ALL_WORKSPACE_TEMPLATES)
    .filter(([, templates]) => templates.length > 0)
    .map(([type]) => type as WorkspaceType);
}
