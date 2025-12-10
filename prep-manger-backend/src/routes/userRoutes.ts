import { Router } from 'express';
import { getAllUsers, getUsersByRole, getUserById } from '../controllers/userController';
import { authenticate } from '../middleware/auth';

const router = Router();

// All routes require authentication
router.use(authenticate);

// GET all active users
router.get('/', getAllUsers);

// GET users by role
router.get('/role/:role', getUsersByRole);

// GET user by ID
router.get('/:id', getUserById);

export default router;
