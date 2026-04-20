/**
 * Portal Routes — /api/v2/portal
 */

import { Router } from 'express';
import { portalController } from './portal.controller';

const router = Router();

router.post('/tokens', portalController.issueToken);
router.post('/tokens/validate', portalController.validateToken);
router.delete('/tokens/:tokenId', portalController.revokeToken);
router.get('/tokens', portalController.listTokens);

router.get('/sessions/:sessionId', portalController.getSession);
router.post('/sessions/:sessionId/extend', portalController.extendSession);

export default router;
