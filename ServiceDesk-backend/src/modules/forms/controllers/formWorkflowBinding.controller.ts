/**
 * Form Workflow Binding Controller
 *
 * Exposes the FormWorkflowBindingService over REST.
 * Routes: GET/POST on /forms/definitions/:formId/workflow-binding/*
 */

import { Request, Response } from 'express';
import formWorkflowBindingService from '../services/FormWorkflowBindingService';

export const getBindingStatus = async (req: Request, res: Response) => {
  try {
    const status = await formWorkflowBindingService.getBindingStatus(req.params.formId);
    res.json(status);
  } catch (error: any) {
    if (error.message?.includes('not found')) {
      res.status(404).json({ success: false, error: error.message });
    } else {
      res.status(500).json({ success: false, error: error.message });
    }
  }
};

export const bindWorkflow = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ success: false, error: 'User not authenticated' });
    const { workflowDefinitionId } = req.body;
    if (!workflowDefinitionId) {
      return res.status(400).json({ success: false, error: 'workflowDefinitionId is required' });
    }
    await formWorkflowBindingService.bindWorkflow(req.params.formId, {
      workflowDefinitionId,
      updatedBy: userId,
    });
    const status = await formWorkflowBindingService.getBindingStatus(req.params.formId);
    res.json(status);
  } catch (error: any) {
    if (error.message?.includes('not found')) {
      res.status(404).json({ success: false, error: error.message });
    } else {
      res.status(400).json({ success: false, error: error.message });
    }
  }
};

export const unbindWorkflow = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ success: false, error: 'User not authenticated' });
    await formWorkflowBindingService.unbindWorkflow(req.params.formId, { updatedBy: userId });
    const status = await formWorkflowBindingService.getBindingStatus(req.params.formId);
    res.json(status);
  } catch (error: any) {
    if (error.message?.includes('not found')) {
      res.status(404).json({ success: false, error: error.message });
    } else {
      res.status(400).json({ success: false, error: error.message });
    }
  }
};

export const disableWorkflow = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ success: false, error: 'User not authenticated' });
    await formWorkflowBindingService.disableWorkflow(req.params.formId, userId);
    const status = await formWorkflowBindingService.getBindingStatus(req.params.formId);
    res.json(status);
  } catch (error: any) {
    if (error.message?.includes('not found')) {
      res.status(404).json({ success: false, error: error.message });
    } else {
      res.status(400).json({ success: false, error: error.message });
    }
  }
};
