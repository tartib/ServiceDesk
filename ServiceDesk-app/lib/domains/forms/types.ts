/**
 * Forms Platform — Canonical Frontend Types
 *
 * FormDefinition is the platform-owned type for form authoring.
 * It re-exports the existing smart-forms types for backward compatibility
 * while establishing a canonical platform vocabulary.
 */

export type {
  SmartField,
  SmartFieldType,
  FieldOption,
  FieldValidation,
  FieldDisplay,
  ConditionalRule,
  WorkflowConfig,
  WorkflowStep,
  FormSettings,
  FormAccess,
  SubmissionStatus,
  FormLayoutType,
  Condition,
  ConditionGroup,
  ConditionalAction,
  WorkflowAction,
  WorkflowTransition,
  FormSection,
} from '@/types/smart-forms';

import type { FormTemplate, FormSubmission, SmartField, FormSettings, FormAccess } from '@/types/smart-forms';

/** Platform alias for FormTemplate */
export type FormDefinition = FormTemplate;

/** Platform alias for FormSubmission — submissions are records in the platform model */
export type FormRecord = FormSubmission;

/** Canonical DTO for creating a form definition */
export interface CreateFormDefinitionDTO {
  name: string;
  name_ar?: string;
  description?: string;
  description_ar?: string;
  category: string;
  icon?: string;
}

/** Canonical DTO for updating a form definition */
export interface UpdateFormDefinitionDTO {
  name?: string;
  name_ar?: string;
  description?: string;
  description_ar?: string;
  category?: string;
  icon?: string;
  fields?: import('@/types/smart-forms').SmartField[];
  settings?: Partial<import('@/types/smart-forms').FormSettings>;
  access?: Partial<import('@/types/smart-forms').FormAccess>;
}

/** Parameters for listing form definitions */
export interface FormDefinitionListParams {
  page?: number;
  limit?: number;
  category?: string;
  is_published?: boolean;
  search?: string;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
}

/** Normalized form definition as seen by platform consumers */
export interface FormDefinitionSummary {
  id: string;
  name: string;
  name_ar?: string;
  description?: string;
  category: string;
  icon?: string;
  isPublished: boolean;
  fieldCount: number;
  createdAt: string;
  updatedAt: string;
}
