/**
 * Core Module — Brand Settings Routes
 */

import { Router } from 'express';
import { authenticate, authorize } from '../../../middleware/auth';
import * as brandSettingsCtrl from '../controllers/brandSettings.controller';

const router = Router();

router.get('/', brandSettingsCtrl.getBrandSettings);
router.put('/', authenticate, authorize('admin'), brandSettingsCtrl.saveBrandSettings);
router.delete('/', authenticate, authorize('admin'), brandSettingsCtrl.resetBrandSettings);

export default router;
