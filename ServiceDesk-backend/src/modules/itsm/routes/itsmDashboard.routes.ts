import { Router } from 'express';
import itsmDashboardController from '../controllers/itsmDashboard.controller';
import { authorize } from '../../../middleware/auth';

const router = Router();

const VIEWER_ROLES = ['supervisor', 'manager'] as const;

router.use(authorize(...VIEWER_ROLES));

router.get('/', itsmDashboardController.getDashboard);
router.get('/incidents', itsmDashboardController.getIncidentKPIs);
router.get('/problems', itsmDashboardController.getProblemKPIs);
router.get('/changes', itsmDashboardController.getChangeKPIs);
router.get('/sla-compliance', itsmDashboardController.getSLACompliance);
router.get('/incident-trend', itsmDashboardController.getIncidentTrend);

export default router;
