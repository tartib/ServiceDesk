import { Router } from 'express';
import { methodologyController } from '../../controllers/pm/methodology.controller';

const router = Router();

/**
 * @swagger
 * /api/v1/pm/{projectId}/methodology:
 *   get:
 *     summary: الحصول على إعدادات المنهجية
 *     description: استرجاع إعدادات المنهجية للمشروع
 *     tags:
 *       - Methodology
 *     parameters:
 *       - in: path
 *         name: projectId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: إعدادات المنهجية
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *   post:
 *     summary: تهيئة المنهجية
 *     description: تهيئة منهجية جديدة للمشروع
 *     tags:
 *       - Methodology
 *     parameters:
 *       - in: path
 *         name: projectId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       201:
 *         description: تم تهيئة المنهجية بنجاح
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *   put:
 *     summary: تحديث إعدادات المنهجية
 *     description: تحديث إعدادات المنهجية للمشروع
 *     tags:
 *       - Methodology
 *     parameters:
 *       - in: path
 *         name: projectId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: تم تحديث المنهجية بنجاح
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 */
router.get('/:projectId/methodology', methodologyController.getMethodologyConfig.bind(methodologyController));
router.post('/:projectId/methodology', methodologyController.initializeMethodology.bind(methodologyController));
router.put('/:projectId/methodology', methodologyController.updateMethodologyConfig.bind(methodologyController));

/**
 * @swagger
 * /api/v1/pm/{projectId}/methodology/change:
 *   post:
 *     summary: تغيير المنهجية
 *     description: تغيير منهجية المشروع
 *     tags:
 *       - Methodology
 *     parameters:
 *       - in: path
 *         name: projectId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: تم تغيير المنهجية بنجاح
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 */
router.post('/:projectId/methodology/change', methodologyController.changeMethodology.bind(methodologyController));

/**
 * @swagger
 * /api/v1/pm/{projectId}/methodology/navigation:
 *   get:
 *     summary: الحصول على علامات التنقل
 *     description: استرجاع علامات التنقل للمنهجية
 *     tags:
 *       - Methodology
 *     parameters:
 *       - in: path
 *         name: projectId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: علامات التنقل
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 */
router.get('/:projectId/methodology/navigation', methodologyController.getNavigationTabs.bind(methodologyController));

// Scrum-specific routes
router.put('/:projectId/methodology/scrum', methodologyController.updateScrumConfig.bind(methodologyController));

// Kanban-specific routes
router.put('/:projectId/methodology/kanban/columns', methodologyController.updateKanbanColumns.bind(methodologyController));
router.put('/:projectId/methodology/kanban/wip', methodologyController.updateWipLimits.bind(methodologyController));

// Waterfall-specific routes
router.put('/:projectId/methodology/waterfall/phases', methodologyController.updatePhases.bind(methodologyController));
router.post('/:projectId/methodology/waterfall/milestones', methodologyController.addMilestone.bind(methodologyController));

// ITIL-specific routes
router.put('/:projectId/methodology/itil/services', methodologyController.updateServiceCatalog.bind(methodologyController));
router.put('/:projectId/methodology/itil/sla', methodologyController.updateSlaDefinitions.bind(methodologyController));

// OKR-specific routes
router.post('/:projectId/methodology/okr/objectives', methodologyController.addObjective.bind(methodologyController));
router.put('/:projectId/methodology/okr/objectives/:objectiveId', methodologyController.updateObjective.bind(methodologyController));

export default router;
