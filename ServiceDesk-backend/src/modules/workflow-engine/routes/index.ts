import { Router } from 'express';
import definitionRoutes from './definition.routes';
import instanceRoutes from './instance.routes';
import externalTaskRoutes from './externalTask.routes';

const router = Router();

router.use('/definitions', definitionRoutes);
router.use('/instances', instanceRoutes);
router.use('/external-tasks', externalTaskRoutes);

export default router;
