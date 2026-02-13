import { Router } from 'express';
import { body, param } from 'express-validator';
import { authenticate } from '../middleware/auth';
import * as fileStorageController from '../controllers/fileStorage.controller';

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
  fileStorageController.createFolder
);

router.get('/', fileStorageController.getFolderContents);

router.get(
  '/:id',
  [param('id').isMongoId().withMessage('Invalid folder ID')],
  fileStorageController.getFolderContents
);

export default router;
