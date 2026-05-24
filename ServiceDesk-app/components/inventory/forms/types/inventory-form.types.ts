/**
 * Inventory Express Forms — Schema-driven type system
 *
 * Every inventory form (request, add, edit, transfer, return, damage report,
 * maintenance, stock adjustment, disposal, inventory count) is described by a
 * single `InventoryFormSchema` object that the DynamicInventoryForm renderer
 * consumes.
 */

import type { ZodType } from 'zod';

// ── Field types ──────────────────────────────────────────────────

export type InventoryFieldType =
  | 'text'
  | 'textarea'
  | 'number'
  | 'date'
  | 'select'
  | 'multi-select'
  | 'radio'
  | 'checkbox'
  | 'asset-search'
  | 'item-picker'
  | 'user-picker'
  | 'location-picker'
  | 'attachment-upload'
  | 'condition-picker'
  | 'category-picker'
  | 'quantity'
  | 'currency'
  | 'warehouse-picker';

// ── Visibility & requiredness rules ──────────────────────────────

export interface FieldVisibilityRule {
  /** Name of the field whose value is watched. */
  field: string;
  /** Operator used for comparison. */
  operator: 'eq' | 'neq' | 'in' | 'notIn' | 'gt' | 'lt' | 'gte' | 'lte' | 'truthy' | 'falsy';
  /** Value to compare against (ignored for truthy/falsy). */
  value?: unknown;
}

// ── Select option ────────────────────────────────────────────────

export interface FieldOption {
  label: string;
  value: string | number | boolean;
  description?: string;
  disabled?: boolean;
  icon?: string;
}

// ── Single field definition ──────────────────────────────────────

export interface InventoryFormField {
  /** Unique key matching the form data shape (dot-path for nested). */
  name: string;
  label: string;
  type: InventoryFieldType;

  required?: boolean;
  helperText?: string;
  placeholder?: string;
  defaultValue?: unknown;

  /** Static options for select / radio / multi-select / condition-picker. */
  options?: FieldOption[];

  /** Zod schema fragment for this field (overrides auto-derived). */
  validation?: ZodType;

  /** Show this field only when ALL conditions are met. */
  visibleWhen?: FieldVisibilityRule[];
  /** Make this field required only when ALL conditions are met. */
  requiredWhen?: FieldVisibilityRule[];

  /** If true, field is hidden inside "Advanced options" collapsible. */
  advanced?: boolean;
  /** If true, field is rendered read-only (useful for edit forms). */
  readOnly?: boolean;

  /** Number-specific constraints. */
  min?: number;
  max?: number;
  step?: number;

  /** Attachment-specific constraints. */
  accept?: string;
  maxFileSize?: number;
  maxFiles?: number;

  /** Full-width override (span both grid columns). */
  fullWidth?: boolean;

  /** Columns this field spans in the grid (1 or 2). Default 1. */
  colSpan?: 1 | 2;
}

// ── Step definition (multi-step forms) ───────────────────────────

export interface InventoryFormStep {
  id: string;
  title: string;
  description?: string;
  fields: InventoryFormField[];
}

// ── Form mode ────────────────────────────────────────────────────

export type InventoryFormMode = 'create' | 'edit' | 'review' | 'approval';

// ── Top-level form schema ────────────────────────────────────────

export interface InventoryFormSchema {
  /** Unique identifier, e.g. 'request-item', 'add-item'. */
  id: string;
  /** Human-readable title shown at the top. */
  title: string;
  description?: string;
  /** Inventory request type mapped to this form (for backend routing). */
  requestType?: string;
  mode: InventoryFormMode;

  /**
   * When steps are provided the form is multi-step.
   * Fields inside steps are rendered one step at a time.
   */
  steps?: InventoryFormStep[];

  /**
   * Flat field list — used for single-page forms or as a fallback
   * when steps are not defined.
   */
  fields?: InventoryFormField[];

  /** Enable autosave (draft persistence). */
  autosave?: boolean;
  /** Require a review page before final submit. */
  reviewRequired?: boolean;
  /** Label on the submit button. Defaults to "Submit". */
  submitLabel?: string;

  /** Zod schema for the whole form (auto-composed from fields if omitted). */
  zodSchema?: ZodType;
}

// ── Draft model (mirrors backend InventoryDraft) ─────────────────

export interface InventoryDraft {
  id: string;
  userId: string;
  formType: string;
  currentStep: number;
  formData: Record<string, unknown>;
  attachments: Array<{ name: string; url: string; size: number }>;
  lastSavedAt: string;
}

// ── Form submit payload ──────────────────────────────────────────

export interface InventoryFormSubmitPayload {
  formType: string;
  data: Record<string, unknown>;
  attachments?: Array<{ name: string; url: string; size: number }>;
  draftId?: string;
}

// ── Autosave status ──────────────────────────────────────────────

export type AutosaveStatus = 'idle' | 'saving' | 'saved' | 'error';

// ── Validation summary entry ─────────────────────────────────────

export interface ValidationError {
  field: string;
  message: string;
  step?: number;
}
