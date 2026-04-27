import StockAdjustment, { IStockAdjustment } from '../models/StockAdjustment';
import { adjustInStock, setInStock, getOrCreateBalance } from './balanceService';
import { recordMovement } from './movementService';
import { withOptionalTransaction } from './transactionHelper';
import { AdjustmentType, MovementType } from '../types';
import ApiError from '../../../utils/ApiError';
import logger from '../../../utils/logger';

// ── Adjust stock ─────────────────────────────────────────────────
export const createAdjustment = async (data: {
  partId: string;
  warehouseId: string;
  adjustmentType: AdjustmentType;
  quantity: number;
  reason: string;
  notes?: string;
  userId: string;
}): Promise<IStockAdjustment> => {
  if (!data.reason || !data.reason.trim()) {
    throw new ApiError(400, 'Reason is required for stock adjustments');
  }
  if (!Object.values(AdjustmentType).includes(data.adjustmentType)) {
    throw new ApiError(400, 'Invalid adjustment type');
  }
  if (data.adjustmentType !== AdjustmentType.SET_BALANCE && data.quantity <= 0) {
    throw new ApiError(400, 'Quantity must be greater than 0');
  }

  return withOptionalTransaction(async (session) => {
    let snapshot;

    if (data.adjustmentType === AdjustmentType.INCREASE) {
      snapshot = await adjustInStock(data.partId, data.warehouseId, data.quantity, session);
    } else if (data.adjustmentType === AdjustmentType.DECREASE) {
      const balance = await getOrCreateBalance(data.partId, data.warehouseId, undefined, session);
      const newInStock = balance.inStock - data.quantity;
      if (newInStock < balance.booked) {
        throw new ApiError(400, `Cannot decrease stock below booked quantity: booked=${balance.booked}, resulting inStock=${newInStock}`);
      }
      snapshot = await adjustInStock(data.partId, data.warehouseId, -data.quantity, session);
    } else {
      snapshot = await setInStock(data.partId, data.warehouseId, data.quantity, session);
    }

    await recordMovement({
      partId: data.partId,
      warehouseId: data.warehouseId,
      movementType: MovementType.ADJUSTMENT,
      quantity: data.quantity,
      snapshot,
      referenceType: `ADJUSTMENT_${data.adjustmentType.toUpperCase()}`,
      notes: `${data.reason}${data.notes ? ' — ' + data.notes : ''}`,
      userId: data.userId,
    }, session);

    const adjData = {
      part: data.partId,
      warehouse: data.warehouseId,
      adjustmentType: data.adjustmentType,
      quantity: data.quantity,
      reason: data.reason,
      notes: data.notes,
      beforeInStock: snapshot.beforeInStock,
      afterInStock: snapshot.afterInStock,
      beforeBooked: snapshot.beforeBooked,
      afterBooked: snapshot.afterBooked,
      beforeAvailable: snapshot.beforeAvailable,
      afterAvailable: snapshot.afterAvailable,
      createdBy: data.userId,
    };

    let adjustment: IStockAdjustment;
    if (session) {
      const docs = await StockAdjustment.create([adjData], { session });
      adjustment = docs[0];
    } else {
      adjustment = await StockAdjustment.create(adjData);
    }

    logger.info(`Stock adjustment: ${adjustment._id} (${data.adjustmentType})`);
    return adjustment;
  });
};

// ── List adjustments ─────────────────────────────────────────────
export const listAdjustments = async (filters: {
  partId?: string;
  warehouseId?: string;
  adjustmentType?: AdjustmentType;
} = {}): Promise<IStockAdjustment[]> => {
  const query: Record<string, unknown> = {};
  if (filters.partId) query.part = filters.partId;
  if (filters.warehouseId) query.warehouse = filters.warehouseId;
  if (filters.adjustmentType) query.adjustmentType = filters.adjustmentType;

  return StockAdjustment.find(query)
    .populate('part', 'partNo partDescription uom')
    .populate('warehouse', 'warehouseName code')
    .populate('createdBy', 'name email')
    .sort({ createdAt: -1 });
};
