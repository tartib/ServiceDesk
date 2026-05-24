/**
 * Workspace Templates — Frontend Metadata (Section 2, Batch 1)
 *
 * Defines the available workspace types with their display metadata.
 * Used by OnboardingWizard, QuickCreate, and contextual navigation.
 */

export type WorkspaceType =
  | 'product_studio'
  | 'marketing_agency'
  | 'professional_service_office'
  | 'accounting_office'
  | 'legal_office';

export interface WorkspaceTemplate {
  type: WorkspaceType;
  name: string;
  nameAr: string;
  description: string;
  descriptionAr: string;
  icon: string;
  color: string;
  isAvailable: boolean;
  defaultRequestTypes: WorkspaceRequestTypePreview[];
}

export interface WorkspaceRequestTypePreview {
  name: string;
  nameAr: string;
  icon: string;
  isClientVisible: boolean;
}

export const WORKSPACE_TEMPLATES: WorkspaceTemplate[] = [
  {
    type: 'product_studio',
    name: 'Product Studio',
    nameAr: 'استوديو المنتجات',
    description: 'For software teams building and shipping products. Track bugs, features, sprints, and design reviews.',
    descriptionAr: 'لفرق البرمجيات التي تبني وتطلق المنتجات. تتبع الأخطاء والميزات والسبرنتات ومراجعات التصميم.',
    icon: 'rocket',
    color: 'brand',
    isAvailable: true,
    defaultRequestTypes: [
      { name: 'Bug Report', nameAr: 'تقرير خطأ', icon: 'bug', isClientVisible: true },
      { name: 'Feature Request', nameAr: 'طلب ميزة', icon: 'lightbulb', isClientVisible: true },
      { name: 'Sprint Task', nameAr: 'مهمة سبرنت', icon: 'zap', isClientVisible: false },
      { name: 'Design Review', nameAr: 'مراجعة التصميم', icon: 'palette', isClientVisible: false },
    ],
  },
  {
    type: 'marketing_agency',
    name: 'Marketing Agency',
    nameAr: 'وكالة تسويق',
    description: 'For agencies managing campaigns, content, and creative production for clients.',
    descriptionAr: 'للوكالات التي تدير الحملات والمحتوى والإنتاج الإبداعي للعملاء.',
    icon: 'megaphone',
    color: 'success',
    isAvailable: true,
    defaultRequestTypes: [
      { name: 'Campaign Brief', nameAr: 'ملخص حملة', icon: 'megaphone', isClientVisible: true },
      { name: 'Content Request', nameAr: 'طلب محتوى', icon: 'file-text', isClientVisible: true },
      { name: 'Asset Production', nameAr: 'إنتاج أصول', icon: 'image', isClientVisible: true },
      { name: 'Client Feedback', nameAr: 'ملاحظات العميل', icon: 'message-square', isClientVisible: true },
    ],
  },
  {
    type: 'professional_service_office',
    name: 'Professional Service Office',
    nameAr: 'مكتب خدمات مهنية',
    description: 'For consulting firms, accounting offices, and service businesses managing client engagements.',
    descriptionAr: 'للشركات الاستشارية ومكاتب المحاسبة وأعمال الخدمات التي تدير تعاقدات العملاء.',
    icon: 'briefcase',
    color: 'info',
    isAvailable: true,
    defaultRequestTypes: [
      { name: 'Client Engagement', nameAr: 'تعاقد عميل', icon: 'briefcase', isClientVisible: false },
      { name: 'Deliverable Request', nameAr: 'طلب مخرج', icon: 'package', isClientVisible: true },
      { name: 'Timesheet Review', nameAr: 'مراجعة ساعات العمل', icon: 'clock', isClientVisible: false },
      { name: 'Billing Dispute', nameAr: 'اعتراض على فاتورة', icon: 'alert-circle', isClientVisible: true },
    ],
  },
  {
    type: 'accounting_office',
    name: 'Accounting Office',
    nameAr: 'مكتب محاسبة',
    description: 'Deep accounting workflows — coming soon.',
    descriptionAr: 'سير عمل محاسبي متعمق — قريباً.',
    icon: 'calculator',
    color: 'warning',
    isAvailable: false,
    defaultRequestTypes: [],
  },
  {
    type: 'legal_office',
    name: 'Legal Office',
    nameAr: 'مكتب قانوني',
    description: 'Legal case management workflows — coming soon.',
    descriptionAr: 'سير عمل إدارة القضايا القانونية — قريباً.',
    icon: 'scale',
    color: 'neutral',
    isAvailable: false,
    defaultRequestTypes: [],
  },
];

/** Get only MVP-available templates */
export function getAvailableTemplates(): WorkspaceTemplate[] {
  return WORKSPACE_TEMPLATES.filter((t) => t.isAvailable);
}

/** Get a specific template by type */
export function getWorkspaceTemplate(type: WorkspaceType): WorkspaceTemplate | undefined {
  return WORKSPACE_TEMPLATES.find((t) => t.type === type);
}
