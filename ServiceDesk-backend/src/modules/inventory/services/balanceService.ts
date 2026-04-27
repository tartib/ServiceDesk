import mongoose, { ClientSession } from 'mongoose';
import StockBalance, { IStockBalance } from '../models/StockBalance';
import InventoryItem from '../models/InventoryItem';
import ApiError from '../../../utils/ApiError';
import { StockAlertStatus } from '../types';

// ── Escape special regex characters ──────────────────────────────
const escapeRegex = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// ── Filter / pagination types ────────────────────────────────────
export interface BalanceFilters {
  partId?: string;
  warehouseId?: string;
  locationId?: string;
  search?: string;
  groupName?: string;
  alertStatus?: StockAlertStatus;
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

// ── Snapshot for movement history ────────────────────────────────
export interface BalanceSnapshot {
  beforeInStock: number;
  afterInStock: number;
  beforeBooked: number;
  afterBooked: number;
  beforeAvailable: number;
  afterAvailable: number;
}

// ── Get or create balance ────────────────────────────────────────
export const getOrCreateBalance = async (
  partId: string,
  warehouseId: string,
  locationId?: string,
  session?: ClientSession,
): Promise<IStockBalance> => {
  const filter: Record<string, unknown> = {
    part: partId,
    warehouse: warehouseId,
  };
  if (locationId) filter.location = locationId;
  else filter.location = { $exists: false };

  let balance = await StockBalance.findOne(filter).session(session || null);
  if (!balance) {
    const docData = { part: partId, warehouse: warehouseId, location: locationId || undefined };
    if (session) {
      const docs = await StockBalance.create([docData], { session });
      balance = docs[0];
    } else {
      balance = await StockBalance.create(docData);
    }
  }
  return balance;
};

// ── Update inStock ───────────────────────────────────────────────
export const adjustInStock = async (
  partId: string,
  warehouseId: string,
  delta: number,
  session?: ClientSession,
  locationId?: string,
): Promise<BalanceSnapshot> => {
  const balance = await getOrCreateBalance(partId, warehouseId, locationId, session);

  const before: BalanceSnapshot = {
    beforeInStock: balance.inStock,
    afterInStock: 0,
    beforeBooked: balance.booked,
    afterBooked: balance.booked,
    beforeAvailable: balance.available,
    afterAvailable: 0,
  };

  const newInStock = balance.inStock + delta;
  if (newInStock < 0) {
    throw new ApiError(400, `Insufficient stock: available inStock=${balance.inStock}, requested delta=${delta}`);
  }

  balance.inStock = newInStock;
  balance.available = newInStock - balance.booked;
  balance.lastMovementAt = new Date();
  await balance.save(session ? { session } : {});

  before.afterInStock = balance.inStock;
  before.afterAvailable = balance.available;
  return before;
};

// ── Update booked ────────────────────────────────────────────────
export const adjustBooked = async (
  partId: string,
  warehouseId: string,
  delta: number,
  session?: ClientSession,
): Promise<BalanceSnapshot> => {
  const balance = await getOrCreateBalance(partId, warehouseId, undefined, session);

  const before: BalanceSnapshot = {
    beforeInStock: balance.inStock,
    afterInStock: balance.inStock,
    beforeBooked: balance.booked,
    afterBooked: 0,
    beforeAvailable: balance.available,
    afterAvailable: 0,
  };

  const newBooked = balance.booked + delta;
  if (newBooked < 0) {
    throw new ApiError(400, `Cannot reduce booked below 0: current booked=${balance.booked}`);
  }

  const newAvailable = balance.inStock - newBooked;
  if (newAvailable < 0) {
    throw new ApiError(400, `Cannot book more than available: available=${balance.available}, requested=${delta}`);
  }

  balance.booked = newBooked;
  balance.available = newAvailable;
  balance.lastMovementAt = new Date();
  await balance.save(session ? { session } : {});

  before.afterBooked = balance.booked;
  before.afterAvailable = balance.available;
  return before;
};

// ── Set inStock (for SET_BALANCE adjustment) ─────────────────────
export const setInStock = async (
  partId: string,
  warehouseId: string,
  newInStock: number,
  session?: ClientSession,
): Promise<BalanceSnapshot> => {
  if (newInStock < 0) throw new ApiError(400, 'inStock cannot be negative');

  const balance = await getOrCreateBalance(partId, warehouseId, undefined, session);

  const before: BalanceSnapshot = {
    beforeInStock: balance.inStock,
    afterInStock: newInStock,
    beforeBooked: balance.booked,
    afterBooked: balance.booked,
    beforeAvailable: balance.available,
    afterAvailable: newInStock - balance.booked,
  };

  if (before.afterAvailable < 0) {
    throw new ApiError(400, `Cannot set inStock below booked: booked=${balance.booked}, new inStock=${newInStock}`);
  }

  balance.inStock = newInStock;
  balance.available = before.afterAvailable;
  balance.lastMovementAt = new Date();
  await balance.save(session ? { session } : {});

  return before;
};

// ── Issue stock (reduce inStock, optionally reduce booked) ───────
export const issueStock = async (
  partId: string,
  warehouseId: string,
  quantity: number,
  fromBooking: boolean,
  session?: ClientSession,
): Promise<BalanceSnapshot> => {
  const balance = await getOrCreateBalance(partId, warehouseId, undefined, session);

  const before: BalanceSnapshot = {
    beforeInStock: balance.inStock,
    afterInStock: 0,
    beforeBooked: balance.booked,
    afterBooked: 0,
    beforeAvailable: balance.available,
    afterAvailable: 0,
  };

  if (fromBooking) {
    if (balance.booked < quantity) {
      throw new ApiError(400, `Cannot issue more than booked: booked=${balance.booked}, requested=${quantity}`);
    }
    balance.inStock -= quantity;
    balance.booked -= quantity;
    // available stays same: (inStock - qty) - (booked - qty) = inStock - booked = available
    balance.available = balance.inStock - balance.booked;
  } else {
    if (balance.available < quantity) {
      throw new ApiError(400, `Cannot issue more than available: available=${balance.available}, requested=${quantity}`);
    }
    balance.inStock -= quantity;
    balance.available = balance.inStock - balance.booked;
  }

  if (balance.inStock < 0) {
    throw new ApiError(400, 'Insufficient stock for issue');
  }

  balance.lastMovementAt = new Date();
  await balance.save(session ? { session } : {});

  before.afterInStock = balance.inStock;
  before.afterBooked = balance.booked;
  before.afterAvailable = balance.available;
  return before;
};

// ── Get balance ──────────────────────────────────────────────────
export const getBalance = async (
  partId: string,
  warehouseId: string,
): Promise<IStockBalance | null> => {
  return StockBalance.findOne({ part: partId, warehouse: warehouseId })
    .populate('part', 'partNo partDescription groupName uom cost reorderLevel status')
    .populate('warehouse', 'warehouseName code');
};

// ── List balances with pagination ────────────────────────────────
const ALLOWED_SORT_FIELDS = new Set([
  'partNo', 'partDescription', 'groupName', 'inStock', 'available',
  'booked', 'uom', 'cost', 'lastMovementAt', 'createdAt',
]);

export const listBalances = async (
  filters: BalanceFilters = {},
  pagination?: PaginationOpts,
): Promise<IStockBalance[] | PaginatedResult<IStockBalance>> => {
  const pipeline: mongoose.PipelineStage[] = [];

  // Match stage
  const match: Record<string, unknown> = {};
  if (filters.partId) match.part = new mongoose.Types.ObjectId(filters.partId);
  if (filters.warehouseId) match.warehouse = new mongoose.Types.ObjectId(filters.warehouseId);
  if (filters.locationId) match.location = new mongoose.Types.ObjectId(filters.locationId);

  if (Object.keys(match).length) pipeline.push({ $match: match });

  // Lookup part for filtering / display
  pipeline.push({
    $lookup: {
      from: 'inventoryitems',
      localField: 'part',
      foreignField: '_id',
      as: 'partDoc',
    },
  });
  pipeline.push({ $unwind: '$partDoc' });

  // Lookup warehouse
  pipeline.push({
    $lookup: {
      from: 'invwarehouses',
      localField: 'warehouse',
      foreignField: '_id',
      as: 'warehouseDoc',
    },
  });
  pipeline.push({ $unwind: '$warehouseDoc' });

  // Text / group search
  const postMatch: Record<string, unknown> = {};
  if (filters.search) {
    const regex = { $regex: escapeRegex(filters.search), $options: 'i' };
    postMatch.$or = [
      { 'partDoc.partNo': regex },
      { 'partDoc.partDescription': regex },
      { 'partDoc.groupName': regex },
    ];
  }
  if (filters.groupName) {
    postMatch['partDoc.groupName'] = { $regex: escapeRegex(filters.groupName), $options: 'i' };
  }
  // Alert status filter
  if (filters.alertStatus === StockAlertStatus.OUT_OF_STOCK) {
    postMatch.available = { $lte: 0 };
  } else if (filters.alertStatus === StockAlertStatus.LOW_STOCK) {
    postMatch.$expr = { $lte: ['$available', '$partDoc.reorderLevel'] };
    postMatch.available = { $gt: 0 };
  }

  if (Object.keys(postMatch).length) pipeline.push({ $match: postMatch });

  if (!pagination) {
    pipeline.push({ $sort: { 'partDoc.partNo': 1 } });
    return StockBalance.aggregate(pipeline);
  }

  const { page, pageSize, sortBy, sortOrder } = pagination;
  const safeSortBy = ALLOWED_SORT_FIELDS.has(sortBy) ? sortBy : 'partNo';

  // Map sort field to aggregate path
  const sortFieldMap: Record<string, string> = {
    partNo: 'partDoc.partNo',
    partDescription: 'partDoc.partDescription',
    groupName: 'partDoc.groupName',
    uom: 'partDoc.uom',
    cost: 'partDoc.cost',
  };
  const sortField = sortFieldMap[safeSortBy] || safeSortBy;

  // Count + paginate
  const countPipeline = [...pipeline, { $count: 'total' }];
  const dataPipeline = [
    ...pipeline,
    { $sort: { [sortField]: sortOrder === 'asc' ? 1 : -1 } as Record<string, 1 | -1> },
    { $skip: (page - 1) * pageSize },
    { $limit: pageSize },
  ];

  const [countResult, items] = await Promise.all([
    StockBalance.aggregate(countPipeline),
    StockBalance.aggregate(dataPipeline),
  ]);

  const totalItems = countResult[0]?.total ?? 0;

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

// ── Compute alert status ─────────────────────────────────────────
export const computeAlertStatus = async (
  partId: string,
  warehouseId: string,
): Promise<StockAlertStatus> => {
  const balance = await StockBalance.findOne({ part: partId, warehouse: warehouseId });
  if (!balance) return StockAlertStatus.OUT_OF_STOCK;

  const item = await InventoryItem.findById(partId);
  if (!item) return StockAlertStatus.OUT_OF_STOCK;

  if (balance.available <= 0) return StockAlertStatus.OUT_OF_STOCK;
  if (balance.available <= item.reorderLevel) return StockAlertStatus.LOW_STOCK;
  return StockAlertStatus.NORMAL;
};
