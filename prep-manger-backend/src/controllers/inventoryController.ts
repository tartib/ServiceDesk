import { Request, Response } from 'express';
import * as inventoryService from '../services/inventoryService';
import ApiResponse from '../utils/ApiResponse';
import asyncHandler from '../utils/asyncHandler';
import ApiError from '../utils/ApiError';
import { getImageUrl, deleteImage } from '../middleware/upload';

export const getAllInventory = asyncHandler(async (req: Request, res: Response) => {
  const { category } = req.query;
  
  const items = await inventoryService.getAllInventory(category as string);
  
  res.status(200).json(
    new ApiResponse(200, 'Inventory retrieved successfully', {
      count: items.length,
      items,
    })
  );
});

export const getInventoryById = asyncHandler(async (req: Request, res: Response) => {
  const item = await inventoryService.getInventoryById(req.params.id);
  
  res.status(200).json(new ApiResponse(200, 'Inventory item retrieved', { item }));
});

export const createInventoryItem = asyncHandler(async (req: Request, res: Response) => {
  const itemData = { ...req.body };

  // Handle image upload
  if (req.file) {
    itemData.image = getImageUrl(req.file.filename, 'inventory');
  }

  const item = await inventoryService.createInventoryItem(itemData);
  
  res.status(201).json(new ApiResponse(201, 'Inventory item created', { item }));
});

export const updateInventory = asyncHandler(async (req: Request, res: Response) => {
  const updateData = { ...req.body };

  // Handle image upload
  if (req.file) {
    // Get existing item to delete old image
    const existingItem = await inventoryService.getInventoryById(req.params.id);
    if (existingItem.image) {
      deleteImage(existingItem.image);
    }
    updateData.image = getImageUrl(req.file.filename, 'inventory');
  }

  const item = await inventoryService.updateInventory(req.params.id, updateData);
  
  res.status(200).json(new ApiResponse(200, 'Inventory updated', { item }));
});

export const restockInventory = asyncHandler(async (req: Request, res: Response) => {
  const { quantity } = req.body;
  
  if (!quantity || quantity <= 0) {
    throw new ApiError(400, 'Invalid quantity');
  }
  
  const item = await inventoryService.restockInventory(req.params.id, quantity);
  
  res.status(200).json(new ApiResponse(200, 'Inventory restocked', { item }));
});

export const getLowStock = asyncHandler(async (_req: Request, res: Response) => {
  const items = await inventoryService.getLowStockItems();
  
  res.status(200).json(
    new ApiResponse(200, 'Low stock items retrieved', {
      count: items.length,
      items,
    })
  );
});
