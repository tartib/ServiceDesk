import { Router } from 'express';
import {
  createCategory,
  getAllCategories,
  getCategoryById,
  updateCategory,
  deleteCategory,
  hardDeleteCategory,
} from '../controllers/categoryController';
import { authenticate, authorize } from '../middleware/auth';
import { UserRole } from '../types';

const router = Router();

// All routes require authentication
router.use(authenticate);

// GET all categories - accessible to all authenticated users
router.get('/', getAllCategories);

// GET single category - accessible to all authenticated users
router.get('/:id', getCategoryById);

// POST create category - manager only
router.post('/', authorize(UserRole.MANAGER), createCategory);

// PUT update category - manager only
router.put('/:id', authorize(UserRole.MANAGER), updateCategory);

// DELETE soft delete category - manager only
router.delete('/:id', authorize(UserRole.MANAGER), deleteCategory);

// DELETE hard delete category - manager only
router.delete('/:id/permanent', authorize(UserRole.MANAGER), hardDeleteCategory);

export default router;
