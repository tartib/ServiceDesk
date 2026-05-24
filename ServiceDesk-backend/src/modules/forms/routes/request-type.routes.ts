/**
 * RequestType Routes — /api/v2/forms/request-types
 */

import { Router } from 'express';
import {
  listRequestTypes,
  getRequestType,
  createRequestType,
  updateRequestType,
  deleteRequestType,
} from '../controllers/requestType.controller';

const router = Router();

router.get('/', listRequestTypes);
router.get('/:id', getRequestType);
router.post('/', createRequestType);
router.patch('/:id', updateRequestType);
router.delete('/:id', deleteRequestType);

export default router;
