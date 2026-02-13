/**
 * Form Service Interface
 */

import {
  CreateFormTemplateDTO,
  UpdateFormTemplateDTO,
  FormTemplateDTO,
  CreateFormSubmissionDTO,
  UpdateFormSubmissionDTO,
  FormSubmissionDTO,
  FormSubmissionListDTO,
  ApproveSubmissionDTO,
  RejectSubmissionDTO,
} from '../../dtos/forms';

export interface IFormService {
  // Template operations
  createTemplate(dto: CreateFormTemplateDTO): Promise<FormTemplateDTO>;
  getTemplate(id: string): Promise<FormTemplateDTO>;
  updateTemplate(id: string, dto: UpdateFormTemplateDTO): Promise<FormTemplateDTO>;
  deleteTemplate(id: string): Promise<void>;
  listTemplates(filter: FormFilterDTO): Promise<FormTemplateDTO[]>;
  publishTemplate(id: string): Promise<FormTemplateDTO>;
  archiveTemplate(id: string): Promise<FormTemplateDTO>;

  // Submission operations
  submitForm(dto: CreateFormSubmissionDTO): Promise<FormSubmissionDTO>;
  getSubmission(id: string): Promise<FormSubmissionDTO>;
  updateSubmission(id: string, dto: UpdateFormSubmissionDTO): Promise<FormSubmissionDTO>;
  deleteSubmission(id: string): Promise<void>;
  listSubmissions(filter: SubmissionFilterDTO): Promise<FormSubmissionListDTO>;
  saveDraft(dto: CreateFormSubmissionDTO): Promise<FormSubmissionDTO>;

  // Approval operations
  approveSubmission(dto: ApproveSubmissionDTO): Promise<FormSubmissionDTO>;
  rejectSubmission(dto: RejectSubmissionDTO): Promise<FormSubmissionDTO>;
  getApprovalHistory(submissionId: string): Promise<unknown[]>;
}

export interface FormFilterDTO {
  category?: string;
  status?: string;
  createdBy?: string;
  page?: number;
  limit?: number;
}

export interface SubmissionFilterDTO {
  formTemplateId?: string;
  status?: string;
  submittedBy?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}
