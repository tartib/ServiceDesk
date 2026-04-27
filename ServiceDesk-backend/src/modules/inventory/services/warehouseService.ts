import InvWarehouse, { IWarehouse } from '../models/Warehouse';
import WarehouseLocation, { IWarehouseLocation } from '../models/WarehouseLocation';
import ApiError from '../../../utils/ApiError';
import logger from '../../../utils/logger';
import { WarehouseStatus, LocationStatus } from '../types';

// ── Warehouse CRUD ───────────────────────────────────────────────

export const listWarehouses = async (includeInactive = false): Promise<IWarehouse[]> => {
  const query: Record<string, unknown> = {};
  if (!includeInactive) query.status = WarehouseStatus.ACTIVE;
  return InvWarehouse.find(query).sort({ isDefault: -1, warehouseName: 1 });
};

export const getWarehouseById = async (id: string): Promise<IWarehouse> => {
  const wh = await InvWarehouse.findById(id);
  if (!wh) throw new ApiError(404, 'Warehouse not found');
  return wh;
};

export const createWarehouse = async (data: Partial<IWarehouse>): Promise<IWarehouse> => {
  const count = await InvWarehouse.countDocuments();
  if (count === 0) data.isDefault = true;
  const wh = await InvWarehouse.create(data);
  logger.info(`Warehouse created: ${wh.warehouseName} (${wh.code})`);
  return wh;
};

export const updateWarehouse = async (id: string, data: Partial<IWarehouse>): Promise<IWarehouse> => {
  const wh = await InvWarehouse.findByIdAndUpdate(id, data, { new: true, runValidators: true });
  if (!wh) throw new ApiError(404, 'Warehouse not found');
  logger.info(`Warehouse updated: ${wh.warehouseName}`);
  return wh;
};

export const deactivateWarehouse = async (id: string): Promise<IWarehouse> => {
  const wh = await InvWarehouse.findById(id);
  if (!wh) throw new ApiError(404, 'Warehouse not found');
  if (wh.isDefault) throw new ApiError(400, 'Cannot deactivate the default warehouse');
  wh.status = WarehouseStatus.INACTIVE;
  await wh.save();
  logger.info(`Warehouse deactivated: ${wh.warehouseName}`);
  return wh;
};

// ── Location CRUD ────────────────────────────────────────────────

export const listLocations = async (warehouseId: string): Promise<IWarehouseLocation[]> => {
  return WarehouseLocation.find({ warehouse: warehouseId, status: LocationStatus.ACTIVE })
    .sort({ binCode: 1 });
};

export const createLocation = async (data: Partial<IWarehouseLocation>): Promise<IWarehouseLocation> => {
  const loc = await WarehouseLocation.create(data);
  logger.info(`Location created: ${loc.binCode} in warehouse ${loc.warehouse}`);
  return loc;
};

export const updateLocation = async (id: string, data: Partial<IWarehouseLocation>): Promise<IWarehouseLocation> => {
  const loc = await WarehouseLocation.findByIdAndUpdate(id, data, { new: true, runValidators: true });
  if (!loc) throw new ApiError(404, 'Location not found');
  return loc;
};

export const deactivateLocation = async (id: string): Promise<IWarehouseLocation> => {
  const loc = await WarehouseLocation.findById(id);
  if (!loc) throw new ApiError(404, 'Location not found');
  loc.status = LocationStatus.INACTIVE;
  await loc.save();
  return loc;
};
