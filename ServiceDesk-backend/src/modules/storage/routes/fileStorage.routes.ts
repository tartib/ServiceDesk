/**
 * Storage Module — File Storage Routes
 */

import { Router } from 'express';
import { body, param, query } from 'express-validator';
import { authenticate } from '../../../middleware/auth';
import { uploadSingleFile, uploadMultipleFiles } from '../../../middleware/fileUpload';
import * as fileCtrl from '../controllers/fileStorage.controller';

const router = Router();

// Public routes (no authentication required)
router.get(
  '/share/:token',
  [param('token').isUUID().withMessage('Invalid share token')],
  fileCtrl.accessSharedFile
);

router.post(
  '/share/:token/download',
  [
    param('token').isUUID().withMessage('Invalid share token'),
    body('password').optional().isString(),
  ],
  fileCtrl.downloadSharedFile
);

// Protected routes
router.use(authenticate);

router.post('/upload', uploadSingleFile, fileCtrl.uploadFile);
router.post('/upload/multiple', uploadMultipleFiles, fileCtrl.uploadMultipleFiles);
router.get('/stats', fileCtrl.getStorageStats);
router.get(
  '/search',
  [query('q').notEmpty().withMessage('Search query is required')],
  fileCtrl.searchFiles
);

router.get('/:id', [param('id').isMongoId().withMessage('Invalid file ID')], fileCtrl.getFile);
router.get('/:id/download', [param('id').isMongoId().withMessage('Invalid file ID')], fileCtrl.downloadFile);
router.get('/:id/preview', [param('id').isMongoId().withMessage('Invalid file ID')], fileCtrl.previewFile);
router.get(
  '/:id/url',
  [
    param('id').isMongoId().withMessage('Invalid file ID'),
    query('expiry').optional().isInt({ min: 60, max: 86400 }).withMessage('Expiry must be between 60 and 86400 seconds'),
  ],
  fileCtrl.getPresignedUrl
);

router.put(
  '/:id',
  [
    param('id').isMongoId().withMessage('Invalid file ID'),
    body('fileName').optional().isString().trim(),
    body('description').optional().isString().trim(),
    body('tags').optional().isArray(),
  ],
  fileCtrl.updateFileMetadata
);

router.put(
  '/:id/move',
  [
    param('id').isMongoId().withMessage('Invalid file ID'),
    body('folderId').optional().isMongoId().withMessage('Invalid folder ID'),
  ],
  fileCtrl.moveFile
);

router.delete('/:id', [param('id').isMongoId().withMessage('Invalid file ID')], fileCtrl.deleteFile);
router.delete('/:id/permanent', [param('id').isMongoId().withMessage('Invalid file ID')], fileCtrl.permanentlyDeleteFile);
router.post('/:id/restore', [param('id').isMongoId().withMessage('Invalid file ID')], fileCtrl.restoreFile);

router.post(
  '/:id/share',
  [
    param('id').isMongoId().withMessage('Invalid file ID'),
    body('expiresIn').optional().isInt({ min: 60 }).withMessage('Expiration must be at least 60 seconds'),
    body('maxDownloads').optional().isInt({ min: 1 }).withMessage('Max downloads must be at least 1'),
    body('password').optional().isString().isLength({ min: 4 }).withMessage('Password must be at least 4 characters'),
    body('allowedEmails').optional().isArray(),
    body('canDownload').optional().isBoolean(),
    body('canView').optional().isBoolean(),
  ],
  fileCtrl.createShareLink
);

export default router;
