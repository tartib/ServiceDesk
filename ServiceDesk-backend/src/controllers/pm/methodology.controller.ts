import { Request, Response } from 'express';
import logger from '../../utils/logger';
import { methodologyService } from '../../services/pm/methodology.service';
import { PMProject } from '../../models/pm';

export class MethodologyController {
  /**
   * Get methodology config for a project
   */
  async getMethodologyConfig(req: Request, res: Response): Promise<void> {
    try {
      const { projectId } = req.params;

      if (!projectId || projectId === 'undefined' || projectId === 'null') {
        res.status(400).json({
          success: false,
          error: { code: 'VALIDATION_ERROR', message: 'Valid projectId is required' },
        });
        return;
      }

      let config = await methodologyService.getMethodologyConfig(projectId);
      
      if (!config) {
        const project = await PMProject.findById(projectId);
        if (!project) {
          res.status(404).json({
            success: false,
            error: { code: 'NOT_FOUND', message: 'Project not found' },
          });
          return;
        }

        const methodologyCode = project.methodology?.code || 'scrum';
        config = await methodologyService.initializeMethodology(projectId, methodologyCode as any);
      }

      res.json({ success: true, data: config });
    } catch (error) {
      logger.error('Error getting methodology config:', error);
      res.status(500).json({
        success: false,
        error: { code: 'SERVER_ERROR', message: 'Failed to get methodology config' },
      });
    }
  }

  /**
   * Initialize methodology for a project
   */
  async initializeMethodology(req: Request, res: Response): Promise<void> {
    try {
      const { projectId } = req.params;

      if (!projectId || projectId === 'undefined' || projectId === 'null') {
        res.status(400).json({
          success: false,
          error: { code: 'VALIDATION_ERROR', message: 'Valid projectId is required' },
        });
        return;
      }

      const { methodologyCode } = req.body;

      if (!methodologyCode) {
        res.status(400).json({
          success: false,
          error: { code: 'VALIDATION_ERROR', message: 'methodologyCode is required' },
        });
        return;
      }

      const validCodes = ['scrum', 'kanban', 'waterfall', 'itil', 'lean', 'okr'];
      if (!validCodes.includes(methodologyCode)) {
        res.status(400).json({
          success: false,
          error: { code: 'VALIDATION_ERROR', message: 'Invalid methodology code' },
        });
        return;
      }

      // Check if config already exists
      const existing = await methodologyService.getMethodologyConfig(projectId);
      if (existing) {
        res.status(400).json({
          success: false,
          error: { code: 'ALREADY_EXISTS', message: 'Methodology config already exists' },
        });
        return;
      }

      const config = await methodologyService.initializeMethodology(projectId, methodologyCode);
      res.status(201).json({ success: true, data: config });
    } catch (error) {
      logger.error('Error initializing methodology:', error);
      res.status(500).json({
        success: false,
        error: { code: 'SERVER_ERROR', message: 'Failed to initialize methodology' },
      });
    }
  }

  /**
   * Update methodology config
   */
  async updateMethodologyConfig(req: Request, res: Response): Promise<void> {
    try {
      const { projectId } = req.params;

      if (!projectId || projectId === 'undefined' || projectId === 'null') {
        res.status(400).json({
          success: false,
          error: { code: 'VALIDATION_ERROR', message: 'Valid projectId is required' },
        });
        return;
      }

      const updates = req.body;

      const config = await methodologyService.updateMethodologyConfig(projectId, updates);
      if (!config) {
        res.status(404).json({
          success: false,
          error: { code: 'NOT_FOUND', message: 'Methodology config not found' },
        });
        return;
      }

      res.json({ success: true, data: config });
    } catch (error) {
      logger.error('Error updating methodology config:', error);
      res.status(500).json({
        success: false,
        error: { code: 'SERVER_ERROR', message: 'Failed to update methodology config' },
      });
    }
  }

  /**
   * Change project methodology
   */
  async changeMethodology(req: Request, res: Response): Promise<void> {
    try {
      const { projectId } = req.params;

      if (!projectId || projectId === 'undefined' || projectId === 'null') {
        res.status(400).json({
          success: false,
          error: { code: 'VALIDATION_ERROR', message: 'Valid projectId is required' },
        });
        return;
      }

      const { methodologyCode, preserveData = true } = req.body;

      if (!methodologyCode) {
        res.status(400).json({
          success: false,
          error: { code: 'VALIDATION_ERROR', message: 'methodologyCode is required' },
        });
        return;
      }

      const validCodes = ['scrum', 'kanban', 'waterfall', 'itil', 'lean', 'okr'];
      if (!validCodes.includes(methodologyCode)) {
        res.status(400).json({
          success: false,
          error: { code: 'VALIDATION_ERROR', message: 'Invalid methodology code' },
        });
        return;
      }

      const config = await methodologyService.changeMethodology(projectId, methodologyCode, preserveData);
      if (!config) {
        res.status(404).json({
          success: false,
          error: { code: 'NOT_FOUND', message: 'Project not found' },
        });
        return;
      }

      res.json({ success: true, data: config });
    } catch (error) {
      logger.error('Error changing methodology:', error);
      res.status(500).json({
        success: false,
        error: { code: 'SERVER_ERROR', message: 'Failed to change methodology' },
      });
    }
  }

  /**
   * Get navigation tabs for project methodology
   */
  async getNavigationTabs(req: Request, res: Response): Promise<void> {
    try {
      const { projectId } = req.params;

      if (!projectId || projectId === 'undefined' || projectId === 'null') {
        res.status(400).json({
          success: false,
          error: { code: 'VALIDATION_ERROR', message: 'Valid projectId is required' },
        });
        return;
      }

      const project = await PMProject.findById(projectId);
      if (!project) {
        res.status(404).json({
          success: false,
          error: { code: 'NOT_FOUND', message: 'Project not found' },
        });
        return;
      }

      const tabs = methodologyService.getNavigationTabs(project.methodology.code as any);
      const defaultPage = methodologyService.getDefaultLandingPage(project.methodology.code as any);

      res.json({
        success: true,
        data: {
          methodologyCode: project.methodology.code,
          tabs,
          defaultPage,
        },
      });
    } catch (error) {
      logger.error('Error getting navigation tabs:', error);
      res.status(500).json({
        success: false,
        error: { code: 'SERVER_ERROR', message: 'Failed to get navigation tabs' },
      });
    }
  }

  // ============================================
  // Scrum-specific endpoints
  // ============================================

  async updateScrumConfig(req: Request, res: Response): Promise<void> {
    try {
      const { projectId } = req.params;

      if (!projectId || projectId === 'undefined' || projectId === 'null') {
        res.status(400).json({
          success: false,
          error: { code: 'VALIDATION_ERROR', message: 'Valid projectId is required' },
        });
        return;
      }

      const updates = req.body;

      const config = await methodologyService.updateScrumConfig(projectId, updates);
      if (!config) {
        res.status(404).json({
          success: false,
          error: { code: 'NOT_FOUND', message: 'Scrum config not found' },
        });
        return;
      }

      res.json({ success: true, data: config });
    } catch (error) {
      logger.error('Error updating scrum config:', error);
      res.status(500).json({
        success: false,
        error: { code: 'SERVER_ERROR', message: 'Failed to update scrum config' },
      });
    }
  }

  // ============================================
  // Kanban-specific endpoints
  // ============================================

  async updateKanbanColumns(req: Request, res: Response): Promise<void> {
    try {
      const { projectId } = req.params;
      const { columns } = req.body;

      if (!columns || !Array.isArray(columns)) {
        res.status(400).json({
          success: false,
          error: { code: 'VALIDATION_ERROR', message: 'columns array is required' },
        });
        return;
      }

      const config = await methodologyService.updateKanbanColumns(projectId, columns);
      if (!config) {
        res.status(404).json({
          success: false,
          error: { code: 'NOT_FOUND', message: 'Kanban config not found' },
        });
        return;
      }

      res.json({ success: true, data: config });
    } catch (error) {
      logger.error('Error updating kanban columns:', error);
      res.status(500).json({
        success: false,
        error: { code: 'SERVER_ERROR', message: 'Failed to update kanban columns' },
      });
    }
  }

  async updateWipLimits(req: Request, res: Response): Promise<void> {
    try {
      const { projectId } = req.params;
      const { wipLimits } = req.body;

      const config = await methodologyService.updateWipLimits(projectId, wipLimits);
      if (!config) {
        res.status(404).json({
          success: false,
          error: { code: 'NOT_FOUND', message: 'Kanban config not found' },
        });
        return;
      }

      res.json({ success: true, data: config });
    } catch (error) {
      logger.error('Error updating WIP limits:', error);
      res.status(500).json({
        success: false,
        error: { code: 'SERVER_ERROR', message: 'Failed to update WIP limits' },
      });
    }
  }

  // ============================================
  // Waterfall-specific endpoints
  // ============================================

  async updatePhases(req: Request, res: Response): Promise<void> {
    try {
      const { projectId } = req.params;
      const { phases } = req.body;

      if (!phases || !Array.isArray(phases)) {
        res.status(400).json({
          success: false,
          error: { code: 'VALIDATION_ERROR', message: 'phases array is required' },
        });
        return;
      }

      const config = await methodologyService.updatePhases(projectId, phases);
      if (!config) {
        res.status(404).json({
          success: false,
          error: { code: 'NOT_FOUND', message: 'Waterfall config not found' },
        });
        return;
      }

      res.json({ success: true, data: config });
    } catch (error) {
      logger.error('Error updating phases:', error);
      res.status(500).json({
        success: false,
        error: { code: 'SERVER_ERROR', message: 'Failed to update phases' },
      });
    }
  }

  async addMilestone(req: Request, res: Response): Promise<void> {
    try {
      const { projectId } = req.params;
      const milestone = req.body;

      if (!milestone.name || !milestone.dueDate) {
        res.status(400).json({
          success: false,
          error: { code: 'VALIDATION_ERROR', message: 'name and dueDate are required' },
        });
        return;
      }

      const config = await methodologyService.addMilestone(projectId, {
        ...milestone,
        id: milestone.id || `milestone_${Date.now()}`,
        status: milestone.status || 'upcoming',
      });

      if (!config) {
        res.status(404).json({
          success: false,
          error: { code: 'NOT_FOUND', message: 'Waterfall config not found' },
        });
        return;
      }

      res.json({ success: true, data: config });
    } catch (error) {
      logger.error('Error adding milestone:', error);
      res.status(500).json({
        success: false,
        error: { code: 'SERVER_ERROR', message: 'Failed to add milestone' },
      });
    }
  }

  // ============================================
  // ITIL-specific endpoints
  // ============================================

  async updateServiceCatalog(req: Request, res: Response): Promise<void> {
    try {
      const { projectId } = req.params;
      const { services } = req.body;

      const config = await methodologyService.updateServiceCatalog(projectId, services);
      if (!config) {
        res.status(404).json({
          success: false,
          error: { code: 'NOT_FOUND', message: 'ITIL config not found' },
        });
        return;
      }

      res.json({ success: true, data: config });
    } catch (error) {
      logger.error('Error updating service catalog:', error);
      res.status(500).json({
        success: false,
        error: { code: 'SERVER_ERROR', message: 'Failed to update service catalog' },
      });
    }
  }

  async updateSlaDefinitions(req: Request, res: Response): Promise<void> {
    try {
      const { projectId } = req.params;
      const { slas } = req.body;

      const config = await methodologyService.updateSlaDefinitions(projectId, slas);
      if (!config) {
        res.status(404).json({
          success: false,
          error: { code: 'NOT_FOUND', message: 'ITIL config not found' },
        });
        return;
      }

      res.json({ success: true, data: config });
    } catch (error) {
      logger.error('Error updating SLA definitions:', error);
      res.status(500).json({
        success: false,
        error: { code: 'SERVER_ERROR', message: 'Failed to update SLA definitions' },
      });
    }
  }

  // ============================================
  // OKR-specific endpoints
  // ============================================

  async addObjective(req: Request, res: Response): Promise<void> {
    try {
      const { projectId } = req.params;
      const objective = req.body;

      if (!objective.title || !objective.owner) {
        res.status(400).json({
          success: false,
          error: { code: 'VALIDATION_ERROR', message: 'title and owner are required' },
        });
        return;
      }

      const config = await methodologyService.addObjective(projectId, {
        ...objective,
        id: objective.id || `obj_${Date.now()}`,
        keyResults: objective.keyResults || [],
        status: objective.status || 'draft',
        progress: 0,
      });

      if (!config) {
        res.status(404).json({
          success: false,
          error: { code: 'NOT_FOUND', message: 'OKR config not found' },
        });
        return;
      }

      res.json({ success: true, data: config });
    } catch (error) {
      logger.error('Error adding objective:', error);
      res.status(500).json({
        success: false,
        error: { code: 'SERVER_ERROR', message: 'Failed to add objective' },
      });
    }
  }

  async updateObjective(req: Request, res: Response): Promise<void> {
    try {
      const { projectId, objectiveId } = req.params;
      const updates = req.body;

      const config = await methodologyService.updateObjective(projectId, objectiveId, updates);
      if (!config) {
        res.status(404).json({
          success: false,
          error: { code: 'NOT_FOUND', message: 'Objective not found' },
        });
        return;
      }

      res.json({ success: true, data: config });
    } catch (error) {
      logger.error('Error updating objective:', error);
      res.status(500).json({
        success: false,
        error: { code: 'SERVER_ERROR', message: 'Failed to update objective' },
      });
    }
  }
}

export const methodologyController = new MethodologyController();
