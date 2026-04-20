/**
 * Forms Platform — Normalization Adapters
 *
 * Transforms raw backend form definition objects into the canonical
 * FormDefinition (= FormTemplate) shape the frontend uses.
 */

import type { FormDefinition, FormDefinitionSummary } from './types';

/**
 * Normalize a raw API form template object into the platform FormDefinition shape.
 * Handles both `_id` and `id` from the backend.
 */
export function normalizeFormDefinition(raw: Record<string, unknown>): FormDefinition {
  const base = raw as unknown as FormDefinition;
  return {
    ...base,
    _id: ((raw._id ?? raw.id) as string) || base._id,
  };
}

/** Normalize an array of raw form definitions */
export function normalizeFormDefinitionList(raw: unknown[]): FormDefinition[] {
  return (raw ?? []).map((item) => normalizeFormDefinition(item as Record<string, unknown>));
}

/**
 * Project a full FormDefinition into a lightweight summary for list views.
 */
export function toFormDefinitionSummary(fd: FormDefinition): FormDefinitionSummary {
  return {
    id: fd._id,
    name: fd.name,
    name_ar: fd.name_ar,
    description: fd.description,
    category: fd.category,
    icon: fd.icon,
    isPublished: !!fd.is_published,
    fieldCount: fd.fields?.length ?? 0,
    createdAt: fd.created_at ?? '',
    updatedAt: fd.updated_at ?? '',
  };
}
