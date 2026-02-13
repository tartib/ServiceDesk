import { Request, Response } from 'express';
import * as ratingService from '../services/ratingService';

export const getEmployeeRatingHistory = async (req: Request, res: Response) => {
  try {
    const { employeeId } = req.params;

    const ratings = await ratingService.getEmployeeRatingHistory(employeeId);

    res.status(200).json({
      success: true,
      data: ratings,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Server error',
    });
  }
};

export const getCurrentMonthRating = async (req: Request, res: Response) => {
  try {
    const { employeeId } = req.params;

    const rating = await ratingService.getCurrentMonthRating(employeeId);

    if (!rating) {
      return res.status(404).json({
        success: false,
        error: 'Rating not found for current month',
      });
    }

    res.status(200).json({
      success: true,
      data: rating,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Server error',
    });
  }
};
