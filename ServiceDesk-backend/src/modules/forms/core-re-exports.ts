/**
 * Forms Module — Core Re-exports
 *
 * Establishes the Forms module's ownership over its core entities and types
 * that currently live in src/core/.
 *
 * New consumers should import from here instead of from core/ directly.
 */

// ── Entities ─────────────────────────────────────────────────
export {
  default as FormTemplate,
} from '../../core/entities/FormTemplate';

export {
  default as FormSubmission,
} from '../../core/entities/FormSubmission';

// ── Types ────────────────────────────────────────────────────
export * from '../../core/types/smart-forms.types';
