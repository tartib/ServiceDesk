/**
 * Ops Module — Category Routes
 */

import { Router } from 'express';
import { authorize } from '../../../middleware/auth';
import { UserRole } from '../../../types';
import * as catCtrl from '../controllers/category.controller';

const router = Router();

router.get('/', catCtrl.getAllCategories);
router.get('/:id', catCtrl.getCategoryById);
router.post('/', authorize(UserRole.MANAGER), catCtrl.createCategory);
router.put('/:id', authorize(UserRole.MANAGER), catCtrl.updateCategory);
router.delete('/:id', authorize(UserRole.MANAGER), catCtrl.deleteCategory);
router.delete('/:id/permanent', authorize(UserRole.MANAGER), catCtrl.hardDeleteCategory);

export default router;
