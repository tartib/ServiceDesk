/**
 * ITSM Domain — Data Transfer Objects
 *
 * Backend response shapes. These reflect what the API actually returns
 * before normalization. Import domain model types from @/types/itsm.
 */

import type {
  IIncident,
  IIncidentStats,
  IChange,
  IChangeStats,
  IProblem,
  IPIR,
} from '@/types/itsm';

// ── Generic response envelopes ─────────────────────────────────

export interface EntityResponseDTO<T> {
  success?: boolean;
  data?: T;
}

export interface ListResponseDTO<T> {
  success?: boolean;
  data?: T[];
  items?: T[];
  total?: number;
  page?: number;
  limit?: number;
}

// ── Incident DTOs ──────────────────────────────────────────────

export type IncidentResponseDTO = EntityResponseDTO<{ incident: IIncident }>;
export type IncidentListResponseDTO = ListResponseDTO<IIncident>;
export type IncidentStatsResponseDTO = EntityResponseDTO<IIncidentStats>;

// ── Problem DTOs ───────────────────────────────────────────────

export type ProblemResponseDTO = EntityResponseDTO<{ problem: IProblem }>;
export type ProblemListResponseDTO = ListResponseDTO<IProblem>;

// ── Change DTOs ────────────────────────────────────────────────

export type ChangeResponseDTO = EntityResponseDTO<{ change: IChange }>;
export type ChangeListResponseDTO = ListResponseDTO<IChange>;
export type ChangeStatsResponseDTO = EntityResponseDTO<IChangeStats>;

// ── PIR DTOs ───────────────────────────────────────────────────

export type PIRResponseDTO = EntityResponseDTO<{ pir: IPIR }>;
export type PIRListResponseDTO = ListResponseDTO<IPIR>;
