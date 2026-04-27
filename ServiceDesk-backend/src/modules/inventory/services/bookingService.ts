import mongoose from 'mongoose';
import StockBooking, { IStockBooking } from '../models/StockBooking';
import { adjustBooked } from './balanceService';
import { recordMovement } from './movementService';
import { withOptionalTransaction } from './transactionHelper';
import { BookingStatus, MovementType } from '../types';
import ApiError from '../../../utils/ApiError';
import logger from '../../../utils/logger';

// ── Book stock ───────────────────────────────────────────────────
export const bookStock = async (data: {
  partId: string;
  warehouseId: string;
  quantity: number;
  referenceType?: string;
  referenceId?: string;
  notes?: string;
  userId: string;
}): Promise<IStockBooking> => {
  if (data.quantity <= 0) throw new ApiError(400, 'Quantity must be greater than 0');

  return withOptionalTransaction(async (session) => {
    const snapshot = await adjustBooked(
      data.partId,
      data.warehouseId,
      data.quantity,
      session,
    );

    await recordMovement({
      partId: data.partId,
      warehouseId: data.warehouseId,
      movementType: MovementType.BOOK,
      quantity: data.quantity,
      snapshot,
      referenceType: data.referenceType,
      referenceId: data.referenceId,
      notes: data.notes,
      userId: data.userId,
    }, session);

    if (session) {
      const docs = await StockBooking.create(
        [{
          part: data.partId,
          warehouse: data.warehouseId,
          quantity: data.quantity,
          referenceType: data.referenceType,
          referenceId: data.referenceId,
          notes: data.notes,
          status: BookingStatus.ACTIVE,
          createdBy: data.userId,
        }],
        { session },
      );
      logger.info(`Stock booked: ${docs[0]._id}`);
      return docs[0];
    }
    const booking = await StockBooking.create({
      part: data.partId,
      warehouse: data.warehouseId,
      quantity: data.quantity,
      referenceType: data.referenceType,
      referenceId: data.referenceId,
      notes: data.notes,
      status: BookingStatus.ACTIVE,
      createdBy: data.userId,
    });
    logger.info(`Stock booked: ${booking._id}`);
    return booking;
  });
};

// ── Release booking ──────────────────────────────────────────────
export const releaseBooking = async (
  bookingId: string,
  userId: string,
): Promise<IStockBooking> => {
  return withOptionalTransaction(async (session) => {
    const booking = await StockBooking.findById(bookingId).session(session || null) as IStockBooking;
    if (!booking) throw new ApiError(404, 'Booking not found');
    if (booking.status !== BookingStatus.ACTIVE) {
      throw new ApiError(400, `Cannot release booking with status "${booking.status}"`);
    }

    const snapshot = await adjustBooked(
      booking.part.toString(),
      booking.warehouse.toString(),
      -booking.quantity,
      session,
    );

    await recordMovement({
      partId: booking.part.toString(),
      warehouseId: booking.warehouse.toString(),
      movementType: MovementType.RELEASE_BOOKING,
      quantity: booking.quantity,
      snapshot,
      referenceType: 'BOOKING',
      referenceId: booking._id.toString(),
      notes: `Released booking ${booking._id}`,
      userId,
    }, session);

    booking.status = BookingStatus.RELEASED;
    booking.releasedBy = new mongoose.Types.ObjectId(userId);
    booking.releasedAt = new Date();
    await booking.save(session ? { session } : {});

    logger.info(`Booking released: ${bookingId}`);
    return booking;
  });
};

// ── Cancel booking ───────────────────────────────────────────────
export const cancelBooking = async (
  bookingId: string,
  userId: string,
): Promise<IStockBooking> => {
  return withOptionalTransaction(async (session) => {
    const booking = await StockBooking.findById(bookingId).session(session || null) as IStockBooking;
    if (!booking) throw new ApiError(404, 'Booking not found');
    if (booking.status !== BookingStatus.ACTIVE) {
      throw new ApiError(400, `Cannot cancel booking with status "${booking.status}"`);
    }

    const snapshot = await adjustBooked(
      booking.part.toString(),
      booking.warehouse.toString(),
      -booking.quantity,
      session,
    );

    await recordMovement({
      partId: booking.part.toString(),
      warehouseId: booking.warehouse.toString(),
      movementType: MovementType.RELEASE_BOOKING,
      quantity: booking.quantity,
      snapshot,
      referenceType: 'BOOKING',
      referenceId: booking._id.toString(),
      notes: `Cancelled booking ${booking._id}`,
      userId,
    }, session);

    booking.status = BookingStatus.CANCELLED;
    booking.cancelledBy = new mongoose.Types.ObjectId(userId);
    booking.cancelledAt = new Date();
    await booking.save(session ? { session } : {});

    logger.info(`Booking cancelled: ${bookingId}`);
    return booking;
  });
};

// ── List bookings ────────────────────────────────────────────────
export const listBookings = async (filters: {
  partId?: string;
  warehouseId?: string;
  status?: BookingStatus;
  referenceType?: string;
  referenceId?: string;
} = {}): Promise<IStockBooking[]> => {
  const query: Record<string, unknown> = {};
  if (filters.partId) query.part = filters.partId;
  if (filters.warehouseId) query.warehouse = filters.warehouseId;
  if (filters.status) query.status = filters.status;
  if (filters.referenceType) query.referenceType = filters.referenceType;
  if (filters.referenceId) query.referenceId = filters.referenceId;

  return StockBooking.find(query)
    .populate('part', 'partNo partDescription uom')
    .populate('warehouse', 'warehouseName code')
    .populate('createdBy', 'name email')
    .sort({ createdAt: -1 });
};
