import { Router } from 'express';
import { body, param, query } from 'express-validator';
import { authenticate } from '../middleware/auth';
import { uploadSingleFile, uploadMultipleFiles } from '../middleware/fileUpload';
import * as fileStorageController from '../controllers/fileStorage.controller';

const router = Router();

// Public routes (no authentication required)
router.get(
  '/share/:token',
  [
    param('token').isUUID().withMessage('Invalid share token'),
  ],
  fileStorageController.accessSharedFile
);

router.post(
  '/share/:token/download',
  [
    param('token').isUUID().withMessage('Invalid share token'),
    body('password').optional().isString(),
  ],
  fileStorageController.downloadSharedFile
);

// Protected routes (authentication required)
router.use(authenticate);

router.post('/upload', uploadSingleFile, fileStorageController.uploadFile);

router.post('/upload/multiple', uploadMultipleFiles, fileStorageController.uploadMultipleFiles);

router.get('/stats', fileStorageController.getStorageStats);

router.get(
  '/search',
  [query('q').notEmpty().withMessage('Search query is required')],
  fileStorageController.searchFiles
);

router.get(
  '/:id',
  [param('id').isMongoId().withMessage('Invalid file ID')],
  fileStorageController.getFile
);

router.get(
  '/:id/download',
  [param('id').isMongoId().withMessage('Invalid file ID')],
  fileStorageController.downloadFile
);

router.get(
  '/:id/preview',
  [param('id').isMongoId().withMessage('Invalid file ID')],
  fileStorageController.previewFile
);

router.put(
  '/:id',
  [
    param('id').isMongoId().withMessage('Invalid file ID'),
    body('fileName').optional().isString().trim(),
    body('description').optional().isString().trim(),
    body('tags').optional().isArray(),
  ],
  fileStorageController.updateFileMetadata
);

router.put(
  '/:id/move',
  [
    param('id').isMongoId().withMessage('Invalid file ID'),
    body('folderId').optional().isMongoId().withMessage('Invalid folder ID'),
  ],
  fileStorageController.moveFile
);

router.delete(
  '/:id',
  [param('id').isMongoId().withMessage('Invalid file ID')],
  fileStorageController.deleteFile
);

router.delete(
  '/:id/permanent',
  [param('id').isMongoId().withMessage('Invalid file ID')],
  fileStorageController.permanentlyDeleteFile
);

router.post(
  '/:id/restore',
  [param('id').isMongoId().withMessage('Invalid file ID')],
  fileStorageController.restoreFile
);

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
  fileStorageController.createShareLink
);

export default router;
