import { FormSubmission, IFormSubmissionDocument } from '../../core/entities/FormSubmission';
import { ISmartField, SubmissionStatus } from '../../core/types/smart-forms.types';
import { FormSubmissionValidationService } from './FormSubmissionValidationService';
import { FormSubmissionTimelineService } from './FormSubmissionTimelineService';
import { FormSubmissionCommentService } from './FormSubmissionCommentService';
import ApiError from '../../utils/ApiError';
import logger from '../../utils/logger';

export interface CreateSubmissionDTO {
  form_template_id: string;
  data: Record<string, unknown>;
  attachments?: any[];
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
  attachments?: any[];
  updated_by: string;
}

export class FormSubmissionService {
  private validationService: FormSubmissionValidationService;
  private timelineService: FormSubmissionTimelineService;
  private commentService: FormSubmissionCommentService;

  constructor() {
    this.validationService = new FormSubmissionValidationService();
    this.timelineService = new FormSubmissionTimelineService();
    this.commentService = new FormSubmissionCommentService();
  }

  async createSubmission(dto: CreateSubmissionDTO): Promise<IFormSubmissionDocument> {
    const submission = new FormSubmission({
      form_template_id: dto.form_template_id,
      form_version: 1,
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

    await submission.save();

    await this.timelineService.addTimelineEvent(
      submission.submission_id,
      dto.is_draft ? 'draft_created' : 'submitted',
      dto.is_draft ? 'Draft created' : 'Form submitted',
      dto.is_draft ? 'تم إنشاء المسودة' : 'تم تقديم النموذج',
      dto.submitted_by.user_id,
      dto.submitted_by.name
    );

    logger.info(`Submission created: ${submission.submission_id} by user ${dto.submitted_by.user_id}`);
    return submission;
  }

  async getSubmission(submissionId: string): Promise<IFormSubmissionDocument | null> {
    return FormSubmission.findBySubmissionId(submissionId);
  }

  async updateSubmission(
    submissionId: string,
    dto: UpdateSubmissionDTO
  ): Promise<IFormSubmissionDocument | null> {
    const submission = await FormSubmission.findBySubmissionId(submissionId);
    if (!submission) {
      throw new ApiError(404, 'Submission not found');
    }

    if (![SubmissionStatus.DRAFT, SubmissionStatus.SUBMITTED].includes(submission.workflow_state.status)) {
      throw new ApiError(400, 'Submission cannot be modified in current status');
    }

    if (dto.data) {
      submission.data = { ...submission.data, ...dto.data };
    }

    if (dto.attachments) {
      submission.attachments = [...submission.attachments, ...dto.attachments];
    }

    await submission.save();

    await this.timelineService.addTimelineEvent(
      submissionId,
      'updated',
      'Submission updated',
      'تم تحديث التقديم',
      dto.updated_by,
      'System'
    );

    logger.info(`Submission ${submissionId} updated by user ${dto.updated_by}`);
    return submission;
  }

  async deleteSubmission(submissionId: string): Promise<boolean> {
    const submission = await FormSubmission.findBySubmissionId(submissionId);
    if (!submission) {
      throw new ApiError(404, 'Submission not found');
    }

    await FormSubmission.deleteOne({ submission_id: submissionId });
    logger.info(`Submission ${submissionId} deleted`);
    return true;
  }

  async listSubmissions(
    formTemplateId?: string,
    limit: number = 50,
    skip: number = 0
  ): Promise<IFormSubmissionDocument[]> {
    const query = formTemplateId ? { form_template_id: formTemplateId } : {};
    return FormSubmission.find(query).limit(limit).skip(skip);
  }

  async validateSubmissionData(
    fields: ISmartField[],
    data: Record<string, unknown>
  ): Promise<{ valid: boolean; errors: any[] }> {
    return this.validationService.validateSubmissionData(fields, data);
  }

  async addComment(
    submissionId: string,
    text: string,
    userId: string,
    userName: string,
    isInternal?: boolean
  ): Promise<IFormSubmissionDocument | null> {
    return this.commentService.addComment(submissionId, text, userId, userName, isInternal);
  }

  async updateComment(
    submissionId: string,
    commentId: string,
    text: string,
    userId: string
  ): Promise<IFormSubmissionDocument | null> {
    return this.commentService.updateComment(submissionId, commentId, text, userId);
  }

  async deleteComment(
    submissionId: string,
    commentId: string,
    userId: string
  ): Promise<IFormSubmissionDocument | null> {
    return this.commentService.deleteComment(submissionId, commentId, userId);
  }

  async getComments(submissionId: string, includeInternal?: boolean): Promise<any[]> {
    return this.commentService.getComments(submissionId, includeInternal);
  }

  async addTimelineEvent(
    submissionId: string,
    eventType: string,
    title: string,
    titleAr: string,
    userId: string,
    userName: string,
    metadata?: Record<string, unknown>
  ): Promise<IFormSubmissionDocument | null> {
    return this.timelineService.addTimelineEvent(
      submissionId,
      eventType,
      title,
      titleAr,
      userId,
      userName,
      metadata
    );
  }

  async getTimeline(submissionId: string): Promise<any[]> {
    return this.timelineService.getTimeline(submissionId);
  }

  async getLastEvent(submissionId: string): Promise<any> {
    return this.timelineService.getLastEvent(submissionId);
  }
}

export const formSubmissionService = new FormSubmissionService();
