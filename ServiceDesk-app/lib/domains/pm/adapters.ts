/**
 * PM Domain — Response Adapters
 *
 * Transforms raw API responses into normalized domain models.
 * Uses the central normalize.ts as the single parsing layer.
 */

import { normalizeEntity, normalizeList, normalizePaginated } from '@/lib/api/normalize';
import type { ProjectDTO, TaskDTO, SprintDTO, CommentDTO } from './dto';

// ── Project adapters ───────────────────────────────────────────

export const projectAdapters = {
  one: (raw: unknown): ProjectDTO => {
    const obj = raw as Record<string, unknown>;
    const inner = obj?.data && typeof obj.data === 'object'
      ? (obj.data as Record<string, unknown>).project ?? obj.data
      : raw;
    return normalizeEntity<ProjectDTO>(inner);
  },

  list: (raw: unknown) => normalizePaginated<ProjectDTO>(raw),
};

// ── Task adapters ──────────────────────────────────────────────

export const taskAdapters = {
  one: (raw: unknown): TaskDTO => {
    const obj = raw as Record<string, unknown>;
    const inner = obj?.data && typeof obj.data === 'object'
      ? (obj.data as Record<string, unknown>).task ?? obj.data
      : raw;
    return normalizeEntity<TaskDTO>(inner);
  },

  list: (raw: unknown) => normalizePaginated<TaskDTO>(raw),

  board: (raw: unknown): TaskDTO[] => normalizeList<TaskDTO>(raw),

  backlog: (raw: unknown): TaskDTO[] => normalizeList<TaskDTO>(raw),
};

// ── Sprint adapters ────────────────────────────────────────────

export const sprintAdapters = {
  one: (raw: unknown): SprintDTO => {
    const obj = raw as Record<string, unknown>;
    const inner = obj?.data && typeof obj.data === 'object'
      ? (obj.data as Record<string, unknown>).sprint ?? obj.data
      : raw;
    return normalizeEntity<SprintDTO>(inner);
  },

  list: (raw: unknown): SprintDTO[] => normalizeList<SprintDTO>(raw),
};

// ── Comment adapters ───────────────────────────────────────────

export const commentAdapters = {
  one: (raw: unknown): CommentDTO => {
    const obj = raw as Record<string, unknown>;
    const inner = obj?.data && typeof obj.data === 'object'
      ? (obj.data as Record<string, unknown>).comment ?? obj.data
      : raw;
    return normalizeEntity<CommentDTO>(inner);
  },

  list: (raw: unknown): CommentDTO[] => normalizeList<CommentDTO>(raw),
};
