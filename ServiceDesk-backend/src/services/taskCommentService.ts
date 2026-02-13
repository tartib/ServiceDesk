import TaskComment, { ITaskComment } from '../models/TaskComment';
import TaskExecutionLog from '../models/TaskExecutionLog';
import ApiError from '../utils/ApiError';
import logger from '../utils/logger';

/**
 * إضافة تعليق على مهمة
 */
export const addComment = async (
  taskId: string,
  userId: string,
  userName: string,
  comment: string,
  attachments?: string[]
): Promise<ITaskComment> => {
  const newComment = await TaskComment.create({
    taskId,
    userId,
    userName,
    comment,
    attachments: attachments || [],
  });

  // تسجيل في سجل التنفيذ
  await TaskExecutionLog.create({
    taskId,
    userId,
    userName,
    action: 'commented',
    details: `أضاف تعليق: ${comment.substring(0, 50)}${comment.length > 50 ? '...' : ''}`,
  });

  logger.info(`Comment added to task ${taskId} by user ${userName}`);

  return newComment;
};

/**
 * جلب جميع التعليقات لمهمة معينة
 */
export const getTaskComments = async (taskId: string): Promise<ITaskComment[]> => {
  const comments = await TaskComment.find({ taskId })
    .populate('userId', 'name email')
    .sort({ createdAt: -1 });

  return comments;
};

/**
 * تحديث تعليق
 */
export const updateComment = async (
  commentId: string,
  userId: string,
  newComment: string
): Promise<ITaskComment> => {
  const comment = await TaskComment.findById(commentId);

  if (!comment) {
    throw new ApiError(404, 'Comment not found');
  }

  if (comment.userId.toString() !== userId) {
    throw new ApiError(403, 'You can only edit your own comments');
  }

  comment.comment = newComment;
  await comment.save();

  logger.info(`Comment ${commentId} updated by user ${userId}`);

  return comment;
};

/**
 * حذف تعليق
 */
export const deleteComment = async (commentId: string, userId: string): Promise<void> => {
  const comment = await TaskComment.findById(commentId);

  if (!comment) {
    throw new ApiError(404, 'Comment not found');
  }

  if (comment.userId.toString() !== userId) {
    throw new ApiError(403, 'You can only delete your own comments');
  }

  await TaskComment.findByIdAndDelete(commentId);

  logger.info(`Comment ${commentId} deleted by user ${userId}`);
};

/**
 * جلب عدد التعليقات لمهمة
 */
export const getCommentCount = async (taskId: string): Promise<number> => {
  return await TaskComment.countDocuments({ taskId });
};

logger.info('Task comment service initialized');
