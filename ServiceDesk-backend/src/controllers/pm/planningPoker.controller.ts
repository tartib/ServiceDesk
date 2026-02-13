import { Response } from 'express';
import logger from '../../utils/logger';
import { validationResult } from 'express-validator';
import mongoose from 'mongoose';
import PlanningPokerSession from '../../models/pm/PlanningPoker';
import Task from '../../models/pm/Task';
import { PMAuthRequest, ApiResponse } from '../../types/pm';
import socketService from '../../services/pm/socket.service';

// Fibonacci sequence for story points
const STORY_POINT_VALUES = [1, 2, 3, 5, 8, 13, 21];

// Create a new planning poker session for a task
export const createSession = async (req: PMAuthRequest, res: Response): Promise<void> => {
  try {
    // Debug logging
    console.log('Planning Poker - Request body:', JSON.stringify(req.body));
    console.log('Planning Poker - Request params:', JSON.stringify(req.params));
    
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log('Planning Poker - Validation errors:', JSON.stringify(errors.array()));
      res.status(400).json({
        success: false,
        errors: errors.array().map((e) => ({ field: (e as { path?: string }).path || 'unknown', message: e.msg })),
      } as ApiResponse);
      return;
    }

    const userId = req.user?.id;
    
    const { taskId } = req.params;
    const { estimationType } = req.body;
    
    // Sanitize sprintId - only accept valid MongoDB ObjectIds
    let sprintId = req.body.sprintId;
    // Check if sprintId is a valid 24-character hex string (MongoDB ObjectId format)
    const isValidObjectId = sprintId && typeof sprintId === 'string' && /^[a-fA-F0-9]{24}$/.test(sprintId);
    if (!isValidObjectId) {
      sprintId = undefined;
    }

    const task = await Task.findById(taskId);
    console.log('Planning Poker - task found:', task ? task._id : 'null');
    if (!task) {
      res.status(404).json({
        success: false,
        error: 'Task not found',
      } as ApiResponse);
      return;
    }

    // Check if there's already an active session for this task
    const existingSession = await PlanningPokerSession.findOne({
      taskId,
      status: { $in: ['voting', 'revealed'] },
    });

    if (existingSession) {
      res.status(400).json({
        success: false,
        error: 'There is already an active planning poker session for this task',
        data: { session: existingSession },
      } as ApiResponse);
      return;
    }

    // Build session data - sprintId is optional
    const sessionData: Record<string, unknown> = {
      projectId: task.projectId,
      taskId,
      status: 'voting',
      estimationType: estimationType || 'story_points',
      votes: [],
      round: 1,
      maxRounds: req.body.maxRounds || 3,
      roundTimeLimit: req.body.roundTimeLimit || 300, // 5 minutes default
      consensusReached: false,
      facilitator: userId,
      createdBy: userId,
    };

    // Only add sprintId if it exists
    const effectiveSprintId = sprintId || task.sprintId;
    if (effectiveSprintId) {
      sessionData.sprintId = effectiveSprintId;
    }

    const session = new PlanningPokerSession(sessionData);

    await session.save();

    const populatedSession = await PlanningPokerSession.findById(session._id)
      .populate('taskId', 'key title type priority')
      .populate('facilitator', 'name profile.firstName profile.lastName profile.avatar email');

    // Emit socket event for new session
    socketService.pokerSessionCreated(task.projectId.toString(), populatedSession);

    res.status(201).json({
      success: true,
      data: { 
        session: populatedSession,
        validValues: STORY_POINT_VALUES,
      },
      message: 'Planning poker session created',
    } as ApiResponse);
  } catch (error) {
    logger.error('Create planning poker session error:', error);
    logger.error('Error details:', JSON.stringify(error, Object.getOwnPropertyNames(error)));
    res.status(500).json({
      success: false,
      error: 'Failed to create planning poker session',
    } as ApiResponse);
  }
};

// Get active session for a task
export const getSession = async (req: PMAuthRequest, res: Response): Promise<void> => {
  try {
    const { sessionId } = req.params;

    const session = await PlanningPokerSession.findById(sessionId)
      .populate('taskId', 'key title type priority storyPoints')
      .populate('facilitator', 'name profile.firstName profile.lastName profile.avatar email')
      .populate('votes.oderId', 'name profile.firstName profile.lastName profile.avatar email');

    if (!session) {
      res.status(404).json({
        success: false,
        error: 'Planning poker session not found',
      } as ApiResponse);
      return;
    }

    // Hide votes if not revealed
    const sessionData = session.toJSON();
    if (session.status === 'voting') {
      sessionData.votes = sessionData.votes.map((vote: any) => ({
        oderId: vote.oderId,
        votedAt: vote.votedAt,
        revealed: false,
        value: '?', // Hide actual value
      }));
    }

    res.status(200).json({
      success: true,
      data: { 
        session: sessionData,
        validValues: STORY_POINT_VALUES,
      },
    } as ApiResponse);
  } catch (error) {
    logger.error('Get planning poker session error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch planning poker session',
    } as ApiResponse);
  }
};

// Get active sessions for a sprint
export const getSprintSessions = async (req: PMAuthRequest, res: Response): Promise<void> => {
  try {
    const { sprintId } = req.params;
    const { status } = req.query;

    const query: Record<string, unknown> = { sprintId };
    if (status) query.status = status;

    const sessions = await PlanningPokerSession.find(query)
      .populate('taskId', 'key title type priority storyPoints')
      .populate('facilitator', 'name profile.firstName profile.lastName profile.avatar email')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: { sessions },
    } as ApiResponse);
  } catch (error) {
    logger.error('Get sprint sessions error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch planning poker sessions',
    } as ApiResponse);
  }
};

// Submit a vote
export const submitVote = async (req: PMAuthRequest, res: Response): Promise<void> => {
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
    const { sessionId } = req.params;
    const { value } = req.body;

    if (!userId) {
      res.status(401).json({
        success: false,
        error: 'User not authenticated',
      } as ApiResponse);
      return;
    }

    const session = await PlanningPokerSession.findById(sessionId);
    if (!session) {
      res.status(404).json({
        success: false,
        error: 'Planning poker session not found',
      } as ApiResponse);
      return;
    }

    if (session.status !== 'voting') {
      res.status(400).json({
        success: false,
        error: 'Voting is not open for this session',
      } as ApiResponse);
      return;
    }

    // Validate vote value for story points
    if (session.estimationType === 'story_points' && !STORY_POINT_VALUES.includes(value)) {
      res.status(400).json({
        success: false,
        error: `Invalid vote value. Valid values are: ${STORY_POINT_VALUES.join(', ')}`,
      } as ApiResponse);
      return;
    }

    // Check if user already voted
    const existingVoteIndex = session.votes.findIndex(
      (v) => v.oderId.toString() === userId
    );

    if (existingVoteIndex !== -1) {
      // Update existing vote
      session.votes[existingVoteIndex].value = value;
      session.votes[existingVoteIndex].votedAt = new Date();
    } else {
      // Add new vote
      session.votes.push({
        oderId: new mongoose.Types.ObjectId(userId),
        value,
        votedAt: new Date(),
        revealed: false,
      });
    }

    await session.save();

    // Emit socket event for vote submitted
    socketService.pokerVoteSubmitted(sessionId, {
      voteCount: session.votes.length,
      oderId: userId,
      participantCount: session.votes.length,
    });

    res.status(200).json({
      success: true,
      data: { 
        voteCount: session.votes.length,
        hasVoted: true,
      },
      message: 'Vote submitted successfully',
    } as ApiResponse);
  } catch (error) {
    logger.error('Submit vote error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to submit vote',
    } as ApiResponse);
  }
};

// Reveal all votes
export const revealVotes = async (req: PMAuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    const { sessionId } = req.params;

    const session = await PlanningPokerSession.findById(sessionId);
    if (!session) {
      res.status(404).json({
        success: false,
        error: 'Planning poker session not found',
      } as ApiResponse);
      return;
    }

    // Only facilitator can reveal
    if (session.facilitator.toString() !== userId) {
      res.status(403).json({
        success: false,
        error: 'Only the facilitator can reveal votes',
      } as ApiResponse);
      return;
    }

    if (session.status !== 'voting') {
      res.status(400).json({
        success: false,
        error: 'Votes are already revealed or session is completed',
      } as ApiResponse);
      return;
    }

    if (session.votes.length === 0) {
      res.status(400).json({
        success: false,
        error: 'No votes to reveal',
      } as ApiResponse);
      return;
    }

    // Mark all votes as revealed
    session.votes.forEach((vote) => {
      vote.revealed = true;
    });
    session.status = 'revealed';
    await session.save();

    // Calculate statistics
    const numericVotes = session.votes
      .map((v) => (typeof v.value === 'number' ? v.value : parseFloat(v.value as string)))
      .filter((v) => !isNaN(v));

    const allIdentical = numericVotes.every((v) => v === numericVotes[0]);
    const spread = Math.max(...numericVotes) - Math.min(...numericVotes);

    const stats = {
      min: Math.min(...numericVotes),
      max: Math.max(...numericVotes),
      average: numericVotes.reduce((a, b) => a + b, 0) / numericVotes.length,
      median: getMedian(numericVotes),
      consensus: allIdentical || spread <= 2,
      spread,
    };

    const populatedSession = await PlanningPokerSession.findById(sessionId)
      .populate('taskId', 'key title type priority')
      .populate('votes.oderId', 'name profile.firstName profile.lastName profile.avatar email');

    // Emit socket event for votes revealed
    socketService.pokerVotesRevealed(sessionId, {
      session: populatedSession,
      stats,
      suggestedEstimate: findClosestFibonacci(stats.average),
    });

    res.status(200).json({
      success: true,
      data: { 
        session: populatedSession,
        stats,
        suggestedEstimate: findClosestFibonacci(stats.average),
      },
      message: 'Votes revealed',
    } as ApiResponse);
  } catch (error) {
    logger.error('Reveal votes error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to reveal votes',
    } as ApiResponse);
  }
};

// Start a new voting round (re-vote)
export const startNewRound = async (req: PMAuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    const { sessionId } = req.params;

    const session = await PlanningPokerSession.findById(sessionId);
    if (!session) {
      res.status(404).json({
        success: false,
        error: 'Planning poker session not found',
      } as ApiResponse);
      return;
    }

    // Only facilitator can start new round
    if (session.facilitator.toString() !== userId) {
      res.status(403).json({
        success: false,
        error: 'Only the facilitator can start a new round',
      } as ApiResponse);
      return;
    }

    if (session.status !== 'revealed') {
      res.status(400).json({
        success: false,
        error: 'Can only start new round after votes are revealed',
      } as ApiResponse);
      return;
    }

    // Check max rounds limit
    if (session.round >= session.maxRounds) {
      res.status(400).json({
        success: false,
        error: `Maximum rounds (${session.maxRounds}) reached. Please complete the session with a final estimate.`,
      } as ApiResponse);
      return;
    }

    // Clear votes and start new round
    session.votes = [];
    session.round += 1;
    session.status = 'voting';
    await session.save();

    // Emit socket event for new round
    socketService.pokerNewRound(sessionId, { round: session.round });

    res.status(200).json({
      success: true,
      data: { session },
      message: `Round ${session.round} started`,
    } as ApiResponse);
  } catch (error) {
    logger.error('Start new round error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to start new round',
    } as ApiResponse);
  }
};

// Complete session and save final estimate
export const completeSession = async (req: PMAuthRequest, res: Response): Promise<void> => {
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
    const { sessionId } = req.params;
    const { finalEstimate } = req.body;

    const session = await PlanningPokerSession.findById(sessionId);
    if (!session) {
      res.status(404).json({
        success: false,
        error: 'Planning poker session not found',
      } as ApiResponse);
      return;
    }

    // Only facilitator can complete
    if (session.facilitator.toString() !== userId) {
      res.status(403).json({
        success: false,
        error: 'Only the facilitator can complete the session',
      } as ApiResponse);
      return;
    }

    if (session.status === 'completed') {
      res.status(400).json({
        success: false,
        error: 'Session is already completed',
      } as ApiResponse);
      return;
    }

    // Block estimate of 21 - too large, must be decomposed
    if (finalEstimate === 21) {
      res.status(400).json({
        success: false,
        error: 'Estimate of 21 is BLOCKING. Story is too large and must be decomposed into smaller tasks.',
      } as ApiResponse);
      return;
    }

    // Check consensus (all votes identical OR spread <= 2 Fibonacci steps)
    const numericVotes = session.votes
      .map((v) => Number(v.value))
      .filter((v) => !isNaN(v));
    
    let consensusReached = false;
    if (numericVotes.length > 0) {
      const allIdentical = numericVotes.every((v) => v === numericVotes[0]);
      const spread = Math.max(...numericVotes) - Math.min(...numericVotes);
      // Fibonacci steps: 1,2,3,5,8,13 - spread of 2 means within 2 steps
      consensusReached = allIdentical || spread <= 2;
    }

    // Update session
    session.status = 'completed';
    session.finalEstimate = finalEstimate;
    session.consensusReached = consensusReached;
    await session.save();

    // Update task with the estimate
    await Task.findByIdAndUpdate(session.taskId, {
      storyPoints: finalEstimate,
    });

    const populatedSession = await PlanningPokerSession.findById(sessionId)
      .populate('taskId', 'key title type priority storyPoints');

    // Emit socket event for session completed
    socketService.pokerSessionCompleted(sessionId, populatedSession);

    // Build response message with warnings
    const message = 'Session completed and estimate saved to task';
    const warnings: string[] = [];
    
    if (finalEstimate >= 13) {
      warnings.push('Story is large (≥13 points). Consider splitting into smaller tasks.');
    }
    if (!consensusReached) {
      warnings.push('Consensus was not reached. Estimate was decided by facilitator.');
    }

    res.status(200).json({
      success: true,
      data: { 
        session: populatedSession,
        consensusReached,
        warnings: warnings.length > 0 ? warnings : undefined,
      },
      message,
    } as ApiResponse);
  } catch (error) {
    logger.error('Complete session error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to complete session',
    } as ApiResponse);
  }
};

// Cancel session
export const cancelSession = async (req: PMAuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    const { sessionId } = req.params;

    const session = await PlanningPokerSession.findById(sessionId);
    if (!session) {
      res.status(404).json({
        success: false,
        error: 'Planning poker session not found',
      } as ApiResponse);
      return;
    }

    // Only facilitator can cancel
    if (session.facilitator.toString() !== userId) {
      res.status(403).json({
        success: false,
        error: 'Only the facilitator can cancel the session',
      } as ApiResponse);
      return;
    }

    await PlanningPokerSession.findByIdAndDelete(sessionId);

    // Emit socket event for session cancelled
    socketService.pokerSessionCancelled(sessionId);

    res.status(200).json({
      success: true,
      message: 'Session cancelled',
    } as ApiResponse);
  } catch (error) {
    logger.error('Cancel session error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to cancel session',
    } as ApiResponse);
  }
};

// Helper functions
function getMedian(arr: number[]): number {
  const sorted = [...arr].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

function findClosestFibonacci(value: number): number {
  let closest = STORY_POINT_VALUES[0];
  let minDiff = Math.abs(value - closest);

  for (const fib of STORY_POINT_VALUES) {
    const diff = Math.abs(value - fib);
    if (diff < minDiff) {
      minDiff = diff;
      closest = fib;
    }
  }

  return closest;
}
