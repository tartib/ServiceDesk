import { IFormSubmissionDocument } from '../../../core/entities/FormSubmission';
import { ITimelineEvent } from '../../../core/types/smart-forms.types';

export interface IFormSubmissionTimelineService {
  /**
   * إضافة حدث للجدول الزمني
   */
  addTimelineEvent(
    submissionId: string,
    eventType: string,
    title: string,
    titleAr: string,
    userId: string,
    userName: string,
    metadata?: Record<string, unknown>
  ): Promise<IFormSubmissionDocument | null>;

  /**
   * الحصول على الجدول الزمني
   */
  getTimeline(
    submissionId: string
  ): Promise<ITimelineEvent[]>;

  /**
   * حذف حدث من الجدول الزمني
   */
  removeTimelineEvent(
    submissionId: string,
    eventId: string
  ): Promise<IFormSubmissionDocument | null>;

  /**
   * الحصول على آخر حدث
   */
  getLastEvent(
    submissionId: string
  ): Promise<ITimelineEvent | null>;

  /**
   * تصفية الأحداث حسب النوع
   */
  getEventsByType(
    submissionId: string,
    eventType: string
  ): Promise<ITimelineEvent[]>;
}
