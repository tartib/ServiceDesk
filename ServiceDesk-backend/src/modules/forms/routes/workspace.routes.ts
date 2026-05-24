/**
 * Workspace Routes — /api/v2/workspace
 */

import { Router } from 'express';
import { workspaceController } from '../controllers/workspace.controller';

const router = Router();

router.get('/types', workspaceController.listWorkspaceTypes);
router.get('/current', workspaceController.getCurrentWorkspace);
router.post('/setup', workspaceController.setupWorkspace);

export default router;
