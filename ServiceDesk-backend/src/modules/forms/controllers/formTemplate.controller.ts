import { Request, Response } from 'express';
import container from '../../../infrastructure/di/container';

export const createTemplate = async (req: Request, res: Response) => {
  try {
    const formTemplateService = container.resolve('formTemplateService');
    const template = await formTemplateService.createTemplate({ ...req.body, created_by: req.user?.id, site_id: req.user?.site_id });
    res.status(201).json({ success: true, data: template, message: 'Form template created successfully' });
  } catch (error: any) { res.status(400).json({ success: false, error: error.message }); }
};

export const listTemplates = async (req: Request, res: Response) => {
  try {
    const formTemplateService = container.resolve('formTemplateService');
    const { page, limit, category, is_published, search, sort_by, sort_order } = req.query;
    const result = await formTemplateService.listTemplates({
      page: page ? parseInt(page as string) : undefined, limit: limit ? parseInt(limit as string) : undefined,
      category: category as string, is_published: is_published === 'true' ? true : is_published === 'false' ? false : undefined,
      search: search as string, site_id: req.user?.site_id, sort_by: sort_by as string, sort_order: sort_order as 'asc' | 'desc',
    });
    res.json({ success: true, data: result.templates, pagination: { total: result.total, page: result.page, limit: result.limit, total_pages: result.total_pages } });
  } catch (error: any) { res.status(500).json({ success: false, error: error.message }); }
};

export const getTemplate = async (req: Request, res: Response) => {
  try {
    const formTemplateService = container.resolve('formTemplateService');
    const template = await formTemplateService.getTemplateById(req.params.id);
    if (!template) return res.status(404).json({ success: false, error: 'Form template not found' });
    res.json({ success: true, data: template });
  } catch (error: any) { res.status(500).json({ success: false, error: error.message }); }
};

export const updateTemplate = async (req: Request, res: Response) => {
  try {
    const formTemplateService = container.resolve('formTemplateService');
    const template = await formTemplateService.updateTemplate(req.params.id, { ...req.body, updated_by: req.user?.id });
    if (!template) return res.status(404).json({ success: false, error: 'Form template not found' });
    res.json({ success: true, data: template, message: 'Form template updated successfully' });
  } catch (error: any) { res.status(400).json({ success: false, error: error.message }); }
};

export const deleteTemplate = async (req: Request, res: Response) => {
  try {
    const formTemplateService = container.resolve('formTemplateService');
    await formTemplateService.deleteTemplate(req.params.id);
    res.json({ success: true, message: 'Form template deleted successfully' });
  } catch (error: any) { res.status(400).json({ success: false, error: error.message }); }
};

export const publishTemplate = async (req: Request, res: Response) => {
  try {
    const formTemplateService = container.resolve('formTemplateService');
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ success: false, error: 'User ID is required' });
    const template = await formTemplateService.publishTemplate(req.params.id, userId);
    if (!template) return res.status(404).json({ success: false, error: 'Form template not found' });
    res.json({ success: true, data: template, message: 'Form template published successfully' });
  } catch (error: any) { res.status(400).json({ success: false, error: error.message }); }
};

export const unpublishTemplate = async (req: Request, res: Response) => {
  try {
    const formTemplateService = container.resolve('formTemplateService');
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ success: false, error: 'User not authenticated' });
    const template = await formTemplateService.unpublishTemplate(req.params.id, userId);
    if (!template) return res.status(404).json({ success: false, error: 'Form template not found' });
    res.json({ success: true, data: template, message: 'Form template unpublished successfully' });
  } catch (error: any) { res.status(400).json({ success: false, error: error.message }); }
};

export const cloneTemplate = async (req: Request, res: Response) => {
  try {
    const formTemplateService = container.resolve('formTemplateService');
    const { name, name_ar } = req.body;
    const userId = req.user?.id;
    if (!name || !name_ar || !userId) return res.status(400).json({ success: false, error: 'Name and Arabic name are required' });
    const template = await formTemplateService.cloneTemplate(req.params.id, name, name_ar, userId);
    res.status(201).json({ success: true, data: template, message: 'Form template cloned successfully' });
  } catch (error: any) { res.status(400).json({ success: false, error: error.message }); }
};

export const createNewVersion = async (req: Request, res: Response) => {
  try {
    const formTemplateService = container.resolve('formTemplateService');
    const userId = req.user?.id;
    if (!userId) { res.status(401).json({ success: false, error: 'User ID is required' }); return; }
    const template = await formTemplateService.createNewVersion(req.params.id, userId);
    res.status(201).json({ success: true, data: template, message: 'New version created successfully' });
  } catch (error: any) { res.status(400).json({ success: false, error: error.message }); }
};

export const validateTemplate = async (req: Request, res: Response) => {
  try {
    const formTemplateService = container.resolve('formTemplateService');
    const template = await formTemplateService.getTemplateById(req.params.id);
    if (!template) return res.status(404).json({ success: false, error: 'Form template not found' });
    const validation = formTemplateService.validateTemplate(template);
    res.json({ success: true, data: validation });
  } catch (error: any) { res.status(500).json({ success: false, error: error.message }); }
};

export const getPublishedTemplates = async (req: Request, res: Response) => {
  try {
    const formTemplateService = container.resolve('formTemplateService');
    const templates = await formTemplateService.getPublishedTemplates(req.user?.site_id);
    res.json({ success: true, data: templates });
  } catch (error: any) { res.status(500).json({ success: false, error: error.message }); }
};

export const getCategories = async (req: Request, res: Response) => {
  try {
    const formTemplateService = container.resolve('formTemplateService');
    const categories = await formTemplateService.getCategories(req.user?.site_id);
    res.json({ success: true, data: categories });
  } catch (error: any) { res.status(500).json({ success: false, error: error.message }); }
};

export const addField = async (req: Request, res: Response) => {
  try {
    const formTemplateService = container.resolve('formTemplateService');
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ success: false, error: 'User ID is required' });
    const template = await formTemplateService.addField(req.params.id, req.body, userId);
    if (!template) return res.status(404).json({ success: false, error: 'Form template not found' });
    res.json({ success: true, data: template, message: 'Field added successfully' });
  } catch (error: any) { res.status(400).json({ success: false, error: error.message }); }
};

export const updateField = async (req: Request, res: Response) => {
  try {
    const formTemplateService = container.resolve('formTemplateService');
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ success: false, error: 'User not authenticated' });
    const template = await formTemplateService.updateField(req.params.id, req.params.fieldId, req.body, userId);
    if (!template) return res.status(404).json({ success: false, error: 'Form template not found' });
    res.json({ success: true, data: template, message: 'Field updated successfully' });
  } catch (error: any) { res.status(400).json({ success: false, error: error.message }); }
};

export const removeField = async (req: Request, res: Response) => {
  try {
    const formTemplateService = container.resolve('formTemplateService');
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ success: false, error: 'User ID is required' });
    const template = await formTemplateService.removeField(req.params.id, req.params.fieldId, userId);
    if (!template) return res.status(404).json({ success: false, error: 'Form template not found' });
    res.json({ success: true, data: template, message: 'Field removed successfully' });
  } catch (error: any) { res.status(400).json({ success: false, error: error.message }); }
};

export const reorderFields = async (req: Request, res: Response) => {
  try {
    const formTemplateService = container.resolve('formTemplateService');
    const { field_orders } = req.body;
    const userId = req.user?.id;
    if (!field_orders || !Array.isArray(field_orders)) return res.status(400).json({ success: false, error: 'field_orders array is required' });
    if (!userId) return res.status(401).json({ success: false, error: 'User ID is required' });
    const template = await formTemplateService.reorderFields(req.params.id, field_orders, userId);
    if (!template) return res.status(404).json({ success: false, error: 'Form template not found' });
    res.json({ success: true, data: template, message: 'Fields reordered successfully' });
  } catch (error: any) { res.status(400).json({ success: false, error: error.message }); }
};

export const updateWorkflow = async (req: Request, res: Response) => {
  try {
    const formTemplateService = container.resolve('formTemplateService');
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ success: false, error: 'User not authenticated' });
    const template = await formTemplateService.updateWorkflow(req.params.id, req.body, userId);
    if (!template) return res.status(404).json({ success: false, error: 'Form template not found' });
    res.json({ success: true, data: template, message: 'Workflow updated successfully' });
  } catch (error: any) { res.status(400).json({ success: false, error: error.message }); }
};

export const updateApproval = async (req: Request, res: Response) => {
  try {
    const formTemplateService = container.resolve('formTemplateService');
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ success: false, error: 'User not authenticated' });
    const template = await formTemplateService.updateApproval(req.params.id, req.body, userId);
    if (!template) return res.status(404).json({ success: false, error: 'Form template not found' });
    res.json({ success: true, data: template, message: 'Approval configuration updated successfully' });
  } catch (error: any) { res.status(400).json({ success: false, error: error.message }); }
};

export const addConditionalRule = async (req: Request, res: Response) => {
  try {
    const formTemplateService = container.resolve('formTemplateService');
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ success: false, error: 'Unauthorized' });
    const template = await formTemplateService.addConditionalRule(req.params.id, req.body, userId);
    if (!template) return res.status(404).json({ success: false, error: 'Form template not found' });
    res.json({ success: true, data: template, message: 'Conditional rule added successfully' });
  } catch (error: any) { res.status(400).json({ success: false, error: error.message }); }
};

export const addBusinessRule = async (req: Request, res: Response) => {
  try {
    const formTemplateService = container.resolve('formTemplateService');
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ success: false, error: 'Unauthorized: User ID not found' });
    const template = await formTemplateService.addBusinessRule(req.params.id, { ...req.body, created_by: userId, created_at: new Date(), updated_at: new Date() }, userId);
    if (!template) return res.status(404).json({ success: false, error: 'Form template not found' });
    res.json({ success: true, data: template, message: 'Business rule added successfully' });
  } catch (error: any) { res.status(400).json({ success: false, error: error.message }); }
};
