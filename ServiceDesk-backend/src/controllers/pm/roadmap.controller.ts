import { Request, Response } from 'express';
import logger from '../../utils/logger';
import roadmapService from '../../services/pm/roadmap.service';
import Project from '../../models/pm/Project';
import { PMAuthRequest, ApiResponse, MethodologyCode } from '../../types/pm';

export const generateRoadmap = async (req: PMAuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    const organizationId = req.user?.organizationId;
    const { projectId } = req.params;
    const { type } = req.body;

    if (!organizationId) {
      res.status(400).json({
        success: false,
        error: 'Organization context required',
      } as ApiResponse);
      return;
    }

    const project = await Project.findById(projectId);
    if (!project) {
      res.status(404).json({
        success: false,
        error: 'Project not found',
      } as ApiResponse);
      return;
    }

    let roadmap;
    const methodology = project.methodology.code;

    switch (type || getDefaultRoadmapType(methodology)) {
      case 'sprint_timeline':
        roadmap = await roadmapService.generateSprintTimeline(projectId, organizationId, userId!);
        break;
      case 'gantt':
        roadmap = await roadmapService.generateGanttChart(projectId, organizationId, userId!);
        break;
      case 'change_calendar':
        roadmap = await roadmapService.generateChangeCalendar(projectId, organizationId, userId!);
        break;
      case 'okr_progress':
        roadmap = await roadmapService.generateOKRProgress(projectId, organizationId, userId!);
        break;
      default:
        roadmap = await roadmapService.generateGanttChart(projectId, organizationId, userId!);
    }

    res.status(200).json({
      success: true,
      data: { roadmap },
      message: 'Roadmap generated successfully',
    } as ApiResponse);
  } catch (error) {
    logger.error('Generate roadmap error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to generate roadmap',
    } as ApiResponse);
  }
};

export const getRoadmaps = async (req: Request, res: Response): Promise<void> => {
  try {
    const { projectId } = req.params;

    const roadmaps = await roadmapService.getProjectRoadmaps(projectId);

    res.status(200).json({
      success: true,
      data: { roadmaps },
    } as ApiResponse);
  } catch (error) {
    logger.error('Get roadmaps error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch roadmaps',
    } as ApiResponse);
  }
};

export const getRoadmap = async (req: Request, res: Response): Promise<void> => {
  try {
    const { roadmapId } = req.params;

    const roadmap = await roadmapService.getRoadmap(roadmapId);
    if (!roadmap) {
      res.status(404).json({
        success: false,
        error: 'Roadmap not found',
      } as ApiResponse);
      return;
    }

    res.status(200).json({
      success: true,
      data: { roadmap },
    } as ApiResponse);
  } catch (error) {
    logger.error('Get roadmap error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch roadmap',
    } as ApiResponse);
  }
};

export const deleteRoadmap = async (req: Request, res: Response): Promise<void> => {
  try {
    const { roadmapId } = req.params;

    await roadmapService.deleteRoadmap(roadmapId);

    res.status(200).json({
      success: true,
      message: 'Roadmap deleted successfully',
    } as ApiResponse);
  } catch (error) {
    logger.error('Delete roadmap error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete roadmap',
    } as ApiResponse);
  }
};

function getDefaultRoadmapType(methodology: MethodologyCode): string {
  const defaults: Record<MethodologyCode, string> = {
    [MethodologyCode.SCRUM]: 'sprint_timeline',
    [MethodologyCode.KANBAN]: 'gantt',
    [MethodologyCode.WATERFALL]: 'gantt',
    [MethodologyCode.ITIL]: 'change_calendar',
    [MethodologyCode.LEAN]: 'value_stream',
    [MethodologyCode.OKR]: 'okr_progress',
  };
  return defaults[methodology] || 'gantt';
}
