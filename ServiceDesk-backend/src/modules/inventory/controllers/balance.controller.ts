import { Request, Response } from 'express';
import * as balanceService from '../services/balanceService';
import { StockAlertStatus } from '../types';
import ApiResponse from '../../../utils/ApiResponse';
import asyncHandler from '../../../utils/asyncHandler';
import ApiError from '../../../utils/ApiError';

export const listBalances = asyncHandler(async (req: Request, res: Response) => {
  const q = req.query;
  const filters: balanceService.BalanceFilters = {
    partId: q.partId as string | undefined,
    warehouseId: q.warehouseId as string | undefined,
    locationId: q.locationId as string | undefined,
    search: q.search as string | undefined,
    groupName: q.groupName as string | undefined,
    alertStatus: q.alertStatus as StockAlertStatus | undefined,
  };

  const page = q.page ? Number(q.page) : undefined;
  if (page !== undefined) {
    const pageSize = Number(q.pageSize) || 25;
    const sortBy = (q.sortBy as string) || 'partNo';
    const sortOrder = (q.sortOrder === 'desc' ? 'desc' : 'asc') as 'asc' | 'desc';
    const result = await balanceService.listBalances(filters, { page, pageSize, sortBy, sortOrder });
    return res.json(new ApiResponse(200, 'Balances retrieved', result));
  }

  const items = await balanceService.listBalances(filters);
  res.json(new ApiResponse(200, 'Balances retrieved', { items }));
});

export const getPartBalance = asyncHandler(async (req: Request, res: Response) => {
  const { partId } = req.params as Record<string, string>;
  const warehouseId = req.query.warehouseId as string | undefined;

  if (warehouseId) {
    const balance = await balanceService.getBalance(partId, warehouseId);
    return res.json(new ApiResponse(200, 'Balance retrieved', { balance }));
  }

  // Get balances for this part across all warehouses
  const balances = await balanceService.listBalances({ partId });
  res.json(new ApiResponse(200, 'Balances retrieved', { balances }));
});
