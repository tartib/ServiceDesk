/**
 * PM Domain — Data Transfer Objects
 *
 * Backend response shapes before normalization.
 */

// ── Generic response envelopes ─────────────────────────────────

export interface PmEntityResponseDTO<T> {
  success?: boolean;
  data?: T;
}

export interface PmListResponseDTO<T> {
  success?: boolean;
  data?: T[];
  items?: T[];
  tasks?: T[];
  total?: number;
  page?: number;
  limit?: number;
}

// ── Project ────────────────────────────────────────────────────

export interface ProjectDTO {
  _id?: string;
  id?: string;
  name: string;
  key: string;
  description?: string;
  methodology?: string;
  status?: string;
  owner_id?: string;
  organization_id?: string;
  members?: Record<string, unknown>[];
  labels?: string[];
  created_at?: string;
  updated_at?: string;
}

// ── Task ───────────────────────────────────────────────────────

export interface TaskDTO {
  _id?: string;
  id?: string;
  title: string;
  description?: string;
  status?: string;
  priority?: string;
  type?: string;
  assignee_id?: string;
  project_id?: string;
  sprint_id?: string | null;
  labels?: string[];
  story_points?: number;
  created_at?: string;
  updated_at?: string;
}

// ── Sprint ─────────────────────────────────────────────────────

export interface SprintDTO {
  _id?: string;
  id?: string;
  name: string;
  goal?: string;
  status?: string;
  project_id?: string;
  start_date?: string;
  end_date?: string;
  velocity?: number;
  created_at?: string;
  updated_at?: string;
}

// ── Comment ────────────────────────────────────────────────────

export interface CommentDTO {
  _id?: string;
  id?: string;
  content: string;
  task_id?: string;
  author_id?: string;
  reactions?: Record<string, unknown>[];
  created_at?: string;
  updated_at?: string;
}
