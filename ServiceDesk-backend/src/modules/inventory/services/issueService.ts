import mongoose from 'mongoose';
import StockIssue, { IStockIssue } from '../models/StockIssue';
import StockBooking from '../models/StockBooking';
import { issueStock } from './balanceService';
import { recordMovement } from './movementService';
import { withOptionalTransaction } from './transactionHelper';
import { MovementType, BookingStatus } from '../types';
import ApiError from '../../../utils/ApiError';
import logger from '../../../utils/logger';

// ── Issue stock ──────────────────────────────────────────────────
export const createIssue = async (data: {
  partId: string;
  warehouseId: string;
  quantity: number;
  referenceType?: string;
  referenceId?: string;
  issuedTo?: string;
  bookingId?: string;
  notes?: string;
  userId: string;
}): Promise<IStockIssue> => {
  if (data.quantity <= 0) throw new ApiError(400, 'Quantity must be greater than 0');

  return withOptionalTransaction(async (session) => {
    const fromBooking = !!data.bookingId;

    if (fromBooking) {
      const booking = await StockBooking.findById(data.bookingId).session(session || null);
      if (!booking) throw new ApiError(404, 'Booking not found');
      if (booking.status !== BookingStatus.ACTIVE) {
        throw new ApiError(400, 'Booking is not active');
      }
      if (booking.quantity < data.quantity) {
        throw new ApiError(400, `Cannot issue more than booked: booked=${booking.quantity}, requested=${data.quantity}`);
      }

      if (booking.quantity === data.quantity) {
        booking.status = BookingStatus.RELEASED;
        booking.releasedAt = new Date();
        booking.releasedBy = new mongoose.Types.ObjectId(data.userId);
      } else {
        booking.quantity -= data.quantity;
      }
      await booking.save(session ? { session } : {});
    }

    const snapshot = await issueStock(
      data.partId,
      data.warehouseId,
      data.quantity,
      fromBooking,
      session,
    );

    await recordMovement({
      partId: data.partId,
      warehouseId: data.warehouseId,
      movementType: MovementType.ISSUE,
      quantity: data.quantity,
      snapshot,
      referenceType: data.referenceType,
      referenceId: data.referenceId,
      notes: data.notes,
      userId: data.userId,
    }, session);

    const issueData = {
      part: data.partId,
      warehouse: data.warehouseId,
      quantity: data.quantity,
      referenceType: data.referenceType,
      referenceId: data.referenceId,
      issuedTo: data.issuedTo,
      bookingId: data.bookingId || undefined,
      notes: data.notes,
      createdBy: data.userId,
    };

    let issue: IStockIssue;
    if (session) {
      const docs = await StockIssue.create([issueData], { session });
      issue = docs[0];
    } else {
      issue = await StockIssue.create(issueData);
    }

    logger.info(`Stock issued: ${issue._id}`);
    return issue;
  });
};

// ── List issues ──────────────────────────────────────────────────
export const listIssues = async (filters: {
  partId?: string;
  warehouseId?: string;
  referenceType?: string;
  referenceId?: string;
} = {}): Promise<IStockIssue[]> => {
  const query: Record<string, unknown> = {};
  if (filters.partId) query.part = filters.partId;
  if (filters.warehouseId) query.warehouse = filters.warehouseId;
  if (filters.referenceType) query.referenceType = filters.referenceType;
  if (filters.referenceId) query.referenceId = filters.referenceId;

  return StockIssue.find(query)
    .populate('part', 'partNo partDescription uom')
    .populate('warehouse', 'warehouseName code')
    .populate('createdBy', 'name email')
    .populate('bookingId')
    .sort({ createdAt: -1 });
};
