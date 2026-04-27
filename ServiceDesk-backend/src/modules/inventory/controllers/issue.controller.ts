import { Request, Response } from 'express';
import * as issueService from '../services/issueService';
import ApiResponse from '../../../utils/ApiResponse';
import asyncHandler from '../../../utils/asyncHandler';
import ApiError from '../../../utils/ApiError';

export const createIssue = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?.id;
  if (!userId) throw new ApiError(401, 'User not authenticated');

  const { partId, warehouseId, quantity, referenceType, referenceId, issuedTo, bookingId, notes } = req.body;
  if (!partId || !warehouseId) throw new ApiError(400, 'partId and warehouseId are required');

  const issue = await issueService.createIssue({
    partId, warehouseId, quantity, referenceType, referenceId, issuedTo, bookingId, notes, userId,
  });
  res.status(201).json(new ApiResponse(201, 'Stock issued', { issue }));
});

export const listIssues = asyncHandler(async (req: Request, res: Response) => {
  const filters = {
    partId: req.query.partId as string | undefined,
    warehouseId: req.query.warehouseId as string | undefined,
    referenceType: req.query.referenceType as string | undefined,
    referenceId: req.query.referenceId as string | undefined,
  };
  const issues = await issueService.listIssues(filters);
  res.json(new ApiResponse(200, 'Issues retrieved', { issues }));
});
