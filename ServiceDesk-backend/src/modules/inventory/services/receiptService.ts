import mongoose from 'mongoose';
import StockReceipt, { IStockReceipt } from '../models/StockReceipt';
import { adjustInStock } from './balanceService';
import { recordMovement } from './movementService';
import { withOptionalTransaction } from './transactionHelper';
import { ReceiptStatus, MovementType } from '../types';
import ApiError from '../../../utils/ApiError';
import logger from '../../../utils/logger';

// ── Create (DRAFT) ───────────────────────────────────────────────
export const createReceipt = async (data: {
  partId: string;
  warehouseId: string;
  locationId?: string;
  quantity: number;
  supplierId?: string;
  referenceNo?: string;
  notes?: string;
  userId: string;
}): Promise<IStockReceipt> => {
  if (data.quantity <= 0) throw new ApiError(400, 'Quantity must be greater than 0');

  const receipt = await StockReceipt.create({
    part: data.partId,
    warehouse: data.warehouseId,
    location: data.locationId || undefined,
    quantity: data.quantity,
    supplierId: data.supplierId,
    referenceNo: data.referenceNo,
    notes: data.notes,
    status: ReceiptStatus.DRAFT,
    createdBy: data.userId,
  });

  logger.info(`Receipt created (DRAFT): ${receipt._id}`);
  return receipt;
};

// ── Confirm ──────────────────────────────────────────────────────
export const confirmReceipt = async (
  receiptId: string,
  userId: string,
): Promise<IStockReceipt> => {
  return withOptionalTransaction(async (session) => {
    const receipt = await StockReceipt.findById(receiptId).session(session || null) as IStockReceipt;
    if (!receipt) throw new ApiError(404, 'Receipt not found');
    if (receipt.status !== ReceiptStatus.DRAFT) {
      throw new ApiError(400, `Cannot confirm receipt with status "${receipt.status}"`);
    }

    const snapshot = await adjustInStock(
      receipt.part.toString(),
      receipt.warehouse.toString(),
      receipt.quantity,
      session,
      receipt.location?.toString(),
    );

    await recordMovement({
      partId: receipt.part.toString(),
      warehouseId: receipt.warehouse.toString(),
      locationId: receipt.location?.toString(),
      movementType: MovementType.RECEIVE,
      quantity: receipt.quantity,
      snapshot,
      referenceType: 'RECEIPT',
      referenceId: receipt._id.toString(),
      referenceNo: receipt.referenceNo,
      notes: receipt.notes,
      userId,
    }, session);

    receipt.status = ReceiptStatus.CONFIRMED;
    receipt.confirmedBy = new mongoose.Types.ObjectId(userId);
    receipt.confirmedAt = new Date();
    await receipt.save(session ? { session } : {});

    logger.info(`Receipt confirmed: ${receiptId}`);
    return receipt;
  });
};

// ── Cancel ───────────────────────────────────────────────────────
export const cancelReceipt = async (
  receiptId: string,
  userId: string,
): Promise<IStockReceipt> => {
  const receipt = await StockReceipt.findById(receiptId);
  if (!receipt) throw new ApiError(404, 'Receipt not found');
  if (receipt.status !== ReceiptStatus.DRAFT) {
    throw new ApiError(400, `Cannot cancel receipt with status "${receipt.status}"`);
  }

  receipt.status = ReceiptStatus.CANCELLED;
  receipt.cancelledBy = new mongoose.Types.ObjectId(userId);
  receipt.cancelledAt = new Date();
  await receipt.save();

  logger.info(`Receipt cancelled: ${receiptId}`);
  return receipt;
};

// ── List ─────────────────────────────────────────────────────────
export const listReceipts = async (filters: {
  partId?: string;
  warehouseId?: string;
  status?: ReceiptStatus;
} = {}): Promise<IStockReceipt[]> => {
  const query: Record<string, unknown> = {};
  if (filters.partId) query.part = filters.partId;
  if (filters.warehouseId) query.warehouse = filters.warehouseId;
  if (filters.status) query.status = filters.status;

  return StockReceipt.find(query)
    .populate('part', 'partNo partDescription uom')
    .populate('warehouse', 'warehouseName code')
    .populate('createdBy', 'name email')
    .populate('confirmedBy', 'name email')
    .sort({ createdAt: -1 });
};
