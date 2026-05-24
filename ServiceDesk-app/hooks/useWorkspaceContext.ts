/**
 * useWorkspaceContext — Section 2, Batch 3
 *
 * Provides current workspace type, nav visibility config,
 * and available request types for the active organization.
 */

import { useMemo } from 'react';
import { useCurrentWorkspace } from './useOnboarding';
import { getNavVisibility, isSectionVisible, isItemHidden } from '@/lib/navigation/workspaceNavConfig';
import type { WorkspaceType } from '@/components/workspace/workspaceTemplates';
import type { NavVisibility } from '@/lib/navigation/workspaceNavConfig';

export interface WorkspaceContextValue {
  workspaceType: WorkspaceType | null;
  isOnboarded: boolean;
  isLoading: boolean;
  navVisibility: NavVisibility | null;
  isSectionVisible: (sectionKey: string) => boolean;
  isItemHidden: (itemKey: string) => boolean;
}

export function useWorkspaceContext(): WorkspaceContextValue {
  const { data, isLoading } = useCurrentWorkspace();

  const wsType = (data?.workspaceType as WorkspaceType) ?? null;

  return useMemo(() => ({
    workspaceType: wsType,
    isOnboarded: data?.isOnboarded ?? false,
    isLoading,
    navVisibility: getNavVisibility(wsType),
    isSectionVisible: (key: string) => isSectionVisible(key, wsType),
    isItemHidden: (key: string) => isItemHidden(key, wsType),
  }), [wsType, data?.isOnboarded, isLoading]);
}
