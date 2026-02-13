import { Response } from 'express';
import logger from '../../utils/logger';
import { validationResult } from 'express-validator';
import mongoose from 'mongoose';
import Comment from '../../models/pm/Comment';
import Task from '../../models/pm/Task';
import Activity from '../../models/pm/Activity';
import { PMAuthRequest, ApiResponse } from '../../types/pm';

export const createComment = async (req: PMAuthRequest, res: Response): Promise<void> => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({
        success: false,
        errors: errors.array().map((e: { type?: string; msg: string }) => ({ field: e.type, message: e.msg })),
      } as ApiResponse);
      return;
    }

    const userId = req.user?.id;
    const { taskId } = req.params;
    const { content, parentId } = req.body;

    const task = await Task.findById(taskId);
    if (!task) {
      res.status(404).json({ success: false, error: 'Task not found' } as ApiResponse);
      return;
    }

    const organizationId = req.user?.organizationId || task.organizationId;

    // Extract mentions from content (@username pattern)
    const mentionRegex = /@\[([^\]]+)\]\(([^)]+)\)/g;
    const mentions: mongoose.Types.ObjectId[] = [];
    let match;
    while ((match = mentionRegex.exec(content)) !== null) {
      mentions.push(new mongoose.Types.ObjectId(match[2]));
    }

    const comment = new Comment({
      taskId,
      projectId: task.projectId,
      organizationId,
      content,
      author: userId,
      mentions,
      parentId,
    });

    await comment.save();

    // Log activity
    await Activity.create({
      organizationId,
      projectId: task.projectId,
      taskId,
      type: 'comment_added',
      actor: userId,
      description: `Added a comment on ${task.key}`,
      metadata: { commentId: comment._id },
    });

    const populatedComment = await Comment.findById(comment._id)
      .populate('author', 'profile.firstName profile.lastName profile.avatar email');

    res.status(201).json({
      success: true,
      data: { comment: populatedComment },
      message: 'Comment added successfully',
    } as ApiResponse);
  } catch (error) {
    logger.error('Create comment error:', error);
    res.status(500).json({ success: false, error: 'Failed to create comment' } as ApiResponse);
  }
};

export const getComments = async (req: PMAuthRequest, res: Response): Promise<void> => {
  try {
    const { taskId } = req.params;

    const comments = await Comment.find({ taskId, parentId: { $exists: false } })
      .populate('author', 'profile.firstName profile.lastName profile.avatar email')
      .sort({ createdAt: -1 });

    // Get replies for each comment
    const commentsWithReplies = await Promise.all(
      comments.map(async (comment) => {
        const replies = await Comment.find({ parentId: comment._id })
          .populate('author', 'profile.firstName profile.lastName profile.avatar email')
          .sort({ createdAt: 1 });
        return { ...comment.toJSON(), replies };
      })
    );

    res.status(200).json({
      success: true,
      data: { comments: commentsWithReplies },
    } as ApiResponse);
  } catch (error) {
    logger.error('Get comments error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch comments' } as ApiResponse);
  }
};

export const updateComment = async (req: PMAuthRequest, res: Response): Promise<void> => {
  try {
    const { commentId } = req.params;
    const { content } = req.body;
    const userId = req.user?.id;

    const comment = await Comment.findById(commentId);
    if (!comment) {
      res.status(404).json({ success: false, error: 'Comment not found' } as ApiResponse);
      return;
    }

    if (comment.author.toString() !== userId) {
      res.status(403).json({ success: false, error: 'Not authorized to edit this comment' } as ApiResponse);
      return;
    }

    comment.content = content;
    comment.isEdited = true;
    comment.editedAt = new Date();
    await comment.save();

    const updatedComment = await Comment.findById(commentId)
      .populate('author', 'profile.firstName profile.lastName profile.avatar email');

    res.status(200).json({
      success: true,
      data: { comment: updatedComment },
      message: 'Comment updated successfully',
    } as ApiResponse);
  } catch (error) {
    logger.error('Update comment error:', error);
    res.status(500).json({ success: false, error: 'Failed to update comment' } as ApiResponse);
  }
};

export const deleteComment = async (req: PMAuthRequest, res: Response): Promise<void> => {
  try {
    const { commentId } = req.params;
    const userId = req.user?.id;

    const comment = await Comment.findById(commentId);
    if (!comment) {
      res.status(404).json({ success: false, error: 'Comment not found' } as ApiResponse);
      return;
    }

    if (comment.author.toString() !== userId) {
      res.status(403).json({ success: false, error: 'Not authorized to delete this comment' } as ApiResponse);
      return;
    }

    // Delete replies too
    await Comment.deleteMany({ parentId: commentId });
    await Comment.findByIdAndDelete(commentId);

    res.status(200).json({
      success: true,
      message: 'Comment deleted successfully',
    } as ApiResponse);
  } catch (error) {
    logger.error('Delete comment error:', error);
    res.status(500).json({ success: false, error: 'Failed to delete comment' } as ApiResponse);
  }
};

export const addReaction = async (req: PMAuthRequest, res: Response): Promise<void> => {
  try {
    const { commentId } = req.params;
    const { emoji } = req.body;
    const userId = req.user?.id;

    const comment = await Comment.findById(commentId);
    if (!comment) {
      res.status(404).json({ success: false, error: 'Comment not found' } as ApiResponse);
      return;
    }

    const existingReaction = comment.reactions.find((r) => r.emoji === emoji);
    if (existingReaction) {
      const userIndex = existingReaction.users.findIndex((u) => u.toString() === userId);
      if (userIndex > -1) {
        existingReaction.users.splice(userIndex, 1);
        if (existingReaction.users.length === 0) {
          comment.reactions = comment.reactions.filter((r) => r.emoji !== emoji);
        }
      } else {
        existingReaction.users.push(new mongoose.Types.ObjectId(userId));
      }
    } else {
      comment.reactions.push({ emoji, users: [new mongoose.Types.ObjectId(userId)] });
    }

    await comment.save();

    res.status(200).json({
      success: true,
      data: { reactions: comment.reactions },
    } as ApiResponse);
  } catch (error) {
    logger.error('Add reaction error:', error);
    res.status(500).json({ success: false, error: 'Failed to add reaction' } as ApiResponse);
  }
};
