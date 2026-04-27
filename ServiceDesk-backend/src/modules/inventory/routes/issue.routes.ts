import { Router } from 'express';
import { authorize } from '../../../middleware/auth';
import { UserRole } from '../../../types';
import * as ctrl from '../controllers/issue.controller';

const router = Router();

router.get('/', ctrl.listIssues);
router.post('/', authorize(UserRole.SUPERVISOR, UserRole.MANAGER), ctrl.createIssue);

export default router;
