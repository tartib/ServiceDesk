import InventoryItem, { IInventoryItem } from '../models/InventoryItem';
import ApiError from '../../../utils/ApiError';
import logger from '../../../utils/logger';
import { ItemStatus } from '../types';

const escapeRegex = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// ── Filters ──────────────────────────────────────────────────────
export interface ItemFilters {
  search?: string;
  groupName?: string;
  uom?: string;
  status?: ItemStatus;
}

export interface PaginationOpts {
  page: number;
  pageSize: number;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
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

const ALLOWED_SORT_FIELDS = new Set([
  'partNo', 'partDescription', 'groupName', 'uom', 'cost',
  'minStock', 'maxStock', 'reorderLevel', 'status', 'createdAt', 'updatedAt',
]);

// ── List ─────────────────────────────────────────────────────────
export const listItems = async (
  filters: ItemFilters = {},
  pagination?: PaginationOpts,
): Promise<IInventoryItem[] | PaginatedResult<IInventoryItem>> => {
  const query: Record<string, unknown> = {};

  if (filters.status) query.status = filters.status;
  if (filters.uom) query.uom = filters.uom;
  if (filters.groupName) query.groupName = { $regex: escapeRegex(filters.groupName), $options: 'i' };
  if (filters.search) {
    const regex = { $regex: escapeRegex(filters.search), $options: 'i' };
    query.$or = [
      { partNo: regex },
      { partDescription: regex },
      { groupName: regex },
    ];
  }

  if (!pagination) {
    return InventoryItem.find(query).sort({ partNo: 1 });
  }

  const { page, pageSize, sortBy, sortOrder } = pagination;
  const safeSortBy = ALLOWED_SORT_FIELDS.has(sortBy) ? sortBy : 'partNo';
  const skip = (page - 1) * pageSize;
  const sortObj: Record<string, 1 | -1> = { [safeSortBy]: sortOrder === 'asc' ? 1 : -1 };

  const [items, totalItems] = await Promise.all([
    InventoryItem.find(query).sort(sortObj).skip(skip).limit(pageSize),
    InventoryItem.countDocuments(query),
  ]);

  return {
    items,
    pagination: { page, pageSize, totalItems, totalPages: Math.ceil(totalItems / pageSize) },
  };
};

// ── Get by ID ────────────────────────────────────────────────────
export const getItemById = async (id: string): Promise<IInventoryItem> => {
  const item = await InventoryItem.findById(id);
  if (!item) throw new ApiError(404, 'Inventory item not found');
  return item;
};

// ── Create ───────────────────────────────────────────────────────
export const createItem = async (data: Partial<IInventoryItem>): Promise<IInventoryItem> => {
  const item = await InventoryItem.create(data);
  logger.info(`Inventory item created: ${item.partNo}`);
  return item;
};

// ── Update ───────────────────────────────────────────────────────
export const updateItem = async (
  id: string,
  data: Partial<IInventoryItem>,
): Promise<IInventoryItem> => {
  const item = await InventoryItem.findByIdAndUpdate(id, data, {
    new: true,
    runValidators: true,
  });
  if (!item) throw new ApiError(404, 'Inventory item not found');
  logger.info(`Inventory item updated: ${item.partNo}`);
  return item;
};

// ── Deactivate ───────────────────────────────────────────────────
export const deactivateItem = async (id: string): Promise<IInventoryItem> => {
  const item = await InventoryItem.findById(id);
  if (!item) throw new ApiError(404, 'Inventory item not found');
  item.status = ItemStatus.INACTIVE;
  await item.save();
  logger.info(`Inventory item deactivated: ${item.partNo}`);
  return item;
};
