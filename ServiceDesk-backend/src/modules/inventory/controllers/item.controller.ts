import { Request, Response } from 'express';
import * as itemService from '../services/itemService';
import { ItemStatus } from '../types';
import ApiResponse from '../../../utils/ApiResponse';
import asyncHandler from '../../../utils/asyncHandler';
import ApiError from '../../../utils/ApiError';

export const listItems = asyncHandler(async (req: Request, res: Response) => {
  const q = req.query;
  const filters: itemService.ItemFilters = {
    search: q.search as string | undefined,
    groupName: q.groupName as string | undefined,
    uom: q.uom as string | undefined,
    status: q.status as ItemStatus | undefined,
  };

  const page = q.page ? Number(q.page) : undefined;
  if (page !== undefined) {
    const pageSize = Number(q.pageSize) || 25;
    const sortBy = (q.sortBy as string) || 'partNo';
    const sortOrder = (q.sortOrder === 'desc' ? 'desc' : 'asc') as 'asc' | 'desc';
    const result = await itemService.listItems(filters, { page, pageSize, sortBy, sortOrder });
    return res.json(new ApiResponse(200, 'Items retrieved', result));
  }

  const items = await itemService.listItems(filters);
  res.json(new ApiResponse(200, 'Items retrieved', { items }));
});

export const getItem = asyncHandler(async (req: Request, res: Response) => {
  const item = await itemService.getItemById(req.params.id);
  res.json(new ApiResponse(200, 'Item retrieved', { item }));
});

export const createItem = asyncHandler(async (req: Request, res: Response) => {
  const item = await itemService.createItem(req.body);
  res.status(201).json(new ApiResponse(201, 'Item created', { item }));
});

export const updateItem = asyncHandler(async (req: Request, res: Response) => {
  const item = await itemService.updateItem(req.params.id, req.body);
  res.json(new ApiResponse(200, 'Item updated', { item }));
});

export const deactivateItem = asyncHandler(async (req: Request, res: Response) => {
  const item = await itemService.deactivateItem(req.params.id);
  res.json(new ApiResponse(200, 'Item deactivated', { item }));
});
