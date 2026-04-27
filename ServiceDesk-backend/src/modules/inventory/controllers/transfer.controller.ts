import { Request, Response } from 'express';
import * as transferService from '../services/transferService';
import { TransferStatus } from '../types';
import ApiResponse from '../../../utils/ApiResponse';
import asyncHandler from '../../../utils/asyncHandler';
import ApiError from '../../../utils/ApiError';

export const createTransfer = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?.id;
  if (!userId) throw new ApiError(401, 'User not authenticated');

  const { partId, sourceWarehouseId, destinationWarehouseId, quantity, referenceNo, notes } = req.body;
  if (!partId || !sourceWarehouseId || !destinationWarehouseId) {
    throw new ApiError(400, 'partId, sourceWarehouseId, and destinationWarehouseId are required');
  }

  const transfer = await transferService.createTransfer({
    partId, sourceWarehouseId, destinationWarehouseId, quantity, referenceNo, notes, userId,
  });
  res.status(201).json(new ApiResponse(201, 'Transfer completed', { transfer }));
});

export const cancelTransfer = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?.id;
  if (!userId) throw new ApiError(401, 'User not authenticated');

  const transfer = await transferService.cancelTransfer(req.params.id, userId);
  res.json(new ApiResponse(200, 'Transfer cancelled', { transfer }));
});

export const listTransfers = asyncHandler(async (req: Request, res: Response) => {
  const filters = {
    partId: req.query.partId as string | undefined,
    sourceWarehouseId: req.query.sourceWarehouseId as string | undefined,
    destinationWarehouseId: req.query.destinationWarehouseId as string | undefined,
    warehouseId: req.query.warehouseId as string | undefined,
    status: req.query.status as TransferStatus | undefined,
  };
  const transfers = await transferService.listTransfers(filters);
  res.json(new ApiResponse(200, 'Transfers retrieved', { transfers }));
});
