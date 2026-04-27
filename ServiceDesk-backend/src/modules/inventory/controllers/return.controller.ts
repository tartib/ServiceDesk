import { Request, Response } from 'express';
import * as returnService from '../services/returnService';
import { ReturnCondition } from '../types';
import ApiResponse from '../../../utils/ApiResponse';
import asyncHandler from '../../../utils/asyncHandler';
import ApiError from '../../../utils/ApiError';

export const createReturn = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?.id;
  if (!userId) throw new ApiError(401, 'User not authenticated');

  const { partId, warehouseId, quantity, originalIssueId, returnedBy, condition, notes } = req.body;
  if (!partId || !warehouseId) throw new ApiError(400, 'partId and warehouseId are required');
  if (!condition) throw new ApiError(400, 'Return condition is required');

  const stockReturn = await returnService.createReturn({
    partId, warehouseId, quantity, originalIssueId, returnedBy, condition, notes, userId,
  });
  res.status(201).json(new ApiResponse(201, 'Stock returned', { stockReturn }));
});

export const listReturns = asyncHandler(async (req: Request, res: Response) => {
  const filters = {
    partId: req.query.partId as string | undefined,
    warehouseId: req.query.warehouseId as string | undefined,
    condition: req.query.condition as ReturnCondition | undefined,
  };
  const returns = await returnService.listReturns(filters);
  res.json(new ApiResponse(200, 'Returns retrieved', { returns }));
});
