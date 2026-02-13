/**
 * Form Submission CRUD Service
 * Handles Create, Read, Update operations for form submissions
 */

import { FormSubmission, IFormSubmissionDocument } from '../../core/entities/FormSubmission';
import { FormTemplate } from '../../core/entities/FormTemplate';
import { ValidationEngine } from '../../core/engines/ValidationEngine';
import { SubmissionStatus, IAttachment } from '../../core/types/smart-forms.types';

export interface CreateSubmissionDTO {
  form_template_id: string;
  data: Record<string, unknown>;
  attachments?: Array<Record<string, unknown>>;
  signature?: {
    data: string;
    ip_address: string;
  };
  geolocation?: {
    latitude: number;
    longitude: number;
    accuracy: number;
  };
  is_draft?: boolean;
  submitted_by: {
    user_id: string;
    name: string;
    email: string;
    department?: string;
    site_id?: string;
  };
  site_id?: string;
}

export interface UpdateSubmissionDTO {
  data?: Record<string, unknown>;
  attachments?: Array<Record<string, unknown>>;
  updated_by: string;
}

export interface SubmissionListOptions {
  page?: number;
  limit?: number;
  status?: SubmissionStatus;
  form_template_id?: string;
  submitted_by?: string;
  assigned_to?: string;
  site_id?: string;
  from_date?: Date;
  to_date?: Date;
  search?: string;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
}

export interface SubmissionListResult {
  submissions: IFormSubmissionDocument[];
  total: number;
  page: number;
  limit: number;
  total_pages: number;
}

export class FormSubmissionCrudService {
  private validationEngine: ValidationEngine;

  constructor() {
    this.validationEngine = new ValidationEngine();
  }

  /**
   * Create a new form submission
   */
  async createSubmission(dto: CreateSubmissionDTO): Promise<IFormSubmissionDocument> {
    // Get template
    const template = await FormTemplate.findById(dto.form_template_id);
    if (!template) {
      throw new Error('Form template not found');
    }

    if (!template.is_published) {
      throw new Error('Form template is not published');
    }

    // Validate data if not draft
    if (!dto.is_draft) {
      const validationResult = this.validationEngine.validateForm(
        template.fields,
        dto.data,
        { formData: dto.data, user: dto.submitted_by, locale: 'en' }
      );

      if (!validationResult.valid) {
        throw new Error(`Validation failed: ${validationResult.errors.map(e => e.message).join(', ')}`);
      }
    }

    // Create submission
    const submission = new FormSubmission({
      form_template_id: template._id,
      form_version: template.version,
      submitted_by: dto.submitted_by,
      data: dto.data,
      attachments: dto.attachments || [],
      signature: dto.signature ? {
        ...dto.signature,
        signed_at: new Date(),
      } : undefined,
      geolocation: dto.geolocation ? {
        ...dto.geolocation,
        captured_at: new Date(),
      } : undefined,
      workflow_state: {
        current_step_id: '',
        status: dto.is_draft ? SubmissionStatus.DRAFT : SubmissionStatus.SUBMITTED,
        approvals: [],
      },
      timeline: [],
      comments: [],
      site_id: dto.site_id || dto.submitted_by.site_id,
    });

    // Add timeline event
    submission.addTimelineEvent(
      dto.is_draft ? 'draft_created' : 'submitted',
      dto.is_draft ? 'Draft created' : 'Form submitted',
      dto.is_draft ? 'تم إنشاء المسودة' : 'تم تقديم النموذج',
      dto.submitted_by.user_id,
      dto.submitted_by.name
    );

    await submission.save();
    return submission;
  }

  /**
   * Update a submission
   */
  async updateSubmission(
    submissionId: string,
    dto: UpdateSubmissionDTO
  ): Promise<IFormSubmissionDocument | null> {
    const submission = await FormSubmission.findBySubmissionId(submissionId);
    if (!submission) {
      throw new Error('Submission not found');
    }

    // Check if submission can be modified
    if (![SubmissionStatus.DRAFT, SubmissionStatus.SUBMITTED].includes(submission.workflow_state.status)) {
      throw new Error('Submission cannot be modified in current status');
    }

    // Update data
    if (dto.data) {
      submission.data = { ...submission.data, ...dto.data };
    }

    if (dto.attachments) {
      const mappedAttachments: IAttachment[] = dto.attachments.map((att: Record<string, unknown>) => ({
        attachment_id: (att.id || att.attachment_id) as string,
        file_name: att.file_name as string,
        file_type: att.file_type as string,
        file_size: att.file_size as number,
        file_url: att.file_url as string,
        uploaded_by: (att.uploaded_by as string) || dto.updated_by,
        uploaded_at: att.uploaded_at ? new Date(att.uploaded_at as string) : new Date(),
      }));
      submission.attachments = [...submission.attachments, ...mappedAttachments];
    }

    // Add timeline event
    submission.addTimelineEvent(
      'updated',
      'Submission updated',
      'تم تحديث التقديم',
      dto.updated_by
    );

    await submission.save();
    return submission;
  }

  /**
   * Get submission by ID
   */
  async getSubmission(submissionId: string): Promise<IFormSubmissionDocument | null> {
    return FormSubmission.findBySubmissionId(submissionId);
  }

  /**
   * List submissions with filtering and pagination
   */
  async listSubmissions(options: SubmissionListOptions): Promise<SubmissionListResult> {
    const page = options.page || 1;
    const limit = options.limit || 20;
    const skip = (page - 1) * limit;

    const query: Record<string, unknown> = {};

    if (options.status) {
      if (!query.workflow_state) query.workflow_state = {};
      (query.workflow_state as Record<string, unknown>).status = options.status;
    }
    if (options.form_template_id) query.form_template_id = options.form_template_id;
    if (options.submitted_by) {
      if (!query.submitted_by) query.submitted_by = {};
      (query.submitted_by as Record<string, unknown>).user_id = options.submitted_by;
    }
    if (options.assigned_to) {
      if (!query.workflow_state) query.workflow_state = {};
      (query.workflow_state as Record<string, unknown>).assigned_to = options.assigned_to;
    }
    if (options.site_id) query.site_id = options.site_id;

    if (options.from_date || options.to_date) {
      query.created_at = {};
      const dateQuery = query.created_at as Record<string, unknown>;
      if (options.from_date) dateQuery.$gte = options.from_date;
      if (options.to_date) dateQuery.$lte = options.to_date;
    }

    if (options.search) {
      query.$text = { $search: options.search };
    }

    const [submissions, total] = await Promise.all([
      FormSubmission.find(query)
        .sort({ [options.sort_by || 'created_at']: options.sort_order === 'asc' ? 1 : -1 })
        .skip(skip)
        .limit(limit),
      FormSubmission.countDocuments(query),
    ]);

    return {
      submissions,
      total,
      page,
      limit,
      total_pages: Math.ceil(total / limit),
    };
  }

  /**
   * Delete a submission
   */
  async deleteSubmission(submissionId: string): Promise<boolean> {
    const result = await FormSubmission.deleteOne({ _id: submissionId });
    return result.deletedCount > 0;
  }
}

export default new FormSubmissionCrudService();
