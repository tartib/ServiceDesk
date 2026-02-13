import { FormSubmission, IFormSubmissionDocument } from '../../core/entities/FormSubmission';
import { IComment } from '../../core/types/smart-forms.types';
import { IFormSubmissionCommentService } from './interfaces/IFormSubmissionCommentService';
import ApiError from '../../utils/ApiError';
import logger from '../../utils/logger';

export class FormSubmissionCommentService implements IFormSubmissionCommentService {
  async addComment(
    submissionId: string,
    text: string,
    userId: string,
    userName: string,
    isInternal?: boolean
  ): Promise<IFormSubmissionDocument | null> {
    const submission = await FormSubmission.findBySubmissionId(submissionId);
    if (!submission) {
      throw new ApiError(404, 'Submission not found');
    }

    const comment: IComment = {
      comment_id: `comment_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      content: text,
      user_id: userId,
      user_name: userName,
      created_at: new Date(),
      is_internal: isInternal || false,
    };

    if (!submission.comments) {
      submission.comments = [];
    }

    submission.comments.push(comment);
    await submission.save();

    logger.info(`Comment added to submission ${submissionId} by user ${userId}`);
    return submission;
  }

  async updateComment(
    submissionId: string,
    commentId: string,
    text: string,
    userId: string
  ): Promise<IFormSubmissionDocument | null> {
    const submission = await FormSubmission.findBySubmissionId(submissionId);
    if (!submission) {
      throw new ApiError(404, 'Submission not found');
    }

    if (!submission.comments) {
      throw new ApiError(400, 'No comments found');
    }

    const comment = submission.comments.find(c => c.comment_id === commentId);
    if (!comment) {
      throw new ApiError(404, 'Comment not found');
    }

    if (comment.user_id !== userId) {
      throw new ApiError(403, 'You can only edit your own comments');
    }

    comment.content = text;
    comment.updated_at = new Date();
    await submission.save();

    logger.info(`Comment ${commentId} updated in submission ${submissionId}`);
    return submission;
  }

  async deleteComment(
    submissionId: string,
    commentId: string,
    userId: string
  ): Promise<IFormSubmissionDocument | null> {
    const submission = await FormSubmission.findBySubmissionId(submissionId);
    if (!submission) {
      throw new ApiError(404, 'Submission not found');
    }

    if (!submission.comments) {
      throw new ApiError(400, 'No comments found');
    }

    const commentIndex = submission.comments.findIndex(c => c.comment_id === commentId);
    if (commentIndex === -1) {
      throw new ApiError(404, 'Comment not found');
    }

    const comment = submission.comments[commentIndex];
    if (comment.user_id !== userId) {
      throw new ApiError(403, 'You can only delete your own comments');
    }

    submission.comments.splice(commentIndex, 1);
    await submission.save();

    logger.info(`Comment ${commentId} deleted from submission ${submissionId}`);
    return submission;
  }

  async getComments(submissionId: string, includeInternal?: boolean): Promise<IComment[]> {
    const submission = await FormSubmission.findBySubmissionId(submissionId);
    if (!submission) {
      throw new ApiError(404, 'Submission not found');
    }

    if (!submission.comments) {
      return [];
    }

    if (includeInternal) {
      return submission.comments;
    }

    return submission.comments.filter(c => !c.is_internal);
  }

  async getCommentCount(submissionId: string): Promise<number> {
    const submission = await FormSubmission.findBySubmissionId(submissionId);
    if (!submission) {
      throw new ApiError(404, 'Submission not found');
    }

    return submission.comments ? submission.comments.length : 0;
  }

  async getLastComment(submissionId: string): Promise<IComment | null> {
    const submission = await FormSubmission.findBySubmissionId(submissionId);
    if (!submission) {
      throw new ApiError(404, 'Submission not found');
    }

    if (!submission.comments || submission.comments.length === 0) {
      return null;
    }

    return submission.comments[submission.comments.length - 1];
  }
}
