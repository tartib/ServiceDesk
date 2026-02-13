import { IFormSubmissionDocument } from '../../../core/entities/FormSubmission';
import { IComment } from '../../../core/types/smart-forms.types';

export interface IFormSubmissionCommentService {
  /**
   * إضافة تعليق
   */
  addComment(
    submissionId: string,
    text: string,
    userId: string,
    userName: string,
    isInternal?: boolean
  ): Promise<IFormSubmissionDocument | null>;

  /**
   * تحديث تعليق
   */
  updateComment(
    submissionId: string,
    commentId: string,
    text: string,
    userId: string
  ): Promise<IFormSubmissionDocument | null>;

  /**
   * حذف تعليق
   */
  deleteComment(
    submissionId: string,
    commentId: string,
    userId: string
  ): Promise<IFormSubmissionDocument | null>;

  /**
   * الحصول على التعليقات
   */
  getComments(
    submissionId: string,
    includeInternal?: boolean
  ): Promise<IComment[]>;

  /**
   * الحصول على عدد التعليقات
   */
  getCommentCount(
    submissionId: string
  ): Promise<number>;

  /**
   * الحصول على آخر تعليق
   */
  getLastComment(
    submissionId: string
  ): Promise<IComment | null>;
}
