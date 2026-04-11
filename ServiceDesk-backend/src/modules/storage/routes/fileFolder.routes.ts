/**
 * Storage Module — File Folder Routes
 */

import { Router } from 'express';
import { body, param } from 'express-validator';
import { authenticate } from '../../../middleware/auth';
import * as fileCtrl from '../controllers/fileStorage.controller';

const router = Router();

router.use(authenticate);

router.post(
  '/',
  [
    body('name').notEmpty().withMessage('Folder name is required').trim(),
    body('description').optional().isString().trim(),
    body('parentId').optional().isMongoId().withMessage('Invalid parent folder ID'),
    body('isPublic').optional().isBoolean(),
  ],
  fileCtrl.createFolder
);

router.get('/', fileCtrl.getFolderContents);

router.get(
  '/:id',
  [param('id').isMongoId().withMessage('Invalid folder ID')],
  fileCtrl.getFolderContents
);

export default router;
