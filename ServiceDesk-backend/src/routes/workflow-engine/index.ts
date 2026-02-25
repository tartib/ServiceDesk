import { Router } from 'express';
import definitionRoutes from './definition.routes';
import instanceRoutes from './instance.routes';

const router = Router();

router.use('/definitions', definitionRoutes);
router.use('/instances', instanceRoutes);

export default router;
