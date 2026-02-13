/**
 * Form Template Routes - مسارات قوالب النماذج
 * Smart Forms System
 */

import { Router } from 'express';
import {
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
} from '../controllers/formTemplateController';

const router = Router();

// ============================================
// PUBLIC ROUTES - المسارات العامة
// ============================================

/**
 * @route   GET /api/v2/forms/templates/published
 * @desc    الحصول على قوالب النماذج المنشورة
 * @access  Public (authenticated)
 */
router.get('/published', getPublishedTemplates);

/**
 * @route   GET /api/v2/forms/templates/categories
 * @desc    الحصول على التصنيفات المتاحة
 * @access  Public (authenticated)
 */
router.get('/categories', getCategories);

// ============================================
// TEMPLATE CRUD ROUTES - مسارات CRUD للقوالب
// ============================================

/**
 * @route   POST /api/v2/forms/templates
 * @desc    إنشاء قالب نموذج جديد
 * @access  Admin/Manager
 */
router.post('/', createTemplate);

/**
 * @route   GET /api/v2/forms/templates
 * @desc    الحصول على قائمة قوالب النماذج
 * @access  Admin/Manager
 */
router.get('/', listTemplates);

/**
 * @route   GET /api/v2/forms/templates/:id
 * @desc    الحصول على قالب نموذج بواسطة المعرف
 * @access  Public (authenticated)
 */
router.get('/:id', getTemplate);

/**
 * @route   PATCH /api/v2/forms/templates/:id
 * @desc    تحديث قالب نموذج
 * @access  Admin/Manager
 */
router.patch('/:id', updateTemplate);

/**
 * @route   DELETE /api/v2/forms/templates/:id
 * @desc    حذف قالب نموذج
 * @access  Admin
 */
router.delete('/:id', deleteTemplate);

// ============================================
// TEMPLATE ACTIONS - إجراءات القالب
// ============================================

/**
 * @route   POST /api/v2/forms/templates/:id/publish
 * @desc    نشر قالب نموذج
 * @access  Admin/Manager
 */
router.post('/:id/publish', publishTemplate);

/**
 * @route   POST /api/v2/forms/templates/:id/unpublish
 * @desc    إلغاء نشر قالب نموذج
 * @access  Admin/Manager
 */
router.post('/:id/unpublish', unpublishTemplate);

/**
 * @route   POST /api/v2/forms/templates/:id/clone
 * @desc    نسخ قالب نموذج
 * @access  Admin/Manager
 */
router.post('/:id/clone', cloneTemplate);

/**
 * @route   POST /api/v2/forms/templates/:id/new-version
 * @desc    إنشاء نسخة جديدة من قالب منشور
 * @access  Admin/Manager
 */
router.post('/:id/new-version', createNewVersion);

/**
 * @route   POST /api/v2/forms/templates/:id/validate
 * @desc    التحقق من صحة قالب النموذج
 * @access  Admin/Manager
 */
router.post('/:id/validate', validateTemplate);

// ============================================
// FIELD ROUTES - مسارات الحقول
// ============================================

/**
 * @route   POST /api/v2/forms/templates/:id/fields
 * @desc    إضافة حقل إلى القالب
 * @access  Admin/Manager
 */
router.post('/:id/fields', addField);

/**
 * @route   PATCH /api/v2/forms/templates/:id/fields/:fieldId
 * @desc    تحديث حقل في القالب
 * @access  Admin/Manager
 */
router.patch('/:id/fields/:fieldId', updateField);

/**
 * @route   DELETE /api/v2/forms/templates/:id/fields/:fieldId
 * @desc    حذف حقل من القالب
 * @access  Admin/Manager
 */
router.delete('/:id/fields/:fieldId', removeField);

/**
 * @route   PUT /api/v2/forms/templates/:id/fields/reorder
 * @desc    إعادة ترتيب الحقول
 * @access  Admin/Manager
 */
router.put('/:id/fields/reorder', reorderFields);

// ============================================
// WORKFLOW & APPROVAL ROUTES - مسارات سير العمل والموافقات
// ============================================

/**
 * @route   PUT /api/v2/forms/templates/:id/workflow
 * @desc    تحديث سير العمل
 * @access  Admin/Manager
 */
router.put('/:id/workflow', updateWorkflow);

/**
 * @route   PUT /api/v2/forms/templates/:id/approval
 * @desc    تحديث تكوين الموافقات
 * @access  Admin/Manager
 */
router.put('/:id/approval', updateApproval);

// ============================================
// RULES ROUTES - مسارات القواعد
// ============================================

/**
 * @route   POST /api/v2/forms/templates/:id/conditional-rules
 * @desc    إضافة قاعدة شرطية
 * @access  Admin/Manager
 */
router.post('/:id/conditional-rules', addConditionalRule);

/**
 * @route   POST /api/v2/forms/templates/:id/business-rules
 * @desc    إضافة قاعدة تجارية
 * @access  Admin/Manager
 */
router.post('/:id/business-rules', addBusinessRule);

export default router;
