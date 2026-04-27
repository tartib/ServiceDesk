import { Request, Response } from 'express';
import * as receiptService from '../services/receiptService';
import { ReceiptStatus } from '../types';
import ApiResponse from '../../../utils/ApiResponse';
import asyncHandler from '../../../utils/asyncHandler';
import ApiError from '../../../utils/ApiError';

export const createReceipt = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?.id;
  if (!userId) throw new ApiError(401, 'User not authenticated');

  const { partId, warehouseId, locationId, quantity, supplierId, referenceNo, notes } = req.body;
  if (!partId || !warehouseId) throw new ApiError(400, 'partId and warehouseId are required');

  const receipt = await receiptService.createReceipt({
    partId, warehouseId, locationId, quantity, supplierId, referenceNo, notes, userId,
  });
  res.status(201).json(new ApiResponse(201, 'Receipt created', { receipt }));
});

export const confirmReceipt = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?.id;
  if (!userId) throw new ApiError(401, 'User not authenticated');

  const receipt = await receiptService.confirmReceipt(req.params.id, userId);
  res.json(new ApiResponse(200, 'Receipt confirmed', { receipt }));
});

export const cancelReceipt = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?.id;
  if (!userId) throw new ApiError(401, 'User not authenticated');

  const receipt = await receiptService.cancelReceipt(req.params.id, userId);
  res.json(new ApiResponse(200, 'Receipt cancelled', { receipt }));
});

export const listReceipts = asyncHandler(async (req: Request, res: Response) => {
  const filters = {
    partId: req.query.partId as string | undefined,
    warehouseId: req.query.warehouseId as string | undefined,
    status: req.query.status as ReceiptStatus | undefined,
  };
  const receipts = await receiptService.listReceipts(filters);
  res.json(new ApiResponse(200, 'Receipts retrieved', { receipts }));
});
