import { Request, Response } from 'express';
import * as movementService from '../services/movementService';
import { MovementType } from '../types';
import ApiResponse from '../../../utils/ApiResponse';
import asyncHandler from '../../../utils/asyncHandler';

export const listMovements = asyncHandler(async (req: Request, res: Response) => {
  const q = req.query;
  const filters: movementService.MovementFilters = {
    partId: q.partId as string | undefined,
    warehouseId: q.warehouseId as string | undefined,
    movementType: q.movementType as MovementType | undefined,
    referenceType: q.referenceType as string | undefined,
    referenceId: q.referenceId as string | undefined,
    search: q.search as string | undefined,
    dateFrom: q.dateFrom ? new Date(q.dateFrom as string) : undefined,
    dateTo: q.dateTo ? new Date(q.dateTo as string) : undefined,
  };

  const page = q.page ? Number(q.page) : undefined;
  if (page !== undefined) {
    const pageSize = Number(q.pageSize) || 50;
    const sortOrder = (q.sortOrder === 'asc' ? 'asc' : 'desc') as 'asc' | 'desc';
    const result = await movementService.listMovements(filters, { page, pageSize, sortOrder });
    return res.json(new ApiResponse(200, 'Movements retrieved', result));
  }

  const movements = await movementService.listMovements(filters);
  res.json(new ApiResponse(200, 'Movements retrieved', { movements }));
});

export const getItemMovements = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const q = req.query;
  const page = q.page ? Number(q.page) : undefined;

  if (page !== undefined) {
    const pageSize = Number(q.pageSize) || 50;
    const sortOrder = (q.sortOrder === 'asc' ? 'asc' : 'desc') as 'asc' | 'desc';
    const result = await movementService.getItemMovements(id, { page, pageSize, sortOrder });
    return res.json(new ApiResponse(200, 'Movements retrieved', result));
  }

  const movements = await movementService.getItemMovements(id);
  res.json(new ApiResponse(200, 'Movements retrieved', { movements }));
});
