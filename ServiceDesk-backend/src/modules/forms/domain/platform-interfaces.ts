/**
 * Forms Platform — Canonical Domain Interfaces
 *
 * Platform-owned vocabulary for form definitions, records, and workflow binding.
 * These are aliases / re-exports of the existing implementation types so that
 * solution modules (service-catalog, itsm, etc.) can import from here instead
 * of directly from formTemplateService.ts internals.
 *
 * Architecture rule (ADR 001):
 *   Solution modules consume IFormDefinitionService (this file), not formTemplateService directly.
 */

import type { IFormTemplateDocument } from '../../../core/entities/FormTemplate';
import type {
  ISmartField,
  IWorkflowConfig,
  IApprovalConfig,
  IFormTemplate,
} from '../../../core/types/smart-forms.types';

import type {
  CreateFormTemplateDTO,
  UpdateFormTemplateDTO,
  FormTemplateListOptions,
  FormTemplateListResult,
  ValidationResult,
} from '../services/formTemplateService';

// ── Platform type aliases ──────────────────────────────────────────────────

/** Platform name for a form template/definition */
export type IFormDefinition = IFormTemplateDocument;

/** Platform name for a form field */
export type IFormField = ISmartField;

/** Platform name for a simple (forms-native) workflow config */
export type ISimpleWorkflowConfig = IWorkflowConfig;

/** Platform name for approval config */
export type IFormApprovalConfig = IApprovalConfig;

// ── Platform DTO aliases ───────────────────────────────────────────────────

/** DTO for creating a new form definition */
export type CreateFormDefinitionDTO = CreateFormTemplateDTO;

/** DTO for updating an existing form definition */
export type UpdateFormDefinitionDTO = UpdateFormTemplateDTO;

/** Options for listing form definitions */
export type FormDefinitionListOptions = FormTemplateListOptions;

/** Result shape for paginated list of form definitions */
export type FormDefinitionListResult = FormTemplateListResult;

/** Result shape for template validation */
export type FormDefinitionValidationResult = ValidationResult;

// ── Platform service interface ─────────────────────────────────────────────

/**
 * IFormDefinitionService — the service contract for managing form definitions.
 *
 * Solution modules that need to create/read form definitions should depend on
 * this interface, wired at module registration time via the InternalApiRegistry.
 */
export interface IFormDefinitionService {
  createDefinition(data: CreateFormDefinitionDTO): Promise<IFormDefinition>;
  updateDefinition(formId: string, data: UpdateFormDefinitionDTO): Promise<IFormDefinition | null>;
  deleteDefinition(formId: string): Promise<boolean>;
  getDefinition(formId: string): Promise<IFormDefinition | null>;
  listDefinitions(options?: FormDefinitionListOptions): Promise<FormDefinitionListResult>;
  publishDefinition(formId: string, userId: string): Promise<IFormDefinition | null>;
  unpublishDefinition(formId: string, userId: string): Promise<IFormDefinition | null>;
  validateDefinition(definition: IFormDefinition): FormDefinitionValidationResult;
  getPublishedDefinitions(siteId?: string): Promise<IFormDefinition[]>;
  getCategories(siteId?: string): Promise<string[]>;
}

// ── Workflow binding extension fields ──────────────────────────────────────

/**
 * Optional workflow binding fields added to FormTemplate in Phase 3.
 * Kept as a separate interface to avoid modifying the core FormTemplate schema prematurely.
 */
export interface IFormWorkflowBinding {
  /** References a WorkflowDefinition from modules/workflow-engine */
  workflow_definition_id?: string;
  /** 'simple' = FormWorkflowService (frozen), 'advanced' = workflow-engine, 'none' = no workflow */
  workflow_mode?: 'simple' | 'advanced' | 'none';
}

/** FormDefinition extended with optional platform workflow binding */
export type IFormDefinitionWithBinding = IFormDefinition & {
  workflow_definition_id?: string;
  workflow_mode?: 'simple' | 'advanced' | 'none';
};

// ── Re-exports for convenience ─────────────────────────────────────────────

export type { IFormTemplate, ISmartField, IWorkflowConfig, IApprovalConfig };
