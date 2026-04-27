import mongoose from 'mongoose';
import InvStockTransfer, { IStockTransfer } from '../models/StockTransfer';
import { adjustInStock } from './balanceService';
import { recordMovement } from './movementService';
import { withOptionalTransaction } from './transactionHelper';
import { TransferStatus, MovementType } from '../types';
import ApiError from '../../../utils/ApiError';
import logger from '../../../utils/logger';

// ── Create transfer ──────────────────────────────────────────────
export const createTransfer = async (data: {
  partId: string;
  sourceWarehouseId: string;
  destinationWarehouseId: string;
  quantity: number;
  referenceNo?: string;
  notes?: string;
  userId: string;
}): Promise<IStockTransfer> => {
  if (data.quantity <= 0) throw new ApiError(400, 'Quantity must be greater than 0');
  if (data.sourceWarehouseId === data.destinationWarehouseId) {
    throw new ApiError(400, 'Source and destination warehouses cannot be the same');
  }

  return withOptionalTransaction(async (session) => {
    const srcSnapshot = await adjustInStock(
      data.partId,
      data.sourceWarehouseId,
      -data.quantity,
      session,
    );

    await recordMovement({
      partId: data.partId,
      warehouseId: data.sourceWarehouseId,
      movementType: MovementType.TRANSFER_OUT,
      quantity: data.quantity,
      snapshot: srcSnapshot,
      referenceNo: data.referenceNo,
      notes: data.notes,
      userId: data.userId,
    }, session);

    const destSnapshot = await adjustInStock(
      data.partId,
      data.destinationWarehouseId,
      data.quantity,
      session,
    );

    await recordMovement({
      partId: data.partId,
      warehouseId: data.destinationWarehouseId,
      movementType: MovementType.TRANSFER_IN,
      quantity: data.quantity,
      snapshot: destSnapshot,
      referenceNo: data.referenceNo,
      notes: data.notes,
      userId: data.userId,
    }, session);

    const transferData = {
      part: data.partId,
      sourceWarehouse: data.sourceWarehouseId,
      destinationWarehouse: data.destinationWarehouseId,
      quantity: data.quantity,
      referenceNo: data.referenceNo,
      notes: data.notes,
      status: TransferStatus.COMPLETED,
      completedBy: data.userId,
      completedAt: new Date(),
      createdBy: data.userId,
    };

    let transfer: IStockTransfer;
    if (session) {
      const docs = await InvStockTransfer.create([transferData], { session });
      transfer = docs[0];
    } else {
      transfer = await InvStockTransfer.create(transferData);
    }

    logger.info(`Transfer completed: ${transfer._id}`);
    return transfer;
  });
};

// ── Cancel (only pending) ────────────────────────────────────────
export const cancelTransfer = async (
  transferId: string,
  userId: string,
): Promise<IStockTransfer> => {
  const transfer = await InvStockTransfer.findById(transferId);
  if (!transfer) throw new ApiError(404, 'Transfer not found');
  if (transfer.status !== TransferStatus.PENDING) {
    throw new ApiError(400, `Cannot cancel transfer with status "${transfer.status}"`);
  }
  transfer.status = TransferStatus.CANCELLED;
  transfer.cancelledBy = new mongoose.Types.ObjectId(userId);
  transfer.cancelledAt = new Date();
  await transfer.save();
  logger.info(`Transfer cancelled: ${transferId}`);
  return transfer;
};

// ── List transfers ───────────────────────────────────────────────
export const listTransfers = async (filters: {
  partId?: string;
  sourceWarehouseId?: string;
  destinationWarehouseId?: string;
  warehouseId?: string;
  status?: TransferStatus;
} = {}): Promise<IStockTransfer[]> => {
  const query: Record<string, unknown> = {};
  if (filters.partId) query.part = filters.partId;
  if (filters.sourceWarehouseId) query.sourceWarehouse = filters.sourceWarehouseId;
  if (filters.destinationWarehouseId) query.destinationWarehouse = filters.destinationWarehouseId;
  if (filters.warehouseId) {
    query.$or = [
      { sourceWarehouse: filters.warehouseId },
      { destinationWarehouse: filters.warehouseId },
    ];
  }
  if (filters.status) query.status = filters.status;

  return InvStockTransfer.find(query)
    .populate('part', 'partNo partDescription uom')
    .populate('sourceWarehouse', 'warehouseName code')
    .populate('destinationWarehouse', 'warehouseName code')
    .populate('createdBy', 'name email')
    .populate('completedBy', 'name email')
    .sort({ createdAt: -1 });
};
