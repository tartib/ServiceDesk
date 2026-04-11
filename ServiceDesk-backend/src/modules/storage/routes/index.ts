/**
 * Storage Module — Route Index
 *
 * Mounts file storage and folder sub-routers.
 */

import { Router } from 'express';
import fileStorageRoutes from './fileStorage.routes';
import fileFolderRoutes from './fileFolder.routes';

const router = Router();

router.use('/files', fileStorageRoutes);
router.use('/folders', fileFolderRoutes);

export default router;
