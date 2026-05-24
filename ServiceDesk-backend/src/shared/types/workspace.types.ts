/**
 * Workspace Types — Platform Core
 *
 * Defines the canonical workspace types that determine which
 * RequestTypes, templates, and defaults an organization sees.
 */

export enum WorkspaceType {
  PRODUCT_STUDIO = 'product_studio',
  MARKETING_AGENCY = 'marketing_agency',
  PROFESSIONAL_SERVICE_OFFICE = 'professional_service_office',
  ACCOUNTING_OFFICE = 'accounting_office',
  LEGAL_OFFICE = 'legal_office',
}

export const WORKSPACE_TYPE_LABELS: Record<WorkspaceType, { en: string; ar: string }> = {
  [WorkspaceType.PRODUCT_STUDIO]: { en: 'Product Studio', ar: 'استوديو المنتجات' },
  [WorkspaceType.MARKETING_AGENCY]: { en: 'Marketing Agency', ar: 'وكالة تسويق' },
  [WorkspaceType.PROFESSIONAL_SERVICE_OFFICE]: { en: 'Professional Service Office', ar: 'مكتب خدمات مهنية' },
  [WorkspaceType.ACCOUNTING_OFFICE]: { en: 'Accounting Office', ar: 'مكتب محاسبة' },
  [WorkspaceType.LEGAL_OFFICE]: { en: 'Legal Office', ar: 'مكتب قانوني' },
};
