import { Router } from 'express';
import * as ctrl from '../controllers/movement.controller';

const router = Router();

router.get('/', ctrl.listMovements);

export default router;
