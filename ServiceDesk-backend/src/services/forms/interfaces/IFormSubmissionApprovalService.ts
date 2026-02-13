import { IFormSubmissionDocument } from '../../../core/entities/FormSubmission';

export interface ApprovalAction {
  approver_id: string;
  approver_name: string;
  action: 'approved' | 'rejected' | 'requested_changes';
  comment?: string;
  timestamp: Date;
}

export interface IFormSubmissionApprovalService {
  /**
   * الموافقة على التقديم
   */
  approveSubmission(
    submissionId: string,
    approverId: string,
    approverName: string,
    comment?: string
  ): Promise<IFormSubmissionDocument | null>;

  /**
   * رفض التقديم
   */
  rejectSubmission(
    submissionId: string,
    approverId: string,
    approverName: string,
    reason: string
  ): Promise<IFormSubmissionDocument | null>;

  /**
   * طلب تعديلات
   */
  requestChanges(
    submissionId: string,
    approverId: string,
    approverName: string,
    changes: string
  ): Promise<IFormSubmissionDocument | null>;

  /**
   * الحصول على سجل الموافقات
   */
  getApprovalHistory(
    submissionId: string
  ): Promise<ApprovalAction[]>;

  /**
   * التحقق من حالة الموافقة
   */
  isApprovalRequired(
    submissionId: string
  ): Promise<boolean>;

  /**
   * الحصول على الموافقين المتبقيين
   */
  getPendingApprovers(
    submissionId: string
  ): Promise<Array<{ id: string; name: string }>>;
}
