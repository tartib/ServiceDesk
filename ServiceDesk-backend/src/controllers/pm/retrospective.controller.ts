import { Response } from 'express';
import logger from '../../utils/logger';
import { validationResult } from 'express-validator';
import mongoose from 'mongoose';
import PMRetrospective, { IRetrospectiveNote, IActionItem } from '../../models/pm/Retrospective';
import Sprint from '../../models/pm/Sprint';
import Project from '../../models/pm/Project';
import { PMAuthRequest, ApiResponse } from '../../types/pm';
import {
  canCreateRetrospective,
  canAddRetrospectiveNote,
  canVoteOnRetrospective,
  canPublishRetrospective,
  canManageActionItems,
  canDeleteRetrospective,
} from '../../utils/pm/permissions';

// Create a new retrospective for a sprint
export const createRetrospective = async (req: PMAuthRequest, res: Response): Promise<void> => {
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
    const { sprintId } = req.params;
    const { maxVotesPerUser } = req.body;

    if (!userId) {
      res.status(401).json({
        success: false,
        error: 'Unauthorized',
      } as ApiResponse);
      return;
    }

    // Verify sprint exists
    const sprint = await Sprint.findById(sprintId);
    if (!sprint) {
      res.status(404).json({
        success: false,
        error: 'Sprint not found',
      } as ApiResponse);
      return;
    }

    // Check if retrospective already exists for this sprint
    const existingRetro = await PMRetrospective.findOne({ sprintId });
    if (existingRetro) {
      res.status(400).json({
        success: false,
        error: 'Retrospective already exists for this sprint',
      } as ApiResponse);
      return;
    }

    // Get project for organizationId and check permissions
    const project = await Project.findById(sprint.projectId);
    if (!project) {
      res.status(404).json({
        success: false,
        error: 'Project not found',
      } as ApiResponse);
      return;
    }

    // Check if user has permission to create retrospective
    if (!canCreateRetrospective(project.members , userId)) {
      res.status(403).json({
        success: false,
        error: 'You do not have permission to create retrospectives',
      } as ApiResponse);
      return;
    }

    const retrospective = new PMRetrospective({
      projectId: sprint.projectId,
      organizationId: project.organizationId,
      sprintId,
      status: 'draft',
      maxVotesPerUser: maxVotesPerUser || 3,
      notes: [],
      actionItems: [],
      createdBy: userId,
    });

    await retrospective.save();

    res.status(201).json({
      success: true,
      data: { retrospective },
      message: 'Retrospective created successfully',
    } as ApiResponse);
  } catch (error) {
    logger.error('Create retrospective error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create retrospective',
    } as ApiResponse);
  }
};

// Get retrospective by ID
export const getRetrospective = async (req: PMAuthRequest, res: Response): Promise<void> => {
  try {
    const { retrospectiveId } = req.params;

    const retrospective = await PMRetrospective.findById(retrospectiveId)
      .populate('createdBy', 'profile.firstName profile.lastName profile.avatar email')
      .populate('publishedBy', 'profile.firstName profile.lastName profile.avatar email')
      .populate('notes.createdBy', 'profile.firstName profile.lastName profile.avatar email')
      .populate('actionItems.owner', 'profile.firstName profile.lastName profile.avatar email');

    if (!retrospective) {
      res.status(404).json({
        success: false,
        error: 'Retrospective not found',
      } as ApiResponse);
      return;
    }

    res.status(200).json({
      success: true,
      data: { retrospective },
    } as ApiResponse);
  } catch (error) {
    logger.error('Get retrospective error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch retrospective',
    } as ApiResponse);
  }
};

// Get retrospective by sprint ID
export const getRetrospectiveBySprintId = async (req: PMAuthRequest, res: Response): Promise<void> => {
  try {
    const { sprintId } = req.params;

    const retrospective = await PMRetrospective.findOne({ sprintId })
      .populate('createdBy', 'profile.firstName profile.lastName profile.avatar email')
      .populate('publishedBy', 'profile.firstName profile.lastName profile.avatar email')
      .populate('notes.createdBy', 'profile.firstName profile.lastName profile.avatar email')
      .populate('actionItems.owner', 'profile.firstName profile.lastName profile.avatar email');

    if (!retrospective) {
      res.status(404).json({
        success: false,
        error: 'Retrospective not found for this sprint',
      } as ApiResponse);
      return;
    }

    res.status(200).json({
      success: true,
      data: { retrospective },
    } as ApiResponse);
  } catch (error) {
    logger.error('Get retrospective by sprint error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch retrospective',
    } as ApiResponse);
  }
};

// Get all retrospectives for a project
export const getProjectRetrospectives = async (req: PMAuthRequest, res: Response): Promise<void> => {
  try {
    const { projectId } = req.params;
    const { status } = req.query;

    const query: Record<string, unknown> = { projectId };
    if (status) query.status = status;

    const retrospectives = await PMRetrospective.find(query)
      .populate('sprintId', 'name number startDate endDate')
      .populate('createdBy', 'profile.firstName profile.lastName profile.avatar email')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: { retrospectives },
    } as ApiResponse);
  } catch (error) {
    logger.error('Get project retrospectives error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch retrospectives',
    } as ApiResponse);
  }
};

// Update retrospective settings
export const updateRetrospective = async (req: PMAuthRequest, res: Response): Promise<void> => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({
        success: false,
        errors: errors.array().map((e: { type?: string; msg: string }) => ({ field: e.type, message: e.msg })),
      } as ApiResponse);
      return;
    }

    const { retrospectiveId } = req.params;
    const { maxVotesPerUser, status } = req.body;

    const retrospective = await PMRetrospective.findById(retrospectiveId);
    if (!retrospective) {
      res.status(404).json({
        success: false,
        error: 'Retrospective not found',
      } as ApiResponse);
      return;
    }

    if (maxVotesPerUser !== undefined) retrospective.maxVotesPerUser = maxVotesPerUser;
    if (status) retrospective.status = status;

    await retrospective.save();

    res.status(200).json({
      success: true,
      data: { retrospective },
      message: 'Retrospective updated successfully',
    } as ApiResponse);
  } catch (error) {
    logger.error('Update retrospective error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update retrospective',
    } as ApiResponse);
  }
};

// Delete retrospective
export const deleteRetrospective = async (req: PMAuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    const { retrospectiveId } = req.params;

    if (!userId) {
      res.status(401).json({
        success: false,
        error: 'Unauthorized',
      } as ApiResponse);
      return;
    }

    const retrospective = await PMRetrospective.findById(retrospectiveId);
    if (!retrospective) {
      res.status(404).json({
        success: false,
        error: 'Retrospective not found',
      } as ApiResponse);
      return;
    }

    // Check permissions
    const project = await Project.findById(retrospective.projectId);
    if (!project) {
      res.status(404).json({
        success: false,
        error: 'Project not found',
      } as ApiResponse);
      return;
    }

    if (!canDeleteRetrospective(project.members, userId)) {
      res.status(403).json({
        success: false,
        error: 'You do not have permission to delete retrospectives',
      } as ApiResponse);
      return;
    }

    await PMRetrospective.findByIdAndDelete(retrospectiveId);

    res.status(200).json({
      success: true,
      message: 'Retrospective deleted successfully',
    } as ApiResponse);
  } catch (error) {
    logger.error('Delete retrospective error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete retrospective',
    } as ApiResponse);
  }
};

// ==================== STATUS MANAGEMENT ====================

// Start voting phase
export const startVoting = async (req: PMAuthRequest, res: Response): Promise<void> => {
  try {
    const { retrospectiveId } = req.params;

    const retrospective = await PMRetrospective.findById(retrospectiveId);
    if (!retrospective) {
      res.status(404).json({
        success: false,
        error: 'Retrospective not found',
      } as ApiResponse);
      return;
    }

    if (retrospective.status !== 'draft') {
      res.status(400).json({
        success: false,
        error: 'Voting can only be started from draft status',
      } as ApiResponse);
      return;
    }

    retrospective.status = 'voting';
    await retrospective.save();

    res.status(200).json({
      success: true,
      data: { retrospective },
      message: 'Voting phase started',
    } as ApiResponse);
  } catch (error) {
    logger.error('Start voting error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to start voting',
    } as ApiResponse);
  }
};

// Publish retrospective
export const publishRetrospective = async (req: PMAuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    const { retrospectiveId } = req.params;

    const retrospective = await PMRetrospective.findById(retrospectiveId);
    if (!retrospective) {
      res.status(404).json({
        success: false,
        error: 'Retrospective not found',
      } as ApiResponse);
      return;
    }

    // Check permissions
    const project = await Project.findById(retrospective.projectId);
    if (!project) {
      res.status(404).json({
        success: false,
        error: 'Project not found',
      } as ApiResponse);
      return;
    }

    if (!userId || !canPublishRetrospective(project.members, userId)) {
      res.status(403).json({
        success: false,
        error: 'You do not have permission to publish retrospectives',
      } as ApiResponse);
      return;
    }

    if (retrospective.status === 'published' || retrospective.status === 'archived') {
      res.status(400).json({
        success: false,
        error: 'Retrospective is already published or archived',
      } as ApiResponse);
      return;
    }

    retrospective.status = 'published';
    retrospective.publishedBy = new mongoose.Types.ObjectId(userId);
    retrospective.publishedAt = new Date();
    await retrospective.save();

    res.status(200).json({
      success: true,
      data: { retrospective },
      message: 'Retrospective published successfully',
    } as ApiResponse);
  } catch (error) {
    logger.error('Publish retrospective error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to publish retrospective',
    } as ApiResponse);
  }
};

// Archive retrospective
export const archiveRetrospective = async (req: PMAuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    const { retrospectiveId } = req.params;

    const retrospective = await PMRetrospective.findById(retrospectiveId);
    if (!retrospective) {
      res.status(404).json({
        success: false,
        error: 'Retrospective not found',
      } as ApiResponse);
      return;
    }

    // Check permissions
    const project = await Project.findById(retrospective.projectId);
    if (!project) {
      res.status(404).json({
        success: false,
        error: 'Project not found',
      } as ApiResponse);
      return;
    }

    if (!userId || !canPublishRetrospective(project.members, userId)) {
      res.status(403).json({
        success: false,
        error: 'You do not have permission to archive retrospectives',
      } as ApiResponse);
      return;
    }

    retrospective.status = 'archived';
    await retrospective.save();

    res.status(200).json({
      success: true,
      data: { retrospective },
      message: 'Retrospective archived successfully',
    } as ApiResponse);
  } catch (error) {
    logger.error('Archive retrospective error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to archive retrospective',
    } as ApiResponse);
  }
};

// ==================== NOTES MANAGEMENT ====================

// Add a note
export const addNote = async (req: PMAuthRequest, res: Response): Promise<void> => {
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
    const { retrospectiveId } = req.params;
    const { category, content } = req.body;

    if (!userId) {
      res.status(401).json({
        success: false,
        error: 'User not authenticated',
      } as ApiResponse);
      return;
    }

    const retrospective = await PMRetrospective.findById(retrospectiveId);
    if (!retrospective) {
      res.status(404).json({
        success: false,
        error: 'Retrospective not found',
      } as ApiResponse);
      return;
    }

    // Check permissions
    const project = await Project.findById(retrospective.projectId);
    if (!project) {
      res.status(404).json({
        success: false,
        error: 'Project not found',
      } as ApiResponse);
      return;
    }

    if (!canAddRetrospectiveNote(project.members, userId)) {
      res.status(403).json({
        success: false,
        error: 'You do not have permission to add notes',
      } as ApiResponse);
      return;
    }

    if (retrospective.status === 'published' || retrospective.status === 'archived') {
      res.status(400).json({
        success: false,
        error: 'Cannot add notes to published or archived retrospective',
      } as ApiResponse);
      return;
    }

    const note: Partial<IRetrospectiveNote> = {
      _id: new mongoose.Types.ObjectId(),
      category,
      content,
      createdBy: new mongoose.Types.ObjectId(userId),
      votes: [],
      voteCount: 0,
    };

    retrospective.notes.push(note as IRetrospectiveNote);
    await retrospective.save();

    // Populate the newly added note
    await retrospective.populate('notes.createdBy', 'profile.firstName profile.lastName profile.avatar email');

    const addedNote = retrospective.notes[retrospective.notes.length - 1];

    res.status(201).json({
      success: true,
      data: { note: addedNote },
      message: 'Note added successfully',
    } as ApiResponse);
  } catch (error) {
    logger.error('Add note error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to add note',
    } as ApiResponse);
  }
};

// Update a note
export const updateNote = async (req: PMAuthRequest, res: Response): Promise<void> => {
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
    const { retrospectiveId, noteId } = req.params;
    const { content, category } = req.body;

    if (!userId) {
      res.status(401).json({
        success: false,
        error: 'Unauthorized',
      } as ApiResponse);
      return;
    }

    const retrospective = await PMRetrospective.findById(retrospectiveId);
    if (!retrospective) {
      res.status(404).json({
        success: false,
        error: 'Retrospective not found',
      } as ApiResponse);
      return;
    }

    if (retrospective.status === 'published' || retrospective.status === 'archived') {
      res.status(400).json({
        success: false,
        error: 'Cannot update notes in published or archived retrospective',
      } as ApiResponse);
      return;
    }

    const noteIndex = retrospective.notes.findIndex(
      (n) => n._id.toString() === noteId
    );

    if (noteIndex === -1) {
      res.status(404).json({
        success: false,
        error: 'Note not found',
      } as ApiResponse);
      return;
    }

    // Only allow the creator to update the note
    if (retrospective.notes[noteIndex].createdBy.toString() !== userId) {
      res.status(403).json({
        success: false,
        error: 'You can only update your own notes',
      } as ApiResponse);
      return;
    }

    if (content) retrospective.notes[noteIndex].content = content;
    if (category) retrospective.notes[noteIndex].category = category;

    await retrospective.save();

    res.status(200).json({
      success: true,
      data: { note: retrospective.notes[noteIndex] },
      message: 'Note updated successfully',
    } as ApiResponse);
  } catch (error) {
    logger.error('Update note error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update note',
    } as ApiResponse);
  }
};

// Delete a note
export const deleteNote = async (req: PMAuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    const { retrospectiveId, noteId } = req.params;

    if (!userId) {
      res.status(401).json({
        success: false,
        error: 'Unauthorized',
      } as ApiResponse);
      return;
    }

    const retrospective = await PMRetrospective.findById(retrospectiveId);
    if (!retrospective) {
      res.status(404).json({
        success: false,
        error: 'Retrospective not found',
      } as ApiResponse);
      return;
    }

    if (retrospective.status === 'published' || retrospective.status === 'archived') {
      res.status(400).json({
        success: false,
        error: 'Cannot delete notes from published or archived retrospective',
      } as ApiResponse);
      return;
    }

    const noteIndex = retrospective.notes.findIndex(
      (n) => n._id.toString() === noteId
    );

    if (noteIndex === -1) {
      res.status(404).json({
        success: false,
        error: 'Note not found',
      } as ApiResponse);
      return;
    }

    // Only allow the creator to delete the note
    if (retrospective.notes[noteIndex].createdBy.toString() !== userId) {
      res.status(403).json({
        success: false,
        error: 'You can only delete your own notes',
      } as ApiResponse);
      return;
    }

    retrospective.notes.splice(noteIndex, 1);
    await retrospective.save();

    res.status(200).json({
      success: true,
      message: 'Note deleted successfully',
    } as ApiResponse);
  } catch (error) {
    logger.error('Delete note error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete note',
    } as ApiResponse);
  }
};

// ==================== VOTING ====================

// Vote on a note
export const voteOnNote = async (req: PMAuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    const { retrospectiveId, noteId } = req.params;

    if (!userId) {
      res.status(401).json({
        success: false,
        error: 'Unauthorized',
      } as ApiResponse);
      return;
    }

    const retrospective = await PMRetrospective.findById(retrospectiveId);
    if (!retrospective) {
      res.status(404).json({
        success: false,
        error: 'Retrospective not found',
      } as ApiResponse);
      return;
    }

    // Check permissions
    const project = await Project.findById(retrospective.projectId);
    if (!project) {
      res.status(404).json({
        success: false,
        error: 'Project not found',
      } as ApiResponse);
      return;
    }

    if (!canVoteOnRetrospective(project.members, userId)) {
      res.status(403).json({
        success: false,
        error: 'You do not have permission to vote',
      } as ApiResponse);
      return;
    }

    if (retrospective.status !== 'voting' && retrospective.status !== 'draft') {
      res.status(400).json({
        success: false,
        error: 'Voting is not allowed in this retrospective status',
      } as ApiResponse);
      return;
    }

    const noteIndex = retrospective.notes.findIndex(
      (n) => n._id.toString() === noteId
    );

    if (noteIndex === -1) {
      res.status(404).json({
        success: false,
        error: 'Note not found',
      } as ApiResponse);
      return;
    }

    const note = retrospective.notes[noteIndex];
    const userObjectId = new mongoose.Types.ObjectId(userId);

    // Check if user already voted on this note
    const hasVoted = note.votes.some((v) => v.toString() === userId);

    if (hasVoted) {
      res.status(400).json({
        success: false,
        error: 'You have already voted on this note',
      } as ApiResponse);
      return;
    }

    // Count total votes by this user across all notes
    const userVoteCount = retrospective.notes.reduce((count, n) => {
      return count + (n.votes.some((v) => v.toString() === userId) ? 1 : 0);
    }, 0);

    if (userVoteCount >= retrospective.maxVotesPerUser) {
      res.status(400).json({
        success: false,
        error: `You have reached the maximum number of votes (${retrospective.maxVotesPerUser})`,
      } as ApiResponse);
      return;
    }

    // Add vote
    note.votes.push(userObjectId);
    note.voteCount = note.votes.length;

    await retrospective.save();

    res.status(200).json({
      success: true,
      data: { 
        note,
        remainingVotes: retrospective.maxVotesPerUser - userVoteCount - 1,
      },
      message: 'Vote recorded successfully',
    } as ApiResponse);
  } catch (error) {
    logger.error('Vote on note error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to record vote',
    } as ApiResponse);
  }
};

// Remove vote from a note
export const removeVote = async (req: PMAuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    const { retrospectiveId, noteId } = req.params;

    if (!userId) {
      res.status(401).json({
        success: false,
        error: 'Unauthorized',
      } as ApiResponse);
      return;
    }

    const retrospective = await PMRetrospective.findById(retrospectiveId);
    if (!retrospective) {
      res.status(404).json({
        success: false,
        error: 'Retrospective not found',
      } as ApiResponse);
      return;
    }

    if (retrospective.status !== 'voting' && retrospective.status !== 'draft') {
      res.status(400).json({
        success: false,
        error: 'Voting changes are not allowed in this retrospective status',
      } as ApiResponse);
      return;
    }

    const noteIndex = retrospective.notes.findIndex(
      (n) => n._id.toString() === noteId
    );

    if (noteIndex === -1) {
      res.status(404).json({
        success: false,
        error: 'Note not found',
      } as ApiResponse);
      return;
    }

    const note = retrospective.notes[noteIndex];

    // Check if user has voted on this note
    const voteIndex = note.votes.findIndex((v) => v.toString() === userId);

    if (voteIndex === -1) {
      res.status(400).json({
        success: false,
        error: 'You have not voted on this note',
      } as ApiResponse);
      return;
    }

    // Remove vote
    note.votes.splice(voteIndex, 1);
    note.voteCount = note.votes.length;

    await retrospective.save();

    // Count remaining votes
    const userVoteCount = retrospective.notes.reduce((count, n) => {
      return count + (n.votes.some((v) => v.toString() === userId) ? 1 : 0);
    }, 0);

    res.status(200).json({
      success: true,
      data: { 
        note,
        remainingVotes: retrospective.maxVotesPerUser - userVoteCount,
      },
      message: 'Vote removed successfully',
    } as ApiResponse);
  } catch (error) {
    logger.error('Remove vote error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to remove vote',
    } as ApiResponse);
  }
};

// Get user's voting status
export const getVotingStatus = async (req: PMAuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    const { retrospectiveId } = req.params;

    if (!userId) {
      res.status(401).json({
        success: false,
        error: 'Unauthorized',
      } as ApiResponse);
      return;
    }

    const retrospective = await PMRetrospective.findById(retrospectiveId);
    if (!retrospective) {
      res.status(404).json({
        success: false,
        error: 'Retrospective not found',
      } as ApiResponse);
      return;
    }

    // Get notes the user has voted on
    const votedNoteIds = retrospective.notes
      .filter((n) => n.votes.some((v) => v.toString() === userId))
      .map((n) => n._id.toString());

    const userVoteCount = votedNoteIds.length;

    res.status(200).json({
      success: true,
      data: {
        maxVotes: retrospective.maxVotesPerUser,
        usedVotes: userVoteCount,
        remainingVotes: retrospective.maxVotesPerUser - userVoteCount,
        votedNoteIds,
      },
    } as ApiResponse);
  } catch (error) {
    logger.error('Get voting status error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get voting status',
    } as ApiResponse);
  }
};

// ==================== ACTION ITEMS ====================

// Add action item
export const addActionItem = async (req: PMAuthRequest, res: Response): Promise<void> => {
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
    const { retrospectiveId } = req.params;
    const { title, description, owner, dueDate, linkedNoteId, linkedToNextSprint } = req.body;

    if (!userId) {
      res.status(401).json({
        success: false,
        error: 'Unauthorized',
      } as ApiResponse);
      return;
    }

    const retrospective = await PMRetrospective.findById(retrospectiveId);
    if (!retrospective) {
      res.status(404).json({
        success: false,
        error: 'Retrospective not found',
      } as ApiResponse);
      return;
    }

    // Check permissions
    const project = await Project.findById(retrospective.projectId);
    if (!project) {
      res.status(404).json({
        success: false,
        error: 'Project not found',
      } as ApiResponse);
      return;
    }

    if (!canManageActionItems(project.members, userId)) {
      res.status(403).json({
        success: false,
        error: 'You do not have permission to manage action items',
      } as ApiResponse);
      return;
    }

    const actionItem: Partial<IActionItem> = {
      _id: new mongoose.Types.ObjectId(),
      title,
      description,
      status: 'pending',
    };

    if (owner) actionItem.owner = new mongoose.Types.ObjectId(owner);
    if (dueDate) actionItem.dueDate = new Date(dueDate);
    if (linkedNoteId) actionItem.linkedNoteId = new mongoose.Types.ObjectId(linkedNoteId);
    if (linkedToNextSprint) actionItem.linkedToNextSprint = new mongoose.Types.ObjectId(linkedToNextSprint);

    retrospective.actionItems.push(actionItem as IActionItem);
    await retrospective.save();

    // Populate the newly added action item
    await retrospective.populate('actionItems.owner', 'profile.firstName profile.lastName profile.avatar email');

    const addedItem = retrospective.actionItems[retrospective.actionItems.length - 1];

    res.status(201).json({
      success: true,
      data: { actionItem: addedItem },
      message: 'Action item added successfully',
    } as ApiResponse);
  } catch (error) {
    logger.error('Add action item error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to add action item',
    } as ApiResponse);
  }
};

// Update action item
export const updateActionItem = async (req: PMAuthRequest, res: Response): Promise<void> => {
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
    const { retrospectiveId, actionItemId } = req.params;
    const { title, description, owner, dueDate, status, linkedToNextSprint } = req.body;

    if (!userId) {
      res.status(401).json({
        success: false,
        error: 'Unauthorized',
      } as ApiResponse);
      return;
    }

    const retrospective = await PMRetrospective.findById(retrospectiveId);
    if (!retrospective) {
      res.status(404).json({
        success: false,
        error: 'Retrospective not found',
      } as ApiResponse);
      return;
    }

    // Check permissions
    const project = await Project.findById(retrospective.projectId);
    if (!project) {
      res.status(404).json({
        success: false,
        error: 'Project not found',
      } as ApiResponse);
      return;
    }

    if (!canManageActionItems(project.members, userId)) {
      res.status(403).json({
        success: false,
        error: 'You do not have permission to manage action items',
      } as ApiResponse);
      return;
    }

    const itemIndex = retrospective.actionItems.findIndex(
      (item) => item._id.toString() === actionItemId
    );

    if (itemIndex === -1) {
      res.status(404).json({
        success: false,
        error: 'Action item not found',
      } as ApiResponse);
      return;
    }

    const actionItem = retrospective.actionItems[itemIndex];

    if (title) actionItem.title = title;
    if (description !== undefined) actionItem.description = description;
    if (owner !== undefined) {
      actionItem.owner = owner ? new mongoose.Types.ObjectId(owner) : undefined;
    }
    if (dueDate !== undefined) {
      actionItem.dueDate = dueDate ? new Date(dueDate) : undefined;
    }
    if (status) actionItem.status = status;
    if (linkedToNextSprint !== undefined) {
      actionItem.linkedToNextSprint = linkedToNextSprint && typeof linkedToNextSprint === 'string'
        ? new mongoose.Types.ObjectId(linkedToNextSprint) 
        : undefined;
    }

    await retrospective.save();

    // Populate the updated action item
    await retrospective.populate('actionItems.owner', 'profile.firstName profile.lastName profile.avatar email');

    res.status(200).json({
      success: true,
      data: { actionItem: retrospective.actionItems[itemIndex] },
      message: 'Action item updated successfully',
    } as ApiResponse);
  } catch (error) {
    logger.error('Update action item error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update action item',
    } as ApiResponse);
  }
};

// Delete action item
export const deleteActionItem = async (req: PMAuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    const { retrospectiveId, actionItemId } = req.params;

    if (!userId) {
      res.status(401).json({
        success: false,
        error: 'Unauthorized',
      } as ApiResponse);
      return;
    }

    const retrospective = await PMRetrospective.findById(retrospectiveId);
    if (!retrospective) {
      res.status(404).json({
        success: false,
        error: 'Retrospective not found',
      } as ApiResponse);
      return;
    }

    // Check permissions
    const project = await Project.findById(retrospective.projectId);
    if (!project) {
      res.status(404).json({
        success: false,
        error: 'Project not found',
      } as ApiResponse);
      return;
    }

    if (!canManageActionItems(project.members, userId)) {
      res.status(403).json({
        success: false,
        error: 'You do not have permission to manage action items',
      } as ApiResponse);
      return;
    }

    const itemIndex = retrospective.actionItems.findIndex(
      (item) => item._id.toString() === actionItemId
    );

    if (itemIndex === -1) {
      res.status(404).json({
        success: false,
        error: 'Action item not found',
      } as ApiResponse);
      return;
    }

    retrospective.actionItems.splice(itemIndex, 1);
    await retrospective.save();

    res.status(200).json({
      success: true,
      message: 'Action item deleted successfully',
    } as ApiResponse);
  } catch (error) {
    logger.error('Delete action item error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete action item',
    } as ApiResponse);
  }
};

// Get action items (optionally filter by status)
export const getActionItems = async (req: PMAuthRequest, res: Response): Promise<void> => {
  try {
    const { retrospectiveId } = req.params;
    const { status } = req.query;

    const retrospective = await PMRetrospective.findById(retrospectiveId)
      .populate('actionItems.owner', 'profile.firstName profile.lastName profile.avatar email');

    if (!retrospective) {
      res.status(404).json({
        success: false,
        error: 'Retrospective not found',
      } as ApiResponse);
      return;
    }

    let actionItems = retrospective.actionItems;
    if (status) {
      actionItems = actionItems.filter((item) => item.status === status);
    }

    res.status(200).json({
      success: true,
      data: { actionItems },
    } as ApiResponse);
  } catch (error) {
    logger.error('Get action items error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch action items',
    } as ApiResponse);
  }
};
