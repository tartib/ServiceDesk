import { Response } from 'express';
import logger from '../../utils/logger';
import { PMAuthRequest, ApiResponse } from '../../types/pm';
import PMPhase from '../../models/pm/Phase';
import PMGate from '../../models/pm/Gate';
import PMMilestone from '../../models/pm/Milestone';
import PMImprovement from '../../models/pm/Improvement';
import PMValueStreamStep from '../../models/pm/ValueStreamStep';
import PMProjectFile from '../../models/pm/ProjectFile';
import PMNotification from '../../models/pm/Notification';
import PMReport from '../../models/pm/Report';

// ─── PHASES ───────────────────────────────────────────────────────────

export const getPhases = async (req: PMAuthRequest, res: Response): Promise<void> => {
  try {
    const { projectId } = req.params;
    const phases = await PMPhase.find({ projectId }).sort({ order: 1 });
    res.json({ success: true, data: { phases } } as ApiResponse);
  } catch (error) {
    logger.error('Get phases error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch phases' } as ApiResponse);
  }
};

export const createPhase = async (req: PMAuthRequest, res: Response): Promise<void> => {
  try {
    const { projectId } = req.params;
    const organizationId = req.user?.organizationId;
    const count = await PMPhase.countDocuments({ projectId });
    const phase = await PMPhase.create({ ...req.body, projectId, organizationId, order: req.body.order ?? count });
    res.status(201).json({ success: true, data: { phase } } as ApiResponse);
  } catch (error) {
    logger.error('Create phase error:', error);
    res.status(500).json({ success: false, message: 'Failed to create phase' } as ApiResponse);
  }
};

export const updatePhase = async (req: PMAuthRequest, res: Response): Promise<void> => {
  try {
    const { phaseId } = req.params;
    const phase = await PMPhase.findByIdAndUpdate(phaseId, req.body, { new: true });
    if (!phase) { res.status(404).json({ success: false, message: 'Phase not found' } as ApiResponse); return; }
    res.json({ success: true, data: { phase } } as ApiResponse);
  } catch (error) {
    logger.error('Update phase error:', error);
    res.status(500).json({ success: false, message: 'Failed to update phase' } as ApiResponse);
  }
};

export const deletePhase = async (req: PMAuthRequest, res: Response): Promise<void> => {
  try {
    const { phaseId } = req.params;
    await PMPhase.findByIdAndDelete(phaseId);
    res.json({ success: true, message: 'Phase deleted' } as ApiResponse);
  } catch (error) {
    logger.error('Delete phase error:', error);
    res.status(500).json({ success: false, message: 'Failed to delete phase' } as ApiResponse);
  }
};

// ─── GATES ────────────────────────────────────────────────────────────

export const getGates = async (req: PMAuthRequest, res: Response): Promise<void> => {
  try {
    const { projectId } = req.params;
    const gates = await PMGate.find({ projectId })
      .populate('approvers.userId', 'profile.firstName profile.lastName email')
      .populate('comments.author', 'profile.firstName profile.lastName email')
      .sort({ createdAt: -1 });
    res.json({ success: true, data: { gates } } as ApiResponse);
  } catch (error) {
    logger.error('Get gates error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch gates' } as ApiResponse);
  }
};

export const createGate = async (req: PMAuthRequest, res: Response): Promise<void> => {
  try {
    const { projectId } = req.params;
    const organizationId = req.user?.organizationId;
    const gate = await PMGate.create({ ...req.body, projectId, organizationId });
    res.status(201).json({ success: true, data: { gate } } as ApiResponse);
  } catch (error) {
    logger.error('Create gate error:', error);
    res.status(500).json({ success: false, message: 'Failed to create gate' } as ApiResponse);
  }
};

export const updateGate = async (req: PMAuthRequest, res: Response): Promise<void> => {
  try {
    const { gateId } = req.params;
    const gate = await PMGate.findByIdAndUpdate(gateId, req.body, { new: true });
    if (!gate) { res.status(404).json({ success: false, message: 'Gate not found' } as ApiResponse); return; }
    res.json({ success: true, data: { gate } } as ApiResponse);
  } catch (error) {
    logger.error('Update gate error:', error);
    res.status(500).json({ success: false, message: 'Failed to update gate' } as ApiResponse);
  }
};

// ─── MILESTONES ───────────────────────────────────────────────────────

export const getMilestones = async (req: PMAuthRequest, res: Response): Promise<void> => {
  try {
    const { projectId } = req.params;
    const milestones = await PMMilestone.find({ projectId })
      .populate('owner', 'profile.firstName profile.lastName email')
      .sort({ dueDate: 1 });
    res.json({ success: true, data: { milestones } } as ApiResponse);
  } catch (error) {
    logger.error('Get milestones error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch milestones' } as ApiResponse);
  }
};

export const createMilestone = async (req: PMAuthRequest, res: Response): Promise<void> => {
  try {
    const { projectId } = req.params;
    const organizationId = req.user?.organizationId;
    const milestone = await PMMilestone.create({ ...req.body, projectId, organizationId });
    res.status(201).json({ success: true, data: { milestone } } as ApiResponse);
  } catch (error) {
    logger.error('Create milestone error:', error);
    res.status(500).json({ success: false, message: 'Failed to create milestone' } as ApiResponse);
  }
};

export const updateMilestone = async (req: PMAuthRequest, res: Response): Promise<void> => {
  try {
    const { milestoneId } = req.params;
    const milestone = await PMMilestone.findByIdAndUpdate(milestoneId, req.body, { new: true });
    if (!milestone) { res.status(404).json({ success: false, message: 'Milestone not found' } as ApiResponse); return; }
    res.json({ success: true, data: { milestone } } as ApiResponse);
  } catch (error) {
    logger.error('Update milestone error:', error);
    res.status(500).json({ success: false, message: 'Failed to update milestone' } as ApiResponse);
  }
};

export const deleteMilestone = async (req: PMAuthRequest, res: Response): Promise<void> => {
  try {
    const { milestoneId } = req.params;
    await PMMilestone.findByIdAndDelete(milestoneId);
    res.json({ success: true, message: 'Milestone deleted' } as ApiResponse);
  } catch (error) {
    logger.error('Delete milestone error:', error);
    res.status(500).json({ success: false, message: 'Failed to delete milestone' } as ApiResponse);
  }
};

// ─── IMPROVEMENTS ─────────────────────────────────────────────────────

export const getImprovements = async (req: PMAuthRequest, res: Response): Promise<void> => {
  try {
    const { projectId } = req.params;
    const improvements = await PMImprovement.find({ projectId })
      .populate('submittedBy', 'profile.firstName profile.lastName email')
      .populate('assignee', 'profile.firstName profile.lastName email')
      .sort({ createdAt: -1 });
    res.json({ success: true, data: { improvements } } as ApiResponse);
  } catch (error) {
    logger.error('Get improvements error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch improvements' } as ApiResponse);
  }
};

export const createImprovement = async (req: PMAuthRequest, res: Response): Promise<void> => {
  try {
    const { projectId } = req.params;
    const organizationId = req.user?.organizationId;
    const userId = req.user?.id;
    const improvement = await PMImprovement.create({ ...req.body, projectId, organizationId, submittedBy: userId });
    res.status(201).json({ success: true, data: { improvement } } as ApiResponse);
  } catch (error) {
    logger.error('Create improvement error:', error);
    res.status(500).json({ success: false, message: 'Failed to create improvement' } as ApiResponse);
  }
};

export const updateImprovement = async (req: PMAuthRequest, res: Response): Promise<void> => {
  try {
    const { improvementId } = req.params;
    const improvement = await PMImprovement.findByIdAndUpdate(improvementId, req.body, { new: true });
    if (!improvement) { res.status(404).json({ success: false, message: 'Improvement not found' } as ApiResponse); return; }
    res.json({ success: true, data: { improvement } } as ApiResponse);
  } catch (error) {
    logger.error('Update improvement error:', error);
    res.status(500).json({ success: false, message: 'Failed to update improvement' } as ApiResponse);
  }
};

export const voteImprovement = async (req: PMAuthRequest, res: Response): Promise<void> => {
  try {
    const { improvementId } = req.params;
    const userId = req.user?.id;
    const improvement = await PMImprovement.findById(improvementId);
    if (!improvement) { res.status(404).json({ success: false, message: 'Improvement not found' } as ApiResponse); return; }
    const alreadyVoted = improvement.voters.some(v => v.toString() === userId);
    if (alreadyVoted) {
      improvement.voters = improvement.voters.filter(v => v.toString() !== userId);
      improvement.votes = Math.max(0, improvement.votes - 1);
    } else {
      improvement.voters.push(userId as any);
      improvement.votes += 1;
    }
    await improvement.save();
    res.json({ success: true, data: { improvement } } as ApiResponse);
  } catch (error) {
    logger.error('Vote improvement error:', error);
    res.status(500).json({ success: false, message: 'Failed to vote' } as ApiResponse);
  }
};

// ─── VALUE STREAM ─────────────────────────────────────────────────────

export const getValueStreamSteps = async (req: PMAuthRequest, res: Response): Promise<void> => {
  try {
    const { projectId } = req.params;
    const steps = await PMValueStreamStep.find({ projectId }).sort({ order: 1 });
    res.json({ success: true, data: { steps } } as ApiResponse);
  } catch (error) {
    logger.error('Get value stream steps error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch value stream steps' } as ApiResponse);
  }
};

export const createValueStreamStep = async (req: PMAuthRequest, res: Response): Promise<void> => {
  try {
    const { projectId } = req.params;
    const organizationId = req.user?.organizationId;
    const count = await PMValueStreamStep.countDocuments({ projectId });
    const step = await PMValueStreamStep.create({ ...req.body, projectId, organizationId, order: req.body.order ?? count });
    res.status(201).json({ success: true, data: { step } } as ApiResponse);
  } catch (error) {
    logger.error('Create value stream step error:', error);
    res.status(500).json({ success: false, message: 'Failed to create step' } as ApiResponse);
  }
};

export const updateValueStreamStep = async (req: PMAuthRequest, res: Response): Promise<void> => {
  try {
    const { stepId } = req.params;
    const step = await PMValueStreamStep.findByIdAndUpdate(stepId, req.body, { new: true });
    if (!step) { res.status(404).json({ success: false, message: 'Step not found' } as ApiResponse); return; }
    res.json({ success: true, data: { step } } as ApiResponse);
  } catch (error) {
    logger.error('Update value stream step error:', error);
    res.status(500).json({ success: false, message: 'Failed to update step' } as ApiResponse);
  }
};

export const deleteValueStreamStep = async (req: PMAuthRequest, res: Response): Promise<void> => {
  try {
    const { stepId } = req.params;
    await PMValueStreamStep.findByIdAndDelete(stepId);
    res.json({ success: true, message: 'Step deleted' } as ApiResponse);
  } catch (error) {
    logger.error('Delete value stream step error:', error);
    res.status(500).json({ success: false, message: 'Failed to delete step' } as ApiResponse);
  }
};

// ─── PROJECT FILES ────────────────────────────────────────────────────

export const getProjectFiles = async (req: PMAuthRequest, res: Response): Promise<void> => {
  try {
    const { projectId } = req.params;
    const files = await PMProjectFile.find({ projectId })
      .populate('uploadedBy', 'profile.firstName profile.lastName email')
      .sort({ createdAt: -1 });
    res.json({ success: true, data: { files } } as ApiResponse);
  } catch (error) {
    logger.error('Get project files error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch files' } as ApiResponse);
  }
};

export const createProjectFile = async (req: PMAuthRequest, res: Response): Promise<void> => {
  try {
    const { projectId } = req.params;
    const organizationId = req.user?.organizationId;
    const userId = req.user?.id;
    const file = await PMProjectFile.create({ ...req.body, projectId, organizationId, uploadedBy: userId });
    res.status(201).json({ success: true, data: { file } } as ApiResponse);
  } catch (error) {
    logger.error('Create project file error:', error);
    res.status(500).json({ success: false, message: 'Failed to create file' } as ApiResponse);
  }
};

export const deleteProjectFile = async (req: PMAuthRequest, res: Response): Promise<void> => {
  try {
    const { fileId } = req.params;
    await PMProjectFile.findByIdAndDelete(fileId);
    res.json({ success: true, message: 'File deleted' } as ApiResponse);
  } catch (error) {
    logger.error('Delete project file error:', error);
    res.status(500).json({ success: false, message: 'Failed to delete file' } as ApiResponse);
  }
};

// ─── NOTIFICATIONS ────────────────────────────────────────────────────

export const getNotifications = async (req: PMAuthRequest, res: Response): Promise<void> => {
  try {
    const { projectId } = req.params;
    const userId = req.user?.id;
    const notifications = await PMNotification.find({ projectId, userId }).sort({ createdAt: -1 }).limit(50);
    res.json({ success: true, data: { notifications } } as ApiResponse);
  } catch (error) {
    logger.error('Get notifications error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch notifications' } as ApiResponse);
  }
};

export const markNotificationRead = async (req: PMAuthRequest, res: Response): Promise<void> => {
  try {
    const { notificationId } = req.params;
    const notification = await PMNotification.findByIdAndUpdate(notificationId, { read: true }, { new: true });
    if (!notification) { res.status(404).json({ success: false, message: 'Notification not found' } as ApiResponse); return; }
    res.json({ success: true, data: { notification } } as ApiResponse);
  } catch (error) {
    logger.error('Mark notification read error:', error);
    res.status(500).json({ success: false, message: 'Failed to update notification' } as ApiResponse);
  }
};

export const markAllNotificationsRead = async (req: PMAuthRequest, res: Response): Promise<void> => {
  try {
    const { projectId } = req.params;
    const userId = req.user?.id;
    await PMNotification.updateMany({ projectId, userId, read: false }, { read: true });
    res.json({ success: true, message: 'All notifications marked as read' } as ApiResponse);
  } catch (error) {
    logger.error('Mark all notifications read error:', error);
    res.status(500).json({ success: false, message: 'Failed to update notifications' } as ApiResponse);
  }
};

export const deleteNotification = async (req: PMAuthRequest, res: Response): Promise<void> => {
  try {
    const { notificationId } = req.params;
    await PMNotification.findByIdAndDelete(notificationId);
    res.json({ success: true, message: 'Notification deleted' } as ApiResponse);
  } catch (error) {
    logger.error('Delete notification error:', error);
    res.status(500).json({ success: false, message: 'Failed to delete notification' } as ApiResponse);
  }
};

// ─── REPORTS ──────────────────────────────────────────────────────────

export const getReports = async (req: PMAuthRequest, res: Response): Promise<void> => {
  try {
    const { projectId } = req.params;
    const reports = await PMReport.find({ projectId })
      .populate('createdBy', 'profile.firstName profile.lastName email')
      .sort({ createdAt: -1 });
    res.json({ success: true, data: { reports } } as ApiResponse);
  } catch (error) {
    logger.error('Get reports error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch reports' } as ApiResponse);
  }
};

export const createReport = async (req: PMAuthRequest, res: Response): Promise<void> => {
  try {
    const { projectId } = req.params;
    const organizationId = req.user?.organizationId;
    const userId = req.user?.id;
    const report = await PMReport.create({ ...req.body, projectId, organizationId, createdBy: userId });
    res.status(201).json({ success: true, data: { report } } as ApiResponse);
  } catch (error) {
    logger.error('Create report error:', error);
    res.status(500).json({ success: false, message: 'Failed to create report' } as ApiResponse);
  }
};

export const updateReport = async (req: PMAuthRequest, res: Response): Promise<void> => {
  try {
    const { reportId } = req.params;
    const report = await PMReport.findByIdAndUpdate(reportId, req.body, { new: true });
    if (!report) { res.status(404).json({ success: false, message: 'Report not found' } as ApiResponse); return; }
    res.json({ success: true, data: { report } } as ApiResponse);
  } catch (error) {
    logger.error('Update report error:', error);
    res.status(500).json({ success: false, message: 'Failed to update report' } as ApiResponse);
  }
};

export const deleteReport = async (req: PMAuthRequest, res: Response): Promise<void> => {
  try {
    const { reportId } = req.params;
    await PMReport.findByIdAndDelete(reportId);
    res.json({ success: true, message: 'Report deleted' } as ApiResponse);
  } catch (error) {
    logger.error('Delete report error:', error);
    res.status(500).json({ success: false, message: 'Failed to delete report' } as ApiResponse);
  }
};
