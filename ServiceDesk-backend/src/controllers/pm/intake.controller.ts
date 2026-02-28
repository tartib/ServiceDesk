import { Response } from 'express';
import { validationResult } from 'express-validator';
import mongoose from 'mongoose';
import ProjectIntake, { IntakeStage } from '../../models/pm/ProjectIntake';
import Project from '../../models/pm/Project';
import Organization from '../../models/pm/Organization';
import { PMAuthRequest, ApiResponse } from '../../types/pm';
import { MethodologyCode, ProjectRole } from '../../models/pm/Project';
import logger from '../../utils/logger';

/**
 * Helper: resolve organizationId, auto-creating a default org if needed
 */
async function resolveOrganizationId(userId?: string, orgId?: string): Promise<string | null> {
  if (orgId) return orgId;
  if (!userId) return null;
  let defaultOrg = await Organization.findOne({ createdBy: userId });
  if (!defaultOrg) {
    defaultOrg = new Organization({
      name: 'Default Organization',
      slug: `org-${userId}`,
      createdBy: userId,
    });
    await defaultOrg.save();
  }
  return defaultOrg._id.toString();
}


// Stage transition map: which stages can advance to which
const STAGE_TRANSITIONS: Record<string, string> = {
  [IntakeStage.DRAFT]: IntakeStage.SCREENING,
  [IntakeStage.SCREENING]: IntakeStage.BUSINESS_CASE,
  [IntakeStage.BUSINESS_CASE]: IntakeStage.PRIORITIZATION,
  [IntakeStage.PRIORITIZATION]: IntakeStage.APPROVED,
};

/**
 * Create a new intake request
 */
export const createIntakeRequest = async (req: PMAuthRequest, res: Response): Promise<void> => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({
        success: false,
        errors: errors.array().map((e) => ({ field: e.type, message: e.msg })),
      } as ApiResponse);
      return;
    }

    const userId = req.user?.id;
    const organizationId = await resolveOrganizationId(userId, req.user?.organizationId);

    if (!organizationId) {
      res.status(400).json({ success: false, error: 'Unable to resolve organization' } as ApiResponse);
      return;
    }

    const {
      title,
      description,
      category,
      priority,
      businessJustification,
      expectedBenefits,
      estimatedBudget,
      estimatedTimeline,
      riskLevel,
      strategicAlignment,
      preferredMethodology,
      suggestedTeam,
    } = req.body;

    const intake = new ProjectIntake({
      organizationId,
      title,
      description,
      requestedBy: userId,
      category,
      priority: priority || 'medium',
      businessJustification,
      expectedBenefits,
      estimatedBudget,
      estimatedTimeline,
      riskLevel,
      strategicAlignment,
      preferredMethodology,
      suggestedTeam,
      stage: IntakeStage.DRAFT,
      stageHistory: [
        {
          stage: IntakeStage.DRAFT,
          enteredAt: new Date(),
          actionBy: userId,
          action: 'created',
        },
      ],
    });

    await intake.save();

    const populated = await ProjectIntake.findById(intake._id)
      .populate('requestedBy', 'name profile.firstName profile.lastName profile.avatar email');

    res.status(201).json({
      success: true,
      data: { intake: populated },
      message: 'Intake request created successfully',
    } as ApiResponse);
  } catch (error) {
    logger.error('Create intake request error:', error);
    res.status(500).json({ success: false, error: 'Failed to create intake request' } as ApiResponse);
  }
};

/**
 * Get all intake requests with filters
 */
export const getIntakeRequests = async (req: PMAuthRequest, res: Response): Promise<void> => {
  try {
    const organizationId = await resolveOrganizationId(req.user?.id, req.user?.organizationId);
    const {
      stage,
      priority,
      category,
      requestedBy,
      page = '1',
      limit = '20',
    } = req.query;

    const query: Record<string, unknown> = { organizationId };
    if (stage) query.stage = stage;
    if (priority) query.priority = priority;
    if (category) query.category = category;
    if (requestedBy) query.requestedBy = requestedBy;

    const pageNum = parseInt(page as string, 10);
    const limitNum = parseInt(limit as string, 10);
    const skip = (pageNum - 1) * limitNum;

    const [intakes, total] = await Promise.all([
      ProjectIntake.find(query)
        .populate('requestedBy', 'name profile.firstName profile.lastName profile.avatar email')
        .populate('approvedBy', 'name profile.firstName profile.lastName email')
        .populate('reviewers', 'name profile.firstName profile.lastName email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum),
      ProjectIntake.countDocuments(query),
    ]);

    res.status(200).json({
      success: true,
      data: {
        intakes,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          pages: Math.ceil(total / limitNum),
        },
      },
    } as ApiResponse);
  } catch (error) {
    logger.error('Get intake requests error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch intake requests' } as ApiResponse);
  }
};

/**
 * Get a single intake request
 */
export const getIntakeRequest = async (req: PMAuthRequest, res: Response): Promise<void> => {
  try {
    const { intakeId } = req.params;

    const intake = await ProjectIntake.findById(intakeId)
      .populate('requestedBy', 'name profile.firstName profile.lastName profile.avatar email')
      .populate('approvedBy', 'name profile.firstName profile.lastName email')
      .populate('reviewers', 'name profile.firstName profile.lastName profile.avatar email')
      .populate('comments.author', 'name profile.firstName profile.lastName profile.avatar email')
      .populate('scores.scoredBy', 'name profile.firstName profile.lastName email')
      .populate('stageHistory.actionBy', 'name profile.firstName profile.lastName email')
      .populate('projectId', 'name key status');

    if (!intake) {
      res.status(404).json({ success: false, error: 'Intake request not found' } as ApiResponse);
      return;
    }

    res.status(200).json({
      success: true,
      data: { intake },
    } as ApiResponse);
  } catch (error) {
    logger.error('Get intake request error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch intake request' } as ApiResponse);
  }
};

/**
 * Update intake request (only draft or screening stage)
 */
export const updateIntakeRequest = async (req: PMAuthRequest, res: Response): Promise<void> => {
  try {
    const { intakeId } = req.params;
    const userId = req.user?.id;

    const intake = await ProjectIntake.findById(intakeId);
    if (!intake) {
      res.status(404).json({ success: false, error: 'Intake request not found' } as ApiResponse);
      return;
    }

    if (![IntakeStage.DRAFT, IntakeStage.SCREENING].includes(intake.stage as IntakeStage)) {
      res.status(400).json({
        success: false,
        error: 'Can only edit requests in draft or screening stage',
      } as ApiResponse);
      return;
    }

    // Only requester can edit in draft; managers can edit in screening
    if (intake.stage === IntakeStage.DRAFT && intake.requestedBy.toString() !== userId) {
      res.status(403).json({ success: false, error: 'Only the requester can edit a draft request' } as ApiResponse);
      return;
    }

    const allowedUpdates = [
      'title', 'description', 'category', 'priority',
      'businessJustification', 'expectedBenefits', 'estimatedBudget',
      'estimatedTimeline', 'riskLevel', 'strategicAlignment',
      'preferredMethodology', 'suggestedTeam',
    ];

    for (const key of allowedUpdates) {
      if (req.body[key] !== undefined) {
        (intake as unknown as Record<string, unknown>)[key] = req.body[key];
      }
    }

    await intake.save();

    const updated = await ProjectIntake.findById(intakeId)
      .populate('requestedBy', 'name profile.firstName profile.lastName profile.avatar email');

    res.status(200).json({
      success: true,
      data: { intake: updated },
      message: 'Intake request updated successfully',
    } as ApiResponse);
  } catch (error) {
    logger.error('Update intake request error:', error);
    res.status(500).json({ success: false, error: 'Failed to update intake request' } as ApiResponse);
  }
};

/**
 * Advance intake request to next stage
 */
export const advanceStage = async (req: PMAuthRequest, res: Response): Promise<void> => {
  try {
    const { intakeId } = req.params;
    const { comment } = req.body;
    const userId = req.user?.id;

    const intake = await ProjectIntake.findById(intakeId);
    if (!intake) {
      res.status(404).json({ success: false, error: 'Intake request not found' } as ApiResponse);
      return;
    }

    const nextStage = STAGE_TRANSITIONS[intake.stage];
    if (!nextStage) {
      res.status(400).json({
        success: false,
        error: `Cannot advance from "${intake.stage}" stage`,
      } as ApiResponse);
      return;
    }

    // Validation per stage
    if (intake.stage === IntakeStage.DRAFT) {
      if (!intake.title || !intake.description) {
        res.status(400).json({
          success: false,
          error: 'Title and description are required to submit for screening',
        } as ApiResponse);
        return;
      }
    }

    if (intake.stage === IntakeStage.SCREENING && !comment) {
      res.status(400).json({
        success: false,
        error: 'A comment is required to advance from screening',
      } as ApiResponse);
      return;
    }

    if (intake.stage === IntakeStage.BUSINESS_CASE) {
      if (!intake.businessJustification) {
        res.status(400).json({
          success: false,
          error: 'Business justification is required to advance to prioritization',
        } as ApiResponse);
        return;
      }
    }

    if (intake.stage === IntakeStage.PRIORITIZATION) {
      if (intake.scores.length === 0) {
        res.status(400).json({
          success: false,
          error: 'At least one score is required before approval',
        } as ApiResponse);
        return;
      }
    }

    // Close current stage history entry
    const currentHistoryEntry = intake.stageHistory.find(
      (h) => h.stage === intake.stage && !h.exitedAt
    );
    if (currentHistoryEntry) {
      currentHistoryEntry.exitedAt = new Date();
    }

    // Advance
    intake.stage = nextStage as IntakeStage;
    intake.stageHistory.push({
      stage: nextStage as IntakeStage,
      enteredAt: new Date(),
      actionBy: userId ? new mongoose.Types.ObjectId(userId) : undefined,
      action: 'advanced',
      comment,
    });

    if (comment) {
      intake.comments.push({
        author: new mongoose.Types.ObjectId(userId),
        content: comment,
        createdAt: new Date(),
      });
    }

    await intake.save();

    const updated = await ProjectIntake.findById(intakeId)
      .populate('requestedBy', 'name profile.firstName profile.lastName profile.avatar email')
      .populate('comments.author', 'name profile.firstName profile.lastName profile.avatar email')
      .populate('stageHistory.actionBy', 'name profile.firstName profile.lastName email');

    res.status(200).json({
      success: true,
      data: { intake: updated },
      message: `Request advanced to ${nextStage.replace('_', ' ')}`,
    } as ApiResponse);
  } catch (error) {
    logger.error('Advance intake stage error:', error);
    res.status(500).json({ success: false, error: 'Failed to advance stage' } as ApiResponse);
  }
};

/**
 * Reject an intake request
 */
export const rejectRequest = async (req: PMAuthRequest, res: Response): Promise<void> => {
  try {
    const { intakeId } = req.params;
    const { comment } = req.body;
    const userId = req.user?.id;

    if (!comment) {
      res.status(400).json({ success: false, error: 'A comment is required when rejecting' } as ApiResponse);
      return;
    }

    const intake = await ProjectIntake.findById(intakeId);
    if (!intake) {
      res.status(404).json({ success: false, error: 'Intake request not found' } as ApiResponse);
      return;
    }

    if ([IntakeStage.APPROVED, IntakeStage.REJECTED, IntakeStage.CANCELLED].includes(intake.stage as IntakeStage)) {
      res.status(400).json({ success: false, error: 'Cannot reject a request that is already finalized' } as ApiResponse);
      return;
    }

    const currentHistoryEntry = intake.stageHistory.find(
      (h) => h.stage === intake.stage && !h.exitedAt
    );
    if (currentHistoryEntry) {
      currentHistoryEntry.exitedAt = new Date();
    }

    intake.stage = IntakeStage.REJECTED;
    intake.stageHistory.push({
      stage: IntakeStage.REJECTED,
      enteredAt: new Date(),
      actionBy: userId ? new mongoose.Types.ObjectId(userId) : undefined,
      action: 'rejected',
      comment,
    });

    intake.comments.push({
      author: new mongoose.Types.ObjectId(userId),
      content: `[Rejected] ${comment}`,
      createdAt: new Date(),
    });

    await intake.save();

    res.status(200).json({
      success: true,
      data: { intake },
      message: 'Request rejected',
    } as ApiResponse);
  } catch (error) {
    logger.error('Reject intake request error:', error);
    res.status(500).json({ success: false, error: 'Failed to reject request' } as ApiResponse);
  }
};

/**
 * Cancel an intake request (requester only, draft/screening)
 */
export const cancelRequest = async (req: PMAuthRequest, res: Response): Promise<void> => {
  try {
    const { intakeId } = req.params;
    const userId = req.user?.id;

    const intake = await ProjectIntake.findById(intakeId);
    if (!intake) {
      res.status(404).json({ success: false, error: 'Intake request not found' } as ApiResponse);
      return;
    }

    if (intake.requestedBy.toString() !== userId) {
      res.status(403).json({ success: false, error: 'Only the requester can cancel' } as ApiResponse);
      return;
    }

    if (![IntakeStage.DRAFT, IntakeStage.SCREENING].includes(intake.stage as IntakeStage)) {
      res.status(400).json({
        success: false,
        error: 'Can only cancel requests in draft or screening stage',
      } as ApiResponse);
      return;
    }

    const currentHistoryEntry = intake.stageHistory.find(
      (h) => h.stage === intake.stage && !h.exitedAt
    );
    if (currentHistoryEntry) {
      currentHistoryEntry.exitedAt = new Date();
    }

    intake.stage = IntakeStage.CANCELLED;
    intake.stageHistory.push({
      stage: IntakeStage.CANCELLED,
      enteredAt: new Date(),
      actionBy: userId ? new mongoose.Types.ObjectId(userId) : undefined,
      action: 'cancelled',
    });

    await intake.save();

    res.status(200).json({
      success: true,
      data: { intake },
      message: 'Request cancelled',
    } as ApiResponse);
  } catch (error) {
    logger.error('Cancel intake request error:', error);
    res.status(500).json({ success: false, error: 'Failed to cancel request' } as ApiResponse);
  }
};

/**
 * Add a comment to an intake request
 */
export const addComment = async (req: PMAuthRequest, res: Response): Promise<void> => {
  try {
    const { intakeId } = req.params;
    const { content } = req.body;
    const userId = req.user?.id;

    if (!content || !content.trim()) {
      res.status(400).json({ success: false, error: 'Comment content is required' } as ApiResponse);
      return;
    }

    const intake = await ProjectIntake.findById(intakeId);
    if (!intake) {
      res.status(404).json({ success: false, error: 'Intake request not found' } as ApiResponse);
      return;
    }

    intake.comments.push({
      author: new mongoose.Types.ObjectId(userId),
      content: content.trim(),
      createdAt: new Date(),
    });

    await intake.save();

    const updated = await ProjectIntake.findById(intakeId)
      .populate('comments.author', 'name profile.firstName profile.lastName profile.avatar email');

    res.status(200).json({
      success: true,
      data: { comments: updated?.comments },
      message: 'Comment added',
    } as ApiResponse);
  } catch (error) {
    logger.error('Add intake comment error:', error);
    res.status(500).json({ success: false, error: 'Failed to add comment' } as ApiResponse);
  }
};

/**
 * Add or update a score (during prioritization stage)
 */
export const addScore = async (req: PMAuthRequest, res: Response): Promise<void> => {
  try {
    const { intakeId } = req.params;
    const { criterion, score } = req.body;
    const userId = req.user?.id;

    if (!criterion || score === undefined || score < 1 || score > 5) {
      res.status(400).json({
        success: false,
        error: 'Criterion and score (1-5) are required',
      } as ApiResponse);
      return;
    }

    const intake = await ProjectIntake.findById(intakeId);
    if (!intake) {
      res.status(404).json({ success: false, error: 'Intake request not found' } as ApiResponse);
      return;
    }

    if (intake.stage !== IntakeStage.PRIORITIZATION) {
      res.status(400).json({
        success: false,
        error: 'Scores can only be added during prioritization stage',
      } as ApiResponse);
      return;
    }

    // Update existing score or add new
    const existingIdx = intake.scores.findIndex(
      (s) => s.criterion === criterion && s.scoredBy.toString() === userId
    );

    if (existingIdx >= 0) {
      intake.scores[existingIdx].score = score;
      intake.scores[existingIdx].scoredAt = new Date();
    } else {
      intake.scores.push({
        criterion,
        score,
        scoredBy: new mongoose.Types.ObjectId(userId),
        scoredAt: new Date(),
      });
    }

    await intake.save();

    const updated = await ProjectIntake.findById(intakeId)
      .populate('scores.scoredBy', 'name profile.firstName profile.lastName email');

    res.status(200).json({
      success: true,
      data: { scores: updated?.scores },
      message: 'Score recorded',
    } as ApiResponse);
  } catch (error) {
    logger.error('Add intake score error:', error);
    res.status(500).json({ success: false, error: 'Failed to add score' } as ApiResponse);
  }
};

/**
 * Final approval — creates a PMProject from the intake data
 */
export const approveRequest = async (req: PMAuthRequest, res: Response): Promise<void> => {
  try {
    const { intakeId } = req.params;
    const { comment, projectKey } = req.body;
    const userId = req.user?.id;
    const organizationId = await resolveOrganizationId(userId, req.user?.organizationId);

    const intake = await ProjectIntake.findById(intakeId);
    if (!intake) {
      res.status(404).json({ success: false, error: 'Intake request not found' } as ApiResponse);
      return;
    }

    if (intake.stage !== IntakeStage.PRIORITIZATION) {
      res.status(400).json({
        success: false,
        error: 'Can only approve requests in prioritization stage',
      } as ApiResponse);
      return;
    }

    if (intake.scores.length === 0) {
      res.status(400).json({
        success: false,
        error: 'At least one score is required before approval',
      } as ApiResponse);
      return;
    }

    // Generate project key if not provided
    const key = (projectKey || intake.title.substring(0, 6).toUpperCase().replace(/[^A-Z]/g, '') || 'PROJ')
      .toUpperCase()
      .substring(0, 10);

    // Check key uniqueness
    const existingProject = await Project.findOne({ organizationId, key });
    if (existingProject) {
      res.status(400).json({
        success: false,
        error: `Project key "${key}" already exists. Please provide a unique key.`,
      } as ApiResponse);
      return;
    }

    // Determine methodology
    const methodologyCode = intake.preferredMethodology || 'scrum';
    const validMethodologies = Object.values(MethodologyCode);
    const methodology = validMethodologies.includes(methodologyCode as MethodologyCode)
      ? methodologyCode
      : MethodologyCode.SCRUM;

    // Create the project
    const project = new Project({
      organizationId: intake.organizationId,
      key,
      name: intake.title,
      description: intake.description,
      methodology: { code: methodology },
      members: [
        {
          userId: intake.requestedBy,
          role: ProjectRole.CONTRIBUTOR,
          permissions: [],
          addedAt: new Date(),
        },
        {
          userId: new mongoose.Types.ObjectId(userId),
          role: ProjectRole.LEAD,
          permissions: ['*'],
          addedAt: new Date(),
        },
      ],
      createdBy: new mongoose.Types.ObjectId(userId),
    });

    // Deduplicate if requester === approver
    if (intake.requestedBy.toString() === userId) {
      project.members = [
        {
          userId: new mongoose.Types.ObjectId(userId),
          role: ProjectRole.LEAD,
          permissions: ['*'],
          addedAt: new Date(),
        },
      ];
    }

    await project.save();

    // Update intake
    const currentHistoryEntry = intake.stageHistory.find(
      (h) => h.stage === intake.stage && !h.exitedAt
    );
    if (currentHistoryEntry) {
      currentHistoryEntry.exitedAt = new Date();
    }

    intake.stage = IntakeStage.APPROVED;
    intake.approvedBy = new mongoose.Types.ObjectId(userId);
    intake.projectId = project._id;
    intake.stageHistory.push({
      stage: IntakeStage.APPROVED,
      enteredAt: new Date(),
      actionBy: new mongoose.Types.ObjectId(userId),
      action: 'approved',
      comment,
    });

    if (comment) {
      intake.comments.push({
        author: new mongoose.Types.ObjectId(userId),
        content: `[Approved] ${comment}`,
        createdAt: new Date(),
      });
    }

    await intake.save();

    res.status(200).json({
      success: true,
      data: { intake, project },
      message: 'Request approved and project created',
    } as ApiResponse);
  } catch (error) {
    logger.error('Approve intake request error:', error);
    res.status(500).json({ success: false, error: 'Failed to approve request' } as ApiResponse);
  }
};

/**
 * Get intake stats for dashboard
 */
export const getIntakeStats = async (req: PMAuthRequest, res: Response): Promise<void> => {
  try {
    const organizationId = await resolveOrganizationId(req.user?.id, req.user?.organizationId);

    if (!organizationId) {
      res.json({ success: true, data: { total: 0, byStage: {}, avgApprovalDays: 0 } } as ApiResponse);
      return;
    }

    const [stageCounts, total] = await Promise.all([
      ProjectIntake.aggregate([
        { $match: { organizationId: new mongoose.Types.ObjectId(organizationId) } },
        { $group: { _id: '$stage', count: { $sum: 1 } } },
      ]),
      ProjectIntake.countDocuments({ organizationId }),
    ]);

    const byStage: Record<string, number> = {};
    for (const item of stageCounts) {
      byStage[item._id] = item.count;
    }

    // Average time from draft to approved (in days)
    const approvedIntakes = await ProjectIntake.find({
      organizationId,
      stage: IntakeStage.APPROVED,
    }).select('stageHistory');

    let avgDays = 0;
    if (approvedIntakes.length > 0) {
      let totalDays = 0;
      for (const ai of approvedIntakes) {
        const draftEntry = ai.stageHistory.find((h) => h.stage === IntakeStage.DRAFT);
        const approvedEntry = ai.stageHistory.find((h) => h.stage === IntakeStage.APPROVED);
        if (draftEntry && approvedEntry) {
          totalDays += (approvedEntry.enteredAt.getTime() - draftEntry.enteredAt.getTime()) / (1000 * 60 * 60 * 24);
        }
      }
      avgDays = Math.round((totalDays / approvedIntakes.length) * 10) / 10;
    }

    res.status(200).json({
      success: true,
      data: {
        total,
        byStage,
        avgApprovalDays: avgDays,
      },
    } as ApiResponse);
  } catch (error) {
    logger.error('Get intake stats error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch stats' } as ApiResponse);
  }
};
