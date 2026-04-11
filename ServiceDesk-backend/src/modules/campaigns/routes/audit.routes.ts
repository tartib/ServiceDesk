import { Router } from 'express';
import * as ctrl from '../controllers/audit.controller';

const router = Router();

router.get('/', ctrl.listAuditEntries);
router.get('/entity/:entityId', ctrl.getEntityAuditTrail);

export default router;
