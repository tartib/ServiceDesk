import StockReturn, { IStockReturn } from '../models/StockReturn';
import { adjustInStock, getOrCreateBalance } from './balanceService';
import { recordMovement } from './movementService';
import { withOptionalTransaction } from './transactionHelper';
import { ReturnCondition, MovementType } from '../types';
import ApiError from '../../../utils/ApiError';
import logger from '../../../utils/logger';

// ── Return stock ─────────────────────────────────────────────────
export const createReturn = async (data: {
  partId: string;
  warehouseId: string;
  quantity: number;
  originalIssueId?: string;
  returnedBy?: string;
  condition: ReturnCondition;
  notes?: string;
  userId: string;
}): Promise<IStockReturn> => {
  if (data.quantity <= 0) throw new ApiError(400, 'Quantity must be greater than 0');
  if (!Object.values(ReturnCondition).includes(data.condition)) {
    throw new ApiError(400, 'Invalid return condition');
  }

  return withOptionalTransaction(async (session) => {
    let snapshot;
    if (data.condition === ReturnCondition.GOOD) {
      snapshot = await adjustInStock(
        data.partId,
        data.warehouseId,
        data.quantity,
        session,
      );
    } else {
      const balance = await getOrCreateBalance(data.partId, data.warehouseId, undefined, session);
      snapshot = {
        beforeInStock: balance.inStock,
        afterInStock: balance.inStock,
        beforeBooked: balance.booked,
        afterBooked: balance.booked,
        beforeAvailable: balance.available,
        afterAvailable: balance.available,
      };
    }

    await recordMovement({
      partId: data.partId,
      warehouseId: data.warehouseId,
      movementType: MovementType.RETURN,
      quantity: data.quantity,
      snapshot,
      referenceType: data.originalIssueId ? 'ISSUE' : undefined,
      referenceId: data.originalIssueId,
      notes: `Condition: ${data.condition}${data.notes ? ' — ' + data.notes : ''}`,
      userId: data.userId,
    }, session);

    const retData = {
      part: data.partId,
      warehouse: data.warehouseId,
      quantity: data.quantity,
      originalIssueId: data.originalIssueId || undefined,
      returnedBy: data.returnedBy,
      condition: data.condition,
      notes: data.notes,
      createdBy: data.userId,
    };

    let stockReturn: IStockReturn;
    if (session) {
      const docs = await StockReturn.create([retData], { session });
      stockReturn = docs[0];
    } else {
      stockReturn = await StockReturn.create(retData);
    }

    logger.info(`Stock return: ${stockReturn._id} (${data.condition})`);
    return stockReturn;
  });
};

// ── List returns ─────────────────────────────────────────────────
export const listReturns = async (filters: {
  partId?: string;
  warehouseId?: string;
  condition?: ReturnCondition;
} = {}): Promise<IStockReturn[]> => {
  const query: Record<string, unknown> = {};
  if (filters.partId) query.part = filters.partId;
  if (filters.warehouseId) query.warehouse = filters.warehouseId;
  if (filters.condition) query.condition = filters.condition;

  return StockReturn.find(query)
    .populate('part', 'partNo partDescription uom')
    .populate('warehouse', 'warehouseName code')
    .populate('createdBy', 'name email')
    .populate('originalIssueId')
    .sort({ createdAt: -1 });
};
