import mongoose, { ClientSession } from 'mongoose';
import InventoryMovement, { IInventoryMovement } from '../models/InventoryMovement';
import { MovementType } from '../types';
import { BalanceSnapshot } from './balanceService';

// ── Escape special regex characters ──────────────────────────────
const escapeRegex = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// ── Record movement ──────────────────────────────────────────────
export interface RecordMovementInput {
  partId: string;
  warehouseId: string;
  locationId?: string;
  movementType: MovementType;
  quantity: number;
  snapshot: BalanceSnapshot;
  referenceType?: string;
  referenceId?: string;
  referenceNo?: string;
  notes?: string;
  userId: string;
}

export const recordMovement = async (
  input: RecordMovementInput,
  session?: ClientSession,
): Promise<IInventoryMovement> => {
  const docData = {
    part: input.partId,
    warehouse: input.warehouseId,
    location: input.locationId || undefined,
    movementType: input.movementType,
    quantity: input.quantity,
    beforeInStock: input.snapshot.beforeInStock,
    afterInStock: input.snapshot.afterInStock,
    beforeBooked: input.snapshot.beforeBooked,
    afterBooked: input.snapshot.afterBooked,
    beforeAvailable: input.snapshot.beforeAvailable,
    afterAvailable: input.snapshot.afterAvailable,
    referenceType: input.referenceType,
    referenceId: input.referenceId,
    referenceNo: input.referenceNo,
    notes: input.notes,
    createdBy: input.userId,
  };
  if (session) {
    const docs = await InventoryMovement.create([docData], { session });
    return docs[0];
  }
  return InventoryMovement.create(docData);
};

// ── Filters ──────────────────────────────────────────────────────
export interface MovementFilters {
  partId?: string;
  warehouseId?: string;
  movementType?: MovementType;
  referenceType?: string;
  referenceId?: string;
  search?: string;
  dateFrom?: Date;
  dateTo?: Date;
}

export interface PaginationOpts {
  page: number;
  pageSize: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedResult<T> {
  items: T[];
  pagination: {
    page: number;
    pageSize: number;
    totalItems: number;
    totalPages: number;
  };
}

// ── List movements ───────────────────────────────────────────────
export const listMovements = async (
  filters: MovementFilters = {},
  pagination?: PaginationOpts,
): Promise<IInventoryMovement[] | PaginatedResult<IInventoryMovement>> => {
  const query: Record<string, unknown> = {};

  if (filters.partId) query.part = filters.partId;
  if (filters.warehouseId) query.warehouse = filters.warehouseId;
  if (filters.movementType) query.movementType = filters.movementType;
  if (filters.referenceType) query.referenceType = filters.referenceType;
  if (filters.referenceId) query.referenceId = filters.referenceId;

  if (filters.dateFrom || filters.dateTo) {
    const dateFilter: Record<string, Date> = {};
    if (filters.dateFrom) dateFilter.$gte = filters.dateFrom;
    if (filters.dateTo) dateFilter.$lte = filters.dateTo;
    query.createdAt = dateFilter;
  }

  if (filters.search) {
    const regex = { $regex: escapeRegex(filters.search), $options: 'i' };
    query.$or = [
      { referenceNo: regex },
      { notes: regex },
    ];
  }

  const baseQuery = InventoryMovement.find(query)
    .populate('part', 'partNo partDescription uom')
    .populate('warehouse', 'warehouseName code')
    .populate('createdBy', 'name email');

  if (!pagination) {
    return baseQuery.sort({ createdAt: -1 }).limit(200);
  }

  const { page, pageSize, sortOrder = 'desc' } = pagination;
  const skip = (page - 1) * pageSize;

  const [items, totalItems] = await Promise.all([
    baseQuery.clone().sort({ createdAt: sortOrder === 'asc' ? 1 : -1 }).skip(skip).limit(pageSize),
    InventoryMovement.countDocuments(query),
  ]);

  return {
    items,
    pagination: {
      page,
      pageSize,
      totalItems,
      totalPages: Math.ceil(totalItems / pageSize),
    },
  };
};

// ── Get movements for a specific item ────────────────────────────
export const getItemMovements = async (
  partId: string,
  pagination?: PaginationOpts,
): Promise<IInventoryMovement[] | PaginatedResult<IInventoryMovement>> => {
  return listMovements({ partId }, pagination);
};
