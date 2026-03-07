/**
 * Forms Module — Domain Layer
 *
 * Service-only module. Domain interfaces define what the forms services expose.
 * Models live in core/entities/ (shared Mongoose models).
 */

export interface IFormFieldService {
  getFields(formId: string): Promise<any[]>;
  updateField(formId: string, fieldId: string, data: any): Promise<any>;
  reorderFields(formId: string, fieldIds: string[]): Promise<void>;
}

export interface IFormRuleService {
  getRules(formId: string): Promise<any[]>;
  evaluateRules(formId: string, data: Record<string, any>): Promise<any>;
}

export interface IFormWorkflowService {
  getWorkflow(formId: string): Promise<any>;
  setWorkflow(formId: string, workflowId: string): Promise<any>;
}

export interface IFormAccessService {
  getAccess(formId: string): Promise<any>;
  setAccess(formId: string, access: any): Promise<any>;
}

export interface IFormSubmissionService {
  submit(formId: string, data: Record<string, any>, userId: string): Promise<any>;
  getSubmission(submissionId: string): Promise<any>;
  listSubmissions(formId: string, pagination?: any): Promise<any>;
}
