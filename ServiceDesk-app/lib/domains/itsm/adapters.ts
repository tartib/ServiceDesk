/**
 * ITSM Domain — Response Adapters
 *
 * Transforms raw API responses into normalized domain models.
 * Uses the central normalize.ts as the single parsing layer.
 */

import { normalizeEntity, normalizeList, normalizePaginated } from '@/lib/api/normalize';
import type { IIncident, IIncidentStats, IChange, IChangeStats, IProblem, IPIR, IRelease } from '@/types/itsm';

// ── Incident adapters ──────────────────────────────────────────

export const incidentAdapters = {
  one: (raw: unknown): IIncident => {
    const obj = raw as Record<string, unknown>;
    const inner = obj?.data && typeof obj.data === 'object'
      ? (obj.data as Record<string, unknown>).incident ?? obj.data
      : raw;
    return normalizeEntity<IIncident>(inner);
  },

  list: (raw: unknown) => normalizePaginated<IIncident>(raw),

  stats: (raw: unknown): IIncidentStats => normalizeEntity<IIncidentStats>(raw),
};

// ── Problem adapters ───────────────────────────────────────────

export const problemAdapters = {
  one: (raw: unknown): IProblem => {
    const obj = raw as Record<string, unknown>;
    const inner = obj?.data && typeof obj.data === 'object'
      ? (obj.data as Record<string, unknown>).problem ?? obj.data
      : raw;
    return normalizeEntity<IProblem>(inner);
  },

  list: (raw: unknown) => normalizePaginated<IProblem>(raw),
};

// ── Change adapters ────────────────────────────────────────────

export const changeAdapters = {
  one: (raw: unknown): IChange => {
    const obj = raw as Record<string, unknown>;
    const inner = obj?.data && typeof obj.data === 'object'
      ? (obj.data as Record<string, unknown>).change ?? obj.data
      : raw;
    return normalizeEntity<IChange>(inner);
  },

  list: (raw: unknown) => normalizePaginated<IChange>(raw),

  stats: (raw: unknown): IChangeStats => normalizeEntity<IChangeStats>(raw),
};

// ── Release adapters ───────────────────────────────────────────

export const releaseAdapters = {
  one: (raw: unknown): IRelease => {
    const obj = raw as Record<string, unknown>;
    const inner = obj?.data && typeof obj.data === 'object'
      ? (obj.data as Record<string, unknown>).release ?? obj.data
      : raw;
    return normalizeEntity<IRelease>(inner);
  },

  list: (raw: unknown) => normalizePaginated<IRelease>(raw),
};

// ── PIR adapters ───────────────────────────────────────────────

export const pirAdapters = {
  one: (raw: unknown): IPIR => {
    const obj = raw as Record<string, unknown>;
    const inner = obj?.data && typeof obj.data === 'object'
      ? (obj.data as Record<string, unknown>).pir ?? obj.data
      : raw;
    return normalizeEntity<IPIR>(inner);
  },

  list: (raw: unknown): IPIR[] => normalizeList<IPIR>(raw),
};
