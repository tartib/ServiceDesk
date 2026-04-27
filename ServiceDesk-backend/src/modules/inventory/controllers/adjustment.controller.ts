import { Request, Response } from 'express';
import * as adjustmentService from '../services/adjustmentService';
import { AdjustmentType } from '../types';
import ApiResponse from '../../../utils/ApiResponse';
import asyncHandler from '../../../utils/asyncHandler';
import ApiError from '../../../utils/ApiError';

export const createAdjustment = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?.id;
  if (!userId) throw new ApiError(401, 'User not authenticated');

  const { partId, warehouseId, adjustmentType, quantity, reason, notes } = req.body;
  if (!partId || !warehouseId) throw new ApiError(400, 'partId and warehouseId are required');
  if (!reason || !String(reason).trim()) throw new ApiError(400, 'Reason is required');

  const adjustment = await adjustmentService.createAdjustment({
    partId, warehouseId, adjustmentType, quantity, reason, notes, userId,
  });
  res.status(201).json(new ApiResponse(201, 'Stock adjusted', { adjustment }));
});

export const listAdjustments = asyncHandler(async (req: Request, res: Response) => {
  const filters = {
    partId: req.query.partId as string | undefined,
    warehouseId: req.query.warehouseId as string | undefined,
    adjustmentType: req.query.adjustmentType as AdjustmentType | undefined,
  };
  const adjustments = await adjustmentService.listAdjustments(filters);
  res.json(new ApiResponse(200, 'Adjustments retrieved', { adjustments }));
});
