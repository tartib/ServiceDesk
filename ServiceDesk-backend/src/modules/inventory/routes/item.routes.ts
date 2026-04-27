import { Router } from 'express';
import { authorize } from '../../../middleware/auth';
import { UserRole } from '../../../types';
import * as ctrl from '../controllers/item.controller';

const router = Router();

router.get('/', ctrl.listItems);
router.get('/:id', ctrl.getItem);
router.post('/', authorize(UserRole.MANAGER), ctrl.createItem);
router.put('/:id', authorize(UserRole.MANAGER), ctrl.updateItem);
router.delete('/:id', authorize(UserRole.MANAGER), ctrl.deactivateItem);

export default router;
