import { Router } from 'express';
import {
  createProduct,
  getAllProducts,
  getProductById,
  updateProduct,
  deleteProduct,
  hardDeleteProduct,
} from '../controllers/productController';
import { authenticate, authorize } from '../middleware/auth';
import { uploadProductImage } from '../middleware/upload';
import { UserRole } from '../types';

const router = Router();

// All routes require authentication
router.use(authenticate);

// GET all products - accessible to all authenticated users
router.get('/', getAllProducts);

// GET single product - accessible to all authenticated users
router.get('/:id', getProductById);

// POST create product - supervisor and manager only (with image upload)
router.post('/', authorize(UserRole.SUPERVISOR, UserRole.MANAGER), uploadProductImage, createProduct);

// PUT update product - supervisor and manager only (with image upload)
router.put('/:id', authorize(UserRole.SUPERVISOR, UserRole.MANAGER), uploadProductImage, updateProduct);

// DELETE soft delete product - manager only
router.delete('/:id', authorize(UserRole.MANAGER), deleteProduct);

// DELETE hard delete product - manager only
router.delete('/:id/permanent', authorize(UserRole.MANAGER), hardDeleteProduct);

export default router;
