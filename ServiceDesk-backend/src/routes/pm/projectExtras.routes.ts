import { Router, Request, Response } from 'express';
import { param } from 'express-validator';
import * as ctrl from '../../controllers/pm/projectExtras.controller';
import { authenticate } from '../../middleware/auth';

const router = Router();
router.use(authenticate);

const mongoIdParam = (name: string) => param(name).isMongoId().withMessage(`Invalid ${name}`);
const wrap = (fn: Function) => (req: Request, res: Response) => fn(req as any, res);

// ─── PHASES ───────────────────────────────────────────────────────────
router.get('/projects/:projectId/phases', [mongoIdParam('projectId')], wrap(ctrl.getPhases));
router.post('/projects/:projectId/phases', [mongoIdParam('projectId')], wrap(ctrl.createPhase));
router.patch('/phases/:phaseId', [mongoIdParam('phaseId')], wrap(ctrl.updatePhase));
router.delete('/phases/:phaseId', [mongoIdParam('phaseId')], wrap(ctrl.deletePhase));

// ─── GATES ────────────────────────────────────────────────────────────
router.get('/projects/:projectId/gates', [mongoIdParam('projectId')], wrap(ctrl.getGates));
router.post('/projects/:projectId/gates', [mongoIdParam('projectId')], wrap(ctrl.createGate));
router.patch('/gates/:gateId', [mongoIdParam('gateId')], wrap(ctrl.updateGate));

// ─── MILESTONES ───────────────────────────────────────────────────────
router.get('/projects/:projectId/milestones', [mongoIdParam('projectId')], wrap(ctrl.getMilestones));
router.post('/projects/:projectId/milestones', [mongoIdParam('projectId')], wrap(ctrl.createMilestone));
router.patch('/milestones/:milestoneId', [mongoIdParam('milestoneId')], wrap(ctrl.updateMilestone));
router.delete('/milestones/:milestoneId', [mongoIdParam('milestoneId')], wrap(ctrl.deleteMilestone));

// ─── IMPROVEMENTS ─────────────────────────────────────────────────────
router.get('/projects/:projectId/improvements', [mongoIdParam('projectId')], wrap(ctrl.getImprovements));
router.post('/projects/:projectId/improvements', [mongoIdParam('projectId')], wrap(ctrl.createImprovement));
router.patch('/improvements/:improvementId', [mongoIdParam('improvementId')], wrap(ctrl.updateImprovement));
router.post('/improvements/:improvementId/vote', [mongoIdParam('improvementId')], wrap(ctrl.voteImprovement));

// ─── VALUE STREAM ─────────────────────────────────────────────────────
router.get('/projects/:projectId/value-stream', [mongoIdParam('projectId')], wrap(ctrl.getValueStreamSteps));
router.post('/projects/:projectId/value-stream', [mongoIdParam('projectId')], wrap(ctrl.createValueStreamStep));
router.patch('/value-stream/:stepId', [mongoIdParam('stepId')], wrap(ctrl.updateValueStreamStep));
router.delete('/value-stream/:stepId', [mongoIdParam('stepId')], wrap(ctrl.deleteValueStreamStep));

// ─── PROJECT FILES ────────────────────────────────────────────────────
router.get('/projects/:projectId/files', [mongoIdParam('projectId')], wrap(ctrl.getProjectFiles));
router.post('/projects/:projectId/files', [mongoIdParam('projectId')], wrap(ctrl.createProjectFile));
router.delete('/files/:fileId', [mongoIdParam('fileId')], wrap(ctrl.deleteProjectFile));

// ─── NOTIFICATIONS ────────────────────────────────────────────────────
router.get('/projects/:projectId/notifications', [mongoIdParam('projectId')], wrap(ctrl.getNotifications));
router.patch('/notifications/:notificationId/read', [mongoIdParam('notificationId')], wrap(ctrl.markNotificationRead));
router.post('/projects/:projectId/notifications/read-all', [mongoIdParam('projectId')], wrap(ctrl.markAllNotificationsRead));
router.delete('/notifications/:notificationId', [mongoIdParam('notificationId')], wrap(ctrl.deleteNotification));

// ─── REPORTS ──────────────────────────────────────────────────────────
router.get('/projects/:projectId/reports', [mongoIdParam('projectId')], wrap(ctrl.getReports));
router.post('/projects/:projectId/reports', [mongoIdParam('projectId')], wrap(ctrl.createReport));
router.patch('/reports/:reportId', [mongoIdParam('reportId')], wrap(ctrl.updateReport));
router.delete('/reports/:reportId', [mongoIdParam('reportId')], wrap(ctrl.deleteReport));

export default router;
