import { Request, Response } from 'express';
import * as warehouseService from '../services/warehouseService';
import ApiResponse from '../../../utils/ApiResponse';
import asyncHandler from '../../../utils/asyncHandler';

export const listWarehouses = asyncHandler(async (req: Request, res: Response) => {
  const includeInactive = req.query.includeInactive === 'true';
  const warehouses = await warehouseService.listWarehouses(includeInactive);
  res.json(new ApiResponse(200, 'Warehouses retrieved', { warehouses }));
});

export const getWarehouse = asyncHandler(async (req: Request, res: Response) => {
  const warehouse = await warehouseService.getWarehouseById(req.params.id);
  res.json(new ApiResponse(200, 'Warehouse retrieved', { warehouse }));
});

export const createWarehouse = asyncHandler(async (req: Request, res: Response) => {
  const warehouse = await warehouseService.createWarehouse(req.body);
  res.status(201).json(new ApiResponse(201, 'Warehouse created', { warehouse }));
});

export const updateWarehouse = asyncHandler(async (req: Request, res: Response) => {
  const warehouse = await warehouseService.updateWarehouse(req.params.id, req.body);
  res.json(new ApiResponse(200, 'Warehouse updated', { warehouse }));
});

export const deactivateWarehouse = asyncHandler(async (req: Request, res: Response) => {
  const warehouse = await warehouseService.deactivateWarehouse(req.params.id);
  res.json(new ApiResponse(200, 'Warehouse deactivated', { warehouse }));
});

export const listLocations = asyncHandler(async (req: Request, res: Response) => {
  const locations = await warehouseService.listLocations(req.params.warehouseId);
  res.json(new ApiResponse(200, 'Locations retrieved', { locations }));
});

export const createLocation = asyncHandler(async (req: Request, res: Response) => {
  const location = await warehouseService.createLocation({
    ...req.body,
    warehouse: req.params.warehouseId,
  });
  res.status(201).json(new ApiResponse(201, 'Location created', { location }));
});

export const updateLocation = asyncHandler(async (req: Request, res: Response) => {
  const location = await warehouseService.updateLocation(req.params.locationId, req.body);
  res.json(new ApiResponse(200, 'Location updated', { location }));
});

export const deactivateLocation = asyncHandler(async (req: Request, res: Response) => {
  const location = await warehouseService.deactivateLocation(req.params.locationId);
  res.json(new ApiResponse(200, 'Location deactivated', { location }));
});
