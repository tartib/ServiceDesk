/**
 * Forms Platform — React Query Keys
 *
 * Canonical query key factory for form definitions and related entities.
 * Use these keys in all platform-facing hooks to enable targeted cache invalidation.
 */

import type { FormDefinitionListParams } from './types';

export const formDefinitionKeys = {
  all: ['formDefinitions'] as const,
  lists: () => [...formDefinitionKeys.all, 'list'] as const,
  list: (params: FormDefinitionListParams) => [...formDefinitionKeys.lists(), params] as const,
  details: () => [...formDefinitionKeys.all, 'detail'] as const,
  detail: (id: string) => [...formDefinitionKeys.details(), id] as const,
  published: () => [...formDefinitionKeys.all, 'published'] as const,
  categories: () => [...formDefinitionKeys.all, 'categories'] as const,
  fields: (id: string) => [...formDefinitionKeys.detail(id), 'fields'] as const,
  workflow: (id: string) => [...formDefinitionKeys.detail(id), 'workflow'] as const,
  access: (id: string) => [...formDefinitionKeys.detail(id), 'access'] as const,
};
