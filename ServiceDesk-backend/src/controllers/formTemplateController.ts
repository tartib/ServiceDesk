/**
 * Form Template Controller - متحكم قوالب النماذج
 * Smart Forms System
 */

import { Request, Response } from 'express';
import container from '../infrastructure/di/container';

/**
 * إنشاء قالب نموذج جديد
 * POST /api/v2/forms/templates
 */
export const createTemplate = async (req: Request, res: Response) => {
  try {
    const formTemplateService = container.resolve('formTemplateService');
    const userId = req.user?.id;
    const siteId = req.user?.site_id;

    const template = await formTemplateService.createTemplate({
      ...req.body,
      created_by: userId,
      site_id: siteId,
    });

    res.status(201).json({
      success: true,
      data: template,
      message: 'Form template created successfully',
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      error: error.message,
    });
  }
};

/**
 * الحصول على قائمة قوالب النماذج
 * GET /api/v2/forms/templates
 */
export const listTemplates = async (req: Request, res: Response) => {
  try {
    const formTemplateService = container.resolve('formTemplateService');
    const {
      page,
      limit,
      category,
      is_published,
      search,
      sort_by,
      sort_order,
    } = req.query;

    const siteId = req.user?.site_id;

    const result = await formTemplateService.listTemplates({
      page: page ? parseInt(page as string) : undefined,
      limit: limit ? parseInt(limit as string) : undefined,
      category: category as string,
      is_published: is_published === 'true' ? true : is_published === 'false' ? false : undefined,
      search: search as string,
      site_id: siteId,
      sort_by: sort_by as string,
      sort_order: sort_order as 'asc' | 'desc',
    });

    res.json({
      success: true,
      data: result.templates,
      pagination: {
        total: result.total,
        page: result.page,
        limit: result.limit,
        total_pages: result.total_pages,
      },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

/**
 * الحصول على قالب نموذج بواسطة المعرف
 * GET /api/v2/forms/templates/:id
 */
export const getTemplate = async (req: Request, res: Response) => {
  try {
    const formTemplateService = container.resolve('formTemplateService');
    const { id } = req.params;

    const template = await formTemplateService.getTemplateById(id);

    if (!template) {
      return res.status(404).json({
        success: false,
        error: 'Form template not found',
      });
    }

    res.json({
      success: true,
      data: template,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

/**
 * تحديث قالب نموذج
 * PATCH /api/v2/forms/templates/:id
 */
export const updateTemplate = async (req: Request, res: Response) => {
  try {
    const formTemplateService = container.resolve('formTemplateService');
    const { id } = req.params;
    const userId = req.user?.id;

    const template = await formTemplateService.updateTemplate(id, {
      ...req.body,
      updated_by: userId,
    });

    if (!template) {
      return res.status(404).json({
        success: false,
        error: 'Form template not found',
      });
    }

    res.json({
      success: true,
      data: template,
      message: 'Form template updated successfully',
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      error: error.message,
    });
  }
};

/**
 * حذف قالب نموذج
 * DELETE /api/v2/forms/templates/:id
 */
export const deleteTemplate = async (req: Request, res: Response) => {
  try {
    const formTemplateService = container.resolve('formTemplateService');
    const { id } = req.params;

    await formTemplateService.deleteTemplate(id);

    res.json({
      success: true,
      message: 'Form template deleted successfully',
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      error: error.message,
    });
  }
};

/**
 * نشر قالب نموذج
 * POST /api/v2/forms/templates/:id/publish
 */
export const publishTemplate = async (req: Request, res: Response) => {
  try {
    const formTemplateService = container.resolve('formTemplateService');
    const { id } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'User ID is required',
      });
    }

    const template = await formTemplateService.publishTemplate(id, userId);

    if (!template) {
      return res.status(404).json({
        success: false,
        error: 'Form template not found',
      });
    }

    res.json({
      success: true,
      data: template,
      message: 'Form template published successfully',
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      error: error.message,
    });
  }
};

/**
 * إلغاء نشر قالب نموذج
 * POST /api/v2/forms/templates/:id/unpublish
 */
export const unpublishTemplate = async (req: Request, res: Response) => {
  try {
    const formTemplateService = container.resolve('formTemplateService');
    const { id } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'User not authenticated',
      });
    }

    const template = await formTemplateService.unpublishTemplate(id, userId);

    if (!template) {
      return res.status(404).json({
        success: false,
        error: 'Form template not found',
      });
    }

    res.json({
      success: true,
      data: template,
      message: 'Form template unpublished successfully',
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      error: error.message,
    });
  }
};

/**
 * نسخ قالب نموذج
 * POST /api/v2/forms/templates/:id/clone
 */
export const cloneTemplate = async (req: Request, res: Response) => {
  try {
    const formTemplateService = container.resolve('formTemplateService');
    const { id } = req.params;
    const { name, name_ar } = req.body;
    const userId = req.user?.id;

    if (!name || !name_ar || !userId) {
      return res.status(400).json({
        success: false,
        error: 'Name and Arabic name are required',
      });
    }

    const template = await formTemplateService.cloneTemplate(id, name, name_ar, userId);

    res.status(201).json({
      success: true,
      data: template,
      message: 'Form template cloned successfully',
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      error: error.message,
    });
  }
};

/**
 * إنشاء نسخة جديدة من قالب منشور
 * POST /api/v2/forms/templates/:id/new-version
 */
export const createNewVersion = async (req: Request, res: Response) => {
  try {
    const formTemplateService = container.resolve('formTemplateService');
    const { id } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      res.status(401).json({
        success: false,
        error: 'User ID is required',
      });
      return;
    }

    const template = await formTemplateService.createNewVersion(id, userId);

    res.status(201).json({
      success: true,
      data: template,
      message: 'New version created successfully',
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      error: error.message,
    });
  }
};

/**
 * التحقق من صحة قالب النموذج
 * POST /api/v2/forms/templates/:id/validate
 */
export const validateTemplate = async (req: Request, res: Response) => {
  try {
    const formTemplateService = container.resolve('formTemplateService');
    const { id } = req.params;

    const template = await formTemplateService.getTemplateById(id);

    if (!template) {
      return res.status(404).json({
        success: false,
        error: 'Form template not found',
      });
    }

    const validation = formTemplateService.validateTemplate(template);

    res.json({
      success: true,
      data: validation,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

/**
 * الحصول على قوالب النماذج المنشورة
 * GET /api/v2/forms/templates/published
 */
export const getPublishedTemplates = async (req: Request, res: Response) => {
  try {
    const formTemplateService = container.resolve('formTemplateService');
    const siteId = req.user?.site_id;

    const templates = await formTemplateService.getPublishedTemplates(siteId);

    res.json({
      success: true,
      data: templates,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

/**
 * الحصول على التصنيفات المتاحة
 * GET /api/v2/forms/templates/categories
 */
export const getCategories = async (req: Request, res: Response) => {
  try {
    const formTemplateService = container.resolve('formTemplateService');
    const siteId = req.user?.site_id;

    const categories = await formTemplateService.getCategories(siteId);

    res.json({
      success: true,
      data: categories,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

/**
 * إضافة حقل إلى القالب
 * POST /api/v2/forms/templates/:id/fields
 */
export const addField = async (req: Request, res: Response) => {
  try {
    const formTemplateService = container.resolve('formTemplateService');
    const { id } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'User ID is required',
      });
    }

    const template = await formTemplateService.addField(id, req.body, userId);

    if (!template) {
      return res.status(404).json({
        success: false,
        error: 'Form template not found',
      });
    }

    res.json({
      success: true,
      data: template,
      message: 'Field added successfully',
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      error: error.message,
    });
  }
};

/**
 * تحديث حقل في القالب
 * PATCH /api/v2/forms/templates/:id/fields/:fieldId
 */
export const updateField = async (req: Request, res: Response) => {
  try {
    const formTemplateService = container.resolve('formTemplateService');
    const { id, fieldId } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'User not authenticated',
      });
    }

    const template = await formTemplateService.updateField(id, fieldId, req.body, userId);

    if (!template) {
      return res.status(404).json({
        success: false,
        error: 'Form template not found',
      });
    }

    res.json({
      success: true,
      data: template,
      message: 'Field updated successfully',
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      error: error.message,
    });
  }
};

/**
 * حذف حقل من القالب
 * DELETE /api/v2/forms/templates/:id/fields/:fieldId
 */
export const removeField = async (req: Request, res: Response) => {
  try {
    const formTemplateService = container.resolve('formTemplateService');
    const { id, fieldId } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'User ID is required',
      });
    }

    const template = await formTemplateService.removeField(id, fieldId, userId);

    if (!template) {
      return res.status(404).json({
        success: false,
        error: 'Form template not found',
      });
    }

    res.json({
      success: true,
      data: template,
      message: 'Field removed successfully',
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      error: error.message,
    });
  }
};

/**
 * إعادة ترتيب الحقول
 * PUT /api/v2/forms/templates/:id/fields/reorder
 */
export const reorderFields = async (req: Request, res: Response) => {
  try {
    const formTemplateService = container.resolve('formTemplateService');
    const { id } = req.params;
    const { field_orders } = req.body;
    const userId = req.user?.id;

    if (!field_orders || !Array.isArray(field_orders)) {
      return res.status(400).json({
        success: false,
        error: 'field_orders array is required',
      });
    }

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'User ID is required',
      });
    }

    const template = await formTemplateService.reorderFields(id, field_orders, userId);

    if (!template) {
      return res.status(404).json({
        success: false,
        error: 'Form template not found',
      });
    }

    res.json({
      success: true,
      data: template,
      message: 'Fields reordered successfully',
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      error: error.message,
    });
  }
};

/**
 * تحديث سير العمل
 * PUT /api/v2/forms/templates/:id/workflow
 */
export const updateWorkflow = async (req: Request, res: Response) => {
  try {
    const formTemplateService = container.resolve('formTemplateService');
    const { id } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'User not authenticated',
      });
    }

    const template = await formTemplateService.updateWorkflow(id, req.body, userId);

    if (!template) {
      return res.status(404).json({
        success: false,
        error: 'Form template not found',
      });
    }

    res.json({
      success: true,
      data: template,
      message: 'Workflow updated successfully',
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      error: error.message,
    });
  }
};

/**
 * تحديث تكوين الموافقات
 * PUT /api/v2/forms/templates/:id/approval
 */
export const updateApproval = async (req: Request, res: Response) => {
  try {
    const formTemplateService = container.resolve('formTemplateService');
    const { id } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'User not authenticated',
      });
    }

    const template = await formTemplateService.updateApproval(id, req.body, userId);

    if (!template) {
      return res.status(404).json({
        success: false,
        error: 'Form template not found',
      });
    }

    res.json({
      success: true,
      data: template,
      message: 'Approval configuration updated successfully',
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      error: error.message,
    });
  }
};

/**
 * إضافة قاعدة شرطية
 * POST /api/v2/forms/templates/:id/conditional-rules
 */
export const addConditionalRule = async (req: Request, res: Response) => {
  try {
    const formTemplateService = container.resolve('formTemplateService');
    const { id } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized',
      });
    }

    const template = await formTemplateService.addConditionalRule(id, req.body, userId);

    if (!template) {
      return res.status(404).json({
        success: false,
        error: 'Form template not found',
      });
    }

    res.json({
      success: true,
      data: template,
      message: 'Conditional rule added successfully',
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      error: error.message,
    });
  }
};

/**
 * إضافة قاعدة تجارية
 * POST /api/v2/forms/templates/:id/business-rules
 */
export const addBusinessRule = async (req: Request, res: Response) => {
  try {
    const formTemplateService = container.resolve('formTemplateService');
    const { id } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized: User ID not found',
      });
    }

    const template = await formTemplateService.addBusinessRule(id, {
      ...req.body,
      created_by: userId,
      created_at: new Date(),
      updated_at: new Date(),
    }, userId);

    if (!template) {
      return res.status(404).json({
        success: false,
        error: 'Form template not found',
      });
    }

    res.json({
      success: true,
      data: template,
      message: 'Business rule added successfully',
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      error: error.message,
    });
  }
};

export default {
  createTemplate,
  listTemplates,
  getTemplate,
  updateTemplate,
  deleteTemplate,
  publishTemplate,
  unpublishTemplate,
  cloneTemplate,
  createNewVersion,
  validateTemplate,
  getPublishedTemplates,
  getCategories,
  addField,
  updateField,
  removeField,
  reorderFields,
  updateWorkflow,
  updateApproval,
  addConditionalRule,
  addBusinessRule,
};
