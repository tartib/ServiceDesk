import multer from 'multer';
import path from 'path';
import fs from 'fs';
import ApiError from '../utils/ApiError';
import env from '../config/env';

// Ensure uploads directories exist
const inventoryDir = path.join(process.cwd(), 'uploads', 'inventory');
if (!fs.existsSync(inventoryDir)) {
  fs.mkdirSync(inventoryDir, { recursive: true });
}

// Configure storage for products
const productStorage = multer.diskStorage({
  destination: (_req, _file, _cb) => {
  },
  filename: (_req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const ext = path.extname(file.originalname);
    cb(null, `product-${uniqueSuffix}${ext}`);
  },
});

// Configure storage for inventory
const inventoryStorage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, inventoryDir);
  },
  filename: (_req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const ext = path.extname(file.originalname);
    cb(null, `inventory-${uniqueSuffix}${ext}`);
  },
});

// File filter for images only
const fileFilter = (
  _req: Express.Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
) => {
  const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];

  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new ApiError(400, 'Only image files (jpeg, png, gif, webp) are allowed'));
  }
};

// Configure multer for products
export const uploadProductImage = multer({
  storage: productStorage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB max
  },
}).single('image');

// Configure multer for inventory
export const uploadInventoryImage = multer({
  storage: inventoryStorage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB max
  },
}).single('image');

// Helper to delete old image
export const deleteImage = (imageUrl: string): void => {
  if (imageUrl) {
    // Extract path from full URL (e.g., http://localhost:5000/uploads/products/file.jpg -> /uploads/products/file.jpg)
    const urlPath = imageUrl.includes('://') 
      ? new URL(imageUrl).pathname 
      : imageUrl;
    const fullPath = path.join(process.cwd(), urlPath);
    if (fs.existsSync(fullPath)) {
      fs.unlinkSync(fullPath);
    }
  }
};

// Get image URL from file path
export const getImageUrl = (filename: string, type: 'products' | 'inventory' = 'products'): string => {
  const baseUrl = process.env.BASE_URL || `http://localhost:${env.PORT}`;
  return `${baseUrl}/uploads/${type}/${filename}`;
};
