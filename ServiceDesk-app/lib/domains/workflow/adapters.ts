/**
 * Workflow Engine Domain — Response Adapters
 *
 * Transforms raw API responses into normalized domain models.
 * Uses the central normalize.ts as the single parsing layer.
 */

import { normalizeEntity, normalizeList, normalizePaginated } from '@/lib/api/normalize';
import type { WfDefinitionDTO, WfInstanceDTO, WfEventDTO, WfExternalTaskDTO } from './dto';

// ── Definition adapters ────────────────────────────────────────

export const definitionAdapters = {
  one: (raw: unknown): WfDefinitionDTO => {
    const obj = raw as Record<string, unknown>;
    const inner = obj?.data && typeof obj.data === 'object'
      ? (obj.data as Record<string, unknown>).definition ?? obj.data
      : raw;
    return normalizeEntity<WfDefinitionDTO>(inner);
  },

  list: (raw: unknown) => normalizePaginated<WfDefinitionDTO>(raw),

  versions: (raw: unknown): WfDefinitionDTO[] => normalizeList<WfDefinitionDTO>(raw),
};

// ── Instance adapters ──────────────────────────────────────────

export const instanceAdapters = {
  one: (raw: unknown): WfInstanceDTO => {
    const obj = raw as Record<string, unknown>;
    const inner = obj?.data && typeof obj.data === 'object'
      ? (obj.data as Record<string, unknown>).instance ?? obj.data
      : raw;
    return normalizeEntity<WfInstanceDTO>(inner);
  },

  list: (raw: unknown) => normalizePaginated<WfInstanceDTO>(raw),

  events: (raw: unknown): WfEventDTO[] => normalizeList<WfEventDTO>(raw),
};

// ── External Task adapters ─────────────────────────────────────

export const externalTaskAdapters = {
  one: (raw: unknown): WfExternalTaskDTO => {
    const obj = raw as Record<string, unknown>;
    const inner = obj?.data && typeof obj.data === 'object'
      ? (obj.data as Record<string, unknown>).task ?? (obj.data as Record<string, unknown>).externalTask ?? obj.data
      : raw;
    return normalizeEntity<WfExternalTaskDTO>(inner);
  },

  list: (raw: unknown) => normalizePaginated<WfExternalTaskDTO>(raw),
};
