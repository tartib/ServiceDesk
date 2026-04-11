import { Router, Request, Response } from 'express';
import { param } from 'express-validator';
import * as ctrl from '../controllers/projectExtras.controller';
import { authenticate } from '../../../middleware/auth';
import { handleValidation } from '../../../shared/middleware/validate';

const router = Router();
router.use(authenticate);

const mongoIdParam = (name: string) => param(name).isMongoId().withMessage(`Invalid ${name}`);
const wrap = (fn: Function) => (req: Request, res: Response) => fn(req, res);

// ─── PHASES ───────────────────────────────────────────────────────────
router.get('/projects/:projectId/phases', [mongoIdParam('projectId')], handleValidation, wrap(ctrl.getPhases));
router.post('/projects/:projectId/phases', [mongoIdParam('projectId')], handleValidation, wrap(ctrl.createPhase));
router.patch('/phases/:phaseId', [mongoIdParam('phaseId')], handleValidation, wrap(ctrl.updatePhase));
router.delete('/phases/:phaseId', [mongoIdParam('phaseId')], handleValidation, wrap(ctrl.deletePhase));

// ─── GATES ────────────────────────────────────────────────────────────
router.get('/projects/:projectId/gates', [mongoIdParam('projectId')], handleValidation, wrap(ctrl.getGates));
router.post('/projects/:projectId/gates', [mongoIdParam('projectId')], handleValidation, wrap(ctrl.createGate));
router.patch('/gates/:gateId', [mongoIdParam('gateId')], handleValidation, wrap(ctrl.updateGate));

// ─── MILESTONES ───────────────────────────────────────────────────────
router.get('/projects/:projectId/milestones', [mongoIdParam('projectId')], handleValidation, wrap(ctrl.getMilestones));
router.post('/projects/:projectId/milestones', [mongoIdParam('projectId')], handleValidation, wrap(ctrl.createMilestone));
router.patch('/milestones/:milestoneId', [mongoIdParam('milestoneId')], handleValidation, wrap(ctrl.updateMilestone));
router.delete('/milestones/:milestoneId', [mongoIdParam('milestoneId')], handleValidation, wrap(ctrl.deleteMilestone));

// ─── IMPROVEMENTS ─────────────────────────────────────────────────────
router.get('/projects/:projectId/improvements', [mongoIdParam('projectId')], handleValidation, wrap(ctrl.getImprovements));
router.post('/projects/:projectId/improvements', [mongoIdParam('projectId')], handleValidation, wrap(ctrl.createImprovement));
router.patch('/improvements/:improvementId', [mongoIdParam('improvementId')], handleValidation, wrap(ctrl.updateImprovement));
router.post('/improvements/:improvementId/vote', [mongoIdParam('improvementId')], handleValidation, wrap(ctrl.voteImprovement));

// ─── VALUE STREAM ─────────────────────────────────────────────────────
router.get('/projects/:projectId/value-stream', [mongoIdParam('projectId')], handleValidation, wrap(ctrl.getValueStreamSteps));
router.post('/projects/:projectId/value-stream', [mongoIdParam('projectId')], handleValidation, wrap(ctrl.createValueStreamStep));
router.patch('/value-stream/:stepId', [mongoIdParam('stepId')], handleValidation, wrap(ctrl.updateValueStreamStep));
router.delete('/value-stream/:stepId', [mongoIdParam('stepId')], handleValidation, wrap(ctrl.deleteValueStreamStep));

// ─── PROJECT FILES ────────────────────────────────────────────────────
router.get('/projects/:projectId/files', [mongoIdParam('projectId')], handleValidation, wrap(ctrl.getProjectFiles));
router.post('/projects/:projectId/files', [mongoIdParam('projectId')], handleValidation, wrap(ctrl.createProjectFile));
router.delete('/files/:fileId', [mongoIdParam('fileId')], handleValidation, wrap(ctrl.deleteProjectFile));

// ─── NOTIFICATIONS ────────────────────────────────────────────────────
router.get('/projects/:projectId/notifications', [mongoIdParam('projectId')], handleValidation, wrap(ctrl.getNotifications));
router.patch('/notifications/:notificationId/read', [mongoIdParam('notificationId')], handleValidation, wrap(ctrl.markNotificationRead));
router.post('/projects/:projectId/notifications/read-all', [mongoIdParam('projectId')], handleValidation, wrap(ctrl.markAllNotificationsRead));
router.delete('/notifications/:notificationId', [mongoIdParam('notificationId')], handleValidation, wrap(ctrl.deleteNotification));

// ─── REPORTS ──────────────────────────────────────────────────────────
router.get('/projects/:projectId/reports', [mongoIdParam('projectId')], handleValidation, wrap(ctrl.getReports));
router.post('/projects/:projectId/reports', [mongoIdParam('projectId')], handleValidation, wrap(ctrl.createReport));
router.patch('/reports/:reportId', [mongoIdParam('reportId')], handleValidation, wrap(ctrl.updateReport));
router.delete('/reports/:reportId', [mongoIdParam('reportId')], handleValidation, wrap(ctrl.deleteReport));

export default router;
