import { Request, Response } from 'express';
import * as bookingService from '../services/bookingService';
import { BookingStatus } from '../types';
import ApiResponse from '../../../utils/ApiResponse';
import asyncHandler from '../../../utils/asyncHandler';
import ApiError from '../../../utils/ApiError';

export const bookStock = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?.id;
  if (!userId) throw new ApiError(401, 'User not authenticated');

  const { partId, warehouseId, quantity, referenceType, referenceId, notes } = req.body;
  if (!partId || !warehouseId) throw new ApiError(400, 'partId and warehouseId are required');

  const booking = await bookingService.bookStock({
    partId, warehouseId, quantity, referenceType, referenceId, notes, userId,
  });
  res.status(201).json(new ApiResponse(201, 'Stock booked', { booking }));
});

export const releaseBooking = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?.id;
  if (!userId) throw new ApiError(401, 'User not authenticated');

  const booking = await bookingService.releaseBooking(req.params.id, userId);
  res.json(new ApiResponse(200, 'Booking released', { booking }));
});

export const cancelBooking = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?.id;
  if (!userId) throw new ApiError(401, 'User not authenticated');

  const booking = await bookingService.cancelBooking(req.params.id, userId);
  res.json(new ApiResponse(200, 'Booking cancelled', { booking }));
});

export const listBookings = asyncHandler(async (req: Request, res: Response) => {
  const filters = {
    partId: req.query.partId as string | undefined,
    warehouseId: req.query.warehouseId as string | undefined,
    status: req.query.status as BookingStatus | undefined,
    referenceType: req.query.referenceType as string | undefined,
    referenceId: req.query.referenceId as string | undefined,
  };
  const bookings = await bookingService.listBookings(filters);
  res.json(new ApiResponse(200, 'Bookings retrieved', { bookings }));
});
