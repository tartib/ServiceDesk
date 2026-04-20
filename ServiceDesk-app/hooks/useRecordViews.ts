/**
 * useRecordViews — View-mode state + per-definition record query
 *
 * Manages the active view mode (table | kanban | inbox) and provides
 * a hook to fetch records scoped to a specific form definition.
 */

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { recordApi } from '@/lib/domains/forms/records';
import type { RecordListParams } from '@/lib/domains/forms/records';

export type RecordViewMode = 'table' | 'kanban' | 'inbox';

export function useRecordViewMode(defaultMode: RecordViewMode = 'table') {
  const [viewMode, setViewMode] = useState<RecordViewMode>(defaultMode);
  return { viewMode, setViewMode };
}

const recordViewKeys = {
  byDefinition: (definitionId: string, params?: RecordListParams) =>
    ['records', 'by-definition', definitionId, params ?? {}] as const,
};

/** Fetch records scoped to a specific form definition. */
export function useRecordsByDefinition(
  definitionId: string,
  params: Omit<RecordListParams, 'formTemplateId'> = {},
) {
  return useQuery({
    queryKey: recordViewKeys.byDefinition(definitionId, params),
    queryFn: () => recordApi.list({ ...params, formTemplateId: definitionId }),
    enabled: !!definitionId,
  });
}
