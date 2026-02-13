import { FormSubmission, IFormSubmissionDocument } from '../../core/entities/FormSubmission';
import { ITimelineEvent } from '../../core/types/smart-forms.types';
import { IFormSubmissionTimelineService } from './interfaces/IFormSubmissionTimelineService';
import ApiError from '../../utils/ApiError';
import logger from '../../utils/logger';

export class FormSubmissionTimelineService implements IFormSubmissionTimelineService {
  async addTimelineEvent(
    submissionId: string,
    eventType: string,
    title: string,
    titleAr: string,
    userId: string,
    userName: string,
    metadata?: Record<string, unknown>
  ): Promise<IFormSubmissionDocument | null> {
    const submission = await FormSubmission.findBySubmissionId(submissionId);
    if (!submission) {
      throw new ApiError(404, 'Submission not found');
    }

    submission.addTimelineEvent(eventType, title, titleAr, userId, userName, metadata);
    await submission.save();

    logger.info(`Timeline event added to submission ${submissionId}: ${eventType}`);
    return submission;
  }

  async getTimeline(submissionId: string): Promise<ITimelineEvent[]> {
    const submission = await FormSubmission.findBySubmissionId(submissionId);
    if (!submission) {
      throw new ApiError(404, 'Submission not found');
    }

    return submission.timeline || [];
  }

  async removeTimelineEvent(
    submissionId: string,
    eventId: string
  ): Promise<IFormSubmissionDocument | null> {
    const submission = await FormSubmission.findBySubmissionId(submissionId);
    if (!submission) {
      throw new ApiError(404, 'Submission not found');
    }

    if (!submission.timeline) {
      throw new ApiError(400, 'No timeline events found');
    }

    const eventIndex = submission.timeline.findIndex(e => (e as any)._id?.toString() === eventId);
    if (eventIndex === -1) {
      throw new ApiError(404, 'Timeline event not found');
    }

    submission.timeline.splice(eventIndex, 1);
    await submission.save();

    logger.info(`Timeline event ${eventId} removed from submission ${submissionId}`);
    return submission;
  }

  async getLastEvent(submissionId: string): Promise<ITimelineEvent | null> {
    const submission = await FormSubmission.findBySubmissionId(submissionId);
    if (!submission) {
      throw new ApiError(404, 'Submission not found');
    }

    if (!submission.timeline || submission.timeline.length === 0) {
      return null;
    }

    return submission.timeline[submission.timeline.length - 1];
  }

  async getEventsByType(submissionId: string, eventType: string): Promise<ITimelineEvent[]> {
    const submission = await FormSubmission.findBySubmissionId(submissionId);
    if (!submission) {
      throw new ApiError(404, 'Submission not found');
    }

    if (!submission.timeline) {
      return [];
    }

    return submission.timeline.filter(e => e.type === eventType);
  }
}
