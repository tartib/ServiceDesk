/**
 * Workspace Navigation Config — Section 2, Batch 3
 *
 * Defines which sidebar sections/items are visible per workspace type.
 * Items not listed for a workspace type are hidden when that workspace is active.
 * If no workspace type is set (null), all items are shown (legacy/default behavior).
 */

import type { WorkspaceType } from '@/components/workspace/workspaceTemplates';

export interface NavVisibility {
  sections: string[];
  hiddenItems?: string[];
}

/**
 * Map of WorkspaceType → visible sidebar sections.
 * Section keys must match the `section` property on sidebar menu items.
 */
const WORKSPACE_NAV_MAP: Record<WorkspaceType, NavVisibility> = {
  product_studio: {
    sections: [
      'home',
      'projects',
      'forms_platform',
      'workflows',
      'solutions',
      'gamification',
      'settings',
    ],
    hiddenItems: ['inventory', 'campaigns'],
  },
  marketing_agency: {
    sections: [
      'home',
      'projects',
      'forms_platform',
      'workflows',
      'solutions',
      'campaigns',
      'settings',
    ],
    hiddenItems: ['inventory', 'gamification'],
  },
  professional_service_office: {
    sections: [
      'home',
      'projects',
      'forms_platform',
      'workflows',
      'solutions',
      'documents',
      'settings',
    ],
    hiddenItems: ['gamification', 'campaigns'],
  },
  accounting_office: {
    sections: [
      'home',
      'forms_platform',
      'workflows',
      'solutions',
      'documents',
      'settings',
    ],
    hiddenItems: ['projects', 'gamification', 'campaigns'],
  },
  legal_office: {
    sections: [
      'home',
      'forms_platform',
      'workflows',
      'solutions',
      'documents',
      'settings',
    ],
    hiddenItems: ['projects', 'gamification', 'campaigns'],
  },
};

/**
 * All sections that can appear in the sidebar.
 */
export const ALL_SECTIONS = [
  'home',
  'projects',
  'inventory',
  'forms_platform',
  'workflows',
  'solutions',
  'documents',
  'campaigns',
  'gamification',
  'settings',
] as const;

/**
 * Get navigation visibility config for a workspace type.
 * Returns null if no workspace type → show everything (default).
 */
export function getNavVisibility(workspaceType: WorkspaceType | null): NavVisibility | null {
  if (!workspaceType) return null;
  return WORKSPACE_NAV_MAP[workspaceType] ?? null;
}

/**
 * Check if a sidebar section should be visible for the current workspace.
 */
export function isSectionVisible(
  sectionKey: string,
  workspaceType: WorkspaceType | null,
): boolean {
  const config = getNavVisibility(workspaceType);
  if (!config) return true; // no workspace type → show all
  return config.sections.includes(sectionKey);
}

/**
 * Check if a specific menu item should be hidden for the current workspace.
 */
export function isItemHidden(
  itemKey: string,
  workspaceType: WorkspaceType | null,
): boolean {
  const config = getNavVisibility(workspaceType);
  if (!config) return false;
  return config.hiddenItems?.includes(itemKey) ?? false;
}
